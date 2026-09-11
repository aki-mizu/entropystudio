//! Native Vanity-address grinding for Studio's Key Station wallets.
//!
//! The upstream feature is deliberately a calculator rather than a source of
//! entropy: a counter either extends a BIP39 passphrase with a base-62
//! odometer or replaces the account component of the selected derivation
//! path.  The sensitive key material and every BIP32/PBKDF2 operation live in
//! Rust; React Native only starts a native session, polls typed snapshots, and
//! renders their results.

use crate::error::EntropyStudioError;
use bitcoin::bech32::{Bech32m, ByteIterExt, Fe32, Fe32IterExt, Hrp};
use bitcoin::{
    hashes::Hash, Address, KnownHrp, Network, PubkeyHash, ScriptBuf, WPubkeyHash, WitnessProgram,
    WitnessVersion,
};
use num_bigint::BigUint;
use std::collections::VecDeque;
use std::sync::{
    atomic::{AtomicBool, AtomicUsize, Ordering},
    mpsc, Arc, Mutex, OnceLock,
};
use std::thread;
use std::time::Instant;
use unicode_normalization::UnicodeNormalization;

const HARDENED: u32 = 1 << 31;
const MAX_INDEX: u32 = HARDENED - 1;
const MAX_PASSPHRASE_LENGTH: u8 = 32;
const MAX_PASSPHRASE_BYTES: usize = 256;
const MAX_MNEMONIC_BYTES: usize = 1024;
const MAX_PATH_COMPONENTS: usize = 16;
// Match upstream vanity-worker.js: start promptly, then adapt each worker's
// range toward a 120 ms yield interval.
const INITIAL_PASSPHRASE_CHUNK_SIZE: u64 = 16;
const INITIAL_DERIVATION_CHUNK_SIZE: u64 = 512;
const MIN_CHUNK_SIZE: u64 = 8;
const MAX_CHUNK_SIZE: u64 = 8_192;
const TARGET_CHUNK_MILLISECONDS: u64 = 120;
const MAX_WORKERS: u8 = 64;
const BASE58_ALPHABET: &str = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BECH32_ALPHABET: &str = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const UPSTREAM_GRIND_HEADER_BYTES: usize = 12;
const UPSTREAM_GRIND_RECORD_BYTES: usize = 106;
const UPSTREAM_GRIND_SUFFIX_BYTES: usize = 32;
const UPSTREAM_GRIND_PAYLOAD_BYTES: usize = 66;
// The JS side polls about every 100 ms. A native worker can finish more often
// on a fast device, especially when all 64 upstream-allowed workers are
// active, so retain one aggregate snapshot instead of queuing UI work.
const MAX_BACKGROUND_CHUNK_SNAPSHOTS: usize = 1;
// Studio renders at most 100 matches.  Keep that same fixed bound in the
// native queue while carrying the exact cumulative total separately.
const MAX_BACKGROUND_RETAINED_MATCHES: usize = 100;
const BENCHMARK_PREFIX: &str = "bc1qqqqqqqqqqqq";
const BENCHMARK_MNEMONIC: &str =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

static VANITY_BENCHMARK: OnceLock<VanityBenchmark> = OnceLock::new();

/// Which wallet dial the vanity counter turns.
#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum VanityMethod {
    Passphrase,
    Derivation,
}

/// The mainnet output encoded for each candidate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum VanityScript {
    P2pkh,
    P2shP2wpkh,
    P2wpkh,
    P2tr,
    SilentPayments,
}

/// The first semantic condition which prevents a Vanity run.
///
/// The UI maps this typed state to upstream-rendered copy.  Keeping the
/// condition separate from its message means the native layer remains the
/// single authority for input admission without owning presentation strings.
#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum VanityValidationKind {
    Valid,
    MissingMnemonic,
    MnemonicTooLong,
    InvalidMnemonic,
    PassphraseTooLong,
    /// The account path does not have the required `m` root / slash shape.
    /// This maps to upstream's path-root error, rather than the distinct
    /// invalid-index error below.
    PathRoot,
    /// A syntactically present path component is not a BIP32 child index.
    PathIndex,
    PathTooLong,
    MissingAccountComponents,
    NonMainnetCoinType,
    InvalidBranchIndex,
    InvalidAddressIndex,
    InvalidPrefix,
    PrefixTooShort,
    PrefixTooLong,
    PrefixAlphabet,
    SilentPaymentParity,
    InvalidPassphraseLength,
    InvalidStart,
    InvalidCount,
    /// A passphrase range has zero candidates.
    PassphraseRangeMinimum,
    /// A passphrase counter begins beyond its fixed-width odometer space.
    PassphraseStartBeyond,
    /// A passphrase range runs past its fixed-width odometer space.
    PassphraseRangePast,
    /// A passphrase range exceeds the native 64-bit counter space.
    PassphraseRangePast64Bit,
    /// A derivation-account range has zero accounts.
    DerivationRangeMinimum,
    /// A derivation-account range begins after the final BIP32 child index.
    DerivationStartBeyond,
    /// A derivation-account range runs past the final BIP32 child index.
    DerivationRangePast,
    RunCleared,
}

/// Raw Studio drafts used to prepare one Vanity run.
///
/// Numeric fields intentionally cross as strings: this preserves temporary
/// input states such as an empty field or a value beyond u64 so Rust can
/// classify them without a TypeScript parser silently changing a counter.
#[derive(Debug, uniffi::Record)]
pub struct VanityRunInput {
    pub method: VanityMethod,
    pub script: VanityScript,
    pub mnemonic: String,
    pub starting_passphrase: String,
    pub account_path: String,
    pub branch_index: String,
    pub branch_hardened: bool,
    pub address_index: String,
    pub address_hardened: bool,
    pub prefix: String,
    pub passphrase_length: String,
    pub start: String,
    pub count: String,
    /// Upstream accepts this as a numeric browser field, clamps it to 1–64,
    /// and falls back to one worker for an incomplete draft.
    pub workers: String,
}

/// Native form state and static metadata for the selected script.
#[derive(Debug, Clone, uniffi::Record)]
pub struct VanityInputState {
    pub valid: bool,
    pub validation_kind: VanityValidationKind,
    /// NFKD-normalized, boundary-trimmed mnemonic length in UTF-8 bytes.
    /// No mnemonic text is retained in this presentation state.
    pub normalized_mnemonic_byte_length: u32,
    /// NFKD-normalized starting-passphrase length in UTF-8 bytes.  Unlike a
    /// mnemonic, a BIP39 passphrase preserves boundary whitespace.
    pub normalized_starting_passphrase_byte_length: u32,
    /// The native vanity buffer limit for a normalized mnemonic.
    pub maximum_mnemonic_byte_length: u32,
    /// The native vanity buffer limit for a normalized starting passphrase.
    pub maximum_starting_passphrase_byte_length: u32,
    /// The largest accepted fixed-width base-62 suffix length.
    pub maximum_passphrase_length: u8,
    /// The deepest account path accepted by the native grinder.
    pub maximum_path_components: u8,
    /// The largest unhardened BIP32 child index accepted by the grinder.
    pub maximum_bip32_index: u32,
    /// The parsed coin-type component when the account path reaches it.
    /// `None` keeps a missing component distinct from Bitcoin mainnet (0).
    pub coin_type: Option<u32>,
    /// The exclusive candidate-count limit for the selected method, rendered
    /// exactly so presentation never needs to perform 64-bit arithmetic.
    /// It is absent only while a passphrase-length draft is invalid.
    pub counter_limit: Option<String>,
    pub normalized_prefix: String,
    pub fixed_prefix: String,
    pub prefix_alphabet: String,
    /// The constrained first free character for Silent Payment codes, or
    /// empty for the other address types.
    pub first_variable_characters: String,
    pub maximum_prefix_length: u16,
    /// The full selected path.  In derivation mode this retains the source
    /// account value; each result carries its concrete replacement.
    pub path: String,
    /// BIP-352 paths are explicit so presentation never recreates protocol
    /// path rules.  Both fields are empty outside Silent Payments.
    pub silent_payment_scan_path: String,
    pub silent_payment_spend_path: String,
    pub account_hardened: bool,
    pub passphrase_length: u8,
    pub start: u64,
    pub count: u64,
    pub total_count: u64,
    /// The native-normalized number of concurrent grinder ranges.
    pub workers: u8,
    /// Exact decimal expected candidates per matching address, including the
    /// constrained BIP-352 scan-key parity character.
    pub expected_candidates: String,
}

/// One found candidate.  `candidate_passphrase` is sensitive for a
/// passphrase grind and is returned only for a matching address.
#[derive(Debug, Clone, uniffi::Record)]
pub struct VanityMatch {
    pub counter: u64,
    pub account_index: Option<u32>,
    pub candidate_passphrase: String,
    pub path: String,
    pub address: String,
    /// A passphrase match changes the wallet's master fingerprint; a
    /// derivation match retains the selected source fingerprint.
    pub master_fingerprint: Option<String>,
}

/// The result of one bounded native work step.
#[derive(Debug, Clone, uniffi::Record)]
pub struct VanityChunk {
    /// Candidates tested in this call.
    pub processed: u64,
    pub total_processed: u64,
    /// All matching candidates found so far, including records retained only
    /// as a count after the bounded background-result buffer fills.
    pub total_found: u64,
    pub total_count: u64,
    pub next_counter: u64,
    pub progress_percent: f64,
    pub elapsed_milliseconds: u64,
    pub candidates_per_second: f64,
    pub matches: Vec<VanityMatch>,
    pub complete: bool,
    pub stopped: bool,
    /// The native pool could not complete its upstream grinder work.  This is
    /// distinct from a user-requested stop so the UI can surface its existing
    /// generic native-operation error rather than describe it as a stop.
    pub failed: bool,
}

/// Per-worker rates for EntropyLab's fixed, public Vanity benchmark samples.
///
/// The samples mirror upstream's browser benchmark: a BIP39 test-vector
/// mnemonic and a deterministic BIP32 node. No wallet state crosses this API.
#[derive(Debug, Clone, uniffi::Record)]
pub struct VanityBenchmark {
    pub passphrase_candidates_per_second: f64,
    pub derivation_candidates_per_second: f64,
    pub silent_payment_candidates_per_second: f64,
}

#[derive(Debug, Clone, Copy)]
struct PathComponent {
    index: u32,
    hardened: bool,
}

impl PathComponent {
    fn encoded(self) -> u32 {
        self.index | if self.hardened { HARDENED } else { 0 }
    }
}

#[derive(Debug, Clone)]
struct VanityScriptMetadata {
    fixed_prefix: &'static str,
    max_length: u16,
    bech32: bool,
    first_variable_characters: &'static str,
}

fn script_metadata(script: VanityScript) -> VanityScriptMetadata {
    match script {
        VanityScript::P2pkh => VanityScriptMetadata {
            fixed_prefix: "1",
            max_length: 34,
            bech32: false,
            first_variable_characters: "",
        },
        VanityScript::P2shP2wpkh => VanityScriptMetadata {
            fixed_prefix: "3",
            max_length: 34,
            bech32: false,
            first_variable_characters: "",
        },
        VanityScript::P2wpkh => VanityScriptMetadata {
            fixed_prefix: "bc1q",
            max_length: 42,
            bech32: true,
            first_variable_characters: "",
        },
        VanityScript::P2tr => VanityScriptMetadata {
            fixed_prefix: "bc1p",
            max_length: 62,
            bech32: true,
            first_variable_characters: "",
        },
        VanityScript::SilentPayments => VanityScriptMetadata {
            fixed_prefix: "sp1qq",
            max_length: 116,
            bech32: true,
            first_variable_characters: "gf2tvdw0",
        },
    }
}

/// Native counterpart of upstream's live prefix filter.  It intentionally
/// filters only characters; it does not synthesize the required fixed prefix
/// or turn an incomplete draft into a valid one.
#[uniffi::export]
pub fn vanity_filter_prefix(value: String, script: VanityScript) -> String {
    let metadata = script_metadata(script);
    let allowed = if metadata.bech32 {
        format!("{}{}", metadata.fixed_prefix, BECH32_ALPHABET)
    } else {
        BASE58_ALPHABET.to_owned()
    };
    let mut filtered = String::with_capacity(value.len());
    for character in value.chars() {
        if character.is_whitespace() {
            continue;
        }
        let character = if metadata.bech32 {
            character.to_ascii_lowercase()
        } else {
            character
        };
        if character.is_ascii() && allowed.contains(character) {
            filtered.push(character);
        }
    }
    filtered
}

/// Validates a raw form without retaining its mnemonic or passphrase.
#[uniffi::export]
pub fn vanity_input_state(input: VanityRunInput) -> VanityInputState {
    let presentation = InputPresentation::from_input(&input);
    match validate_input(input) {
        Ok(validated) => {
            let state =
                input_state_from_config(&validated.config, VanityValidationKind::Valid, true);
            drop(validated);
            state
        }
        Err(kind) => presentation.into_state(kind),
    }
}

/// Measures the pinned upstream grinder once for each public Vanity workload.
///
/// These are per-worker rates; a run multiplies its selected sample by its
/// configured native worker count.
#[uniffi::export]
pub fn vanity_benchmark() -> VanityBenchmark {
    VANITY_BENCHMARK
        .get_or_init(measure_vanity_benchmark)
        .clone()
}

/// The upstream UI defaults its Workers input to the available CPU-core count.
#[uniffi::export]
pub fn vanity_default_worker_count() -> u8 {
    thread::available_parallelism()
        .map(|parallelism| parallelism.get())
        .unwrap_or(1)
        .min(usize::from(MAX_WORKERS)) as u8
}

/// The upstream FFI's 78-byte xprv serialization. Its private key begins at
/// byte 46.
type VanityNode = [u8; 78];

struct ValidatedInput {
    config: VanityRunConfig,
    mnemonic: String,
    starting_passphrase: String,
}

impl ValidatedInput {
    fn into_parts(self) -> (VanityRunConfig, String, String) {
        (self.config, self.mnemonic, self.starting_passphrase)
    }
}

#[derive(Debug, Clone)]
struct VanityRunConfig {
    method: VanityMethod,
    script: VanityScript,
    prefix: String,
    path: Vec<PathComponent>,
    account_hardened: bool,
    passphrase_length: u8,
    start: u64,
    count: u64,
    workers: u8,
    expected_candidates: String,
    presentation: VanityValidationMetadata,
}

impl VanityRunConfig {
    fn end(&self) -> u64 {
        // Validation establishes this invariant without an overflow.
        self.start + self.count
    }
}

/// Non-secret facts needed to describe a validated (or rejected) form.
///
/// The source mnemonic and passphrase never cross this type: their
/// normalized byte lengths are enough for the upstream error copy, while the
/// sensitive text remains inside the validation/run types.
#[derive(Debug, Clone, Copy)]
struct VanityValidationMetadata {
    normalized_mnemonic_byte_length: u32,
    normalized_starting_passphrase_byte_length: u32,
    coin_type: Option<u32>,
    counter_limit: Option<u64>,
}

enum RunSecrets {
    Passphrase {
        mnemonic: String,
        starting_passphrase: String,
    },
    Derivation {
        parent: Option<VanityNode>,
    },
    Cleared,
}

impl RunSecrets {
    fn clear(&mut self) {
        drop(std::mem::replace(self, Self::Cleared));
    }
}

struct VanityRunState {
    config: VanityRunConfig,
    secrets: RunSecrets,
    source_fingerprint: String,
    cursor: u64,
    worker_chunk_size: u64,
    total_processed: u64,
    total_found: u64,
    complete: bool,
    stopped: bool,
    failed: bool,
    cleared: bool,
    /// A native background pool owns the candidate ranges.  Synchronous
    /// `next_chunk` calls must not also admit candidates from those ranges.
    background_active: bool,
    started_at: Instant,
}

impl VanityRunState {
    fn from_validated(input: ValidatedInput) -> Result<Self, EntropyStudioError> {
        let (config, mnemonic, starting_passphrase) = input.into_parts();
        let cursor = config.start;
        let result = match config.method {
            VanityMethod::Passphrase => Self {
                config,
                secrets: RunSecrets::Passphrase {
                    mnemonic,
                    starting_passphrase,
                },
                source_fingerprint: String::new(),
                cursor,
                worker_chunk_size: INITIAL_PASSPHRASE_CHUNK_SIZE,
                total_processed: 0,
                total_found: 0,
                complete: false,
                stopped: false,
                failed: false,
                cleared: false,
                background_active: false,
                started_at: Instant::now(),
            },
            VanityMethod::Derivation => {
                let seed = seed_from_normalized(&mnemonic, &starting_passphrase)?;
                // The derivation run retains the fixed parent node, not the
                // source passphrase.  It is only needed to make the seed.
                drop(starting_passphrase);
                let master = master_node(&seed)?;
                drop(mnemonic);
                let source_fingerprint = node_fingerprint(&master)?;
                let Some(parent) = derive_path_strict(master, &config.path[..2])? else {
                    return Err(EntropyStudioError::InvalidMasterKey);
                };
                Self {
                    config,
                    secrets: RunSecrets::Derivation {
                        parent: Some(parent),
                    },
                    source_fingerprint,
                    cursor,
                    worker_chunk_size: INITIAL_DERIVATION_CHUNK_SIZE,
                    total_processed: 0,
                    total_found: 0,
                    complete: false,
                    stopped: false,
                    failed: false,
                    cleared: false,
                    background_active: false,
                    started_at: Instant::now(),
                }
            }
        };
        Ok(result)
    }

    fn clear(&mut self) {
        self.secrets.clear();
        self.source_fingerprint.clear();
        self.stopped = true;
        self.complete = true;
        self.cleared = true;
        self.background_active = false;
    }

    fn input_state(&self) -> VanityInputState {
        input_state_from_config(
            &self.config,
            if self.cleared {
                VanityValidationKind::RunCleared
            } else {
                VanityValidationKind::Valid
            },
            !self.cleared,
        )
    }

    fn chunk(&mut self, stop_requested: &AtomicBool) -> Result<VanityChunk, EntropyStudioError> {
        if self.cleared {
            return Err(EntropyStudioError::VanityRunCleared);
        }

        let elapsed_milliseconds = self
            .started_at
            .elapsed()
            .as_millis()
            .min(u128::from(u64::MAX)) as u64;
        if self.background_active {
            // `start` switches this object to the polling API.  Returning a
            // snapshot rather than entering a second grinder prevents a
            // concurrent caller from overlapping the pool's fixed ranges.
            return Ok(self.chunk_result(0, Vec::new(), elapsed_milliseconds));
        }
        if self.complete || self.stopped || stop_requested.load(Ordering::Acquire) {
            self.stopped |= stop_requested.load(Ordering::Acquire);
            self.complete = true;
            return Ok(self.chunk_result(0, Vec::new(), elapsed_milliseconds));
        }

        let remaining = self.config.end() - self.cursor;
        let budget = self
            .worker_chunk_size
            .saturating_mul(u64::from(self.config.workers))
            .min(remaining);
        // Reuse upstream's Rust grinder for the whole bounded range.  The
        // Studio layer owns only the typed session and FFI adaptation around
        // that canonical candidate engine.
        let work_started_at = Instant::now();
        let (processed, matches) = grind_upstream_ranges(
            &self.config,
            &self.secrets,
            &self.source_fingerprint,
            self.cursor,
            budget,
        )?;
        let work_milliseconds = work_started_at.elapsed().as_millis().max(1) as u64;
        let worker_requested = budget.div_ceil(u64::from(self.config.workers));
        self.worker_chunk_size = upstream_next_chunk_size(worker_requested, work_milliseconds);
        self.cursor += processed;
        self.total_processed += processed;
        self.total_found = self.total_found.saturating_add(matches.len() as u64);

        if self.cursor == self.config.end() || self.stopped {
            self.complete = true;
        }
        let elapsed_milliseconds = self
            .started_at
            .elapsed()
            .as_millis()
            .min(u128::from(u64::MAX)) as u64;
        Ok(self.chunk_result(processed, matches, elapsed_milliseconds))
    }

    /// Transfers immutable input material into a background-owned job. The
    /// state mutex is released before any candidate work begins, so UI reads
    /// and cancellation are never held up by PBKDF2/BIP32 work.
    fn begin_background(&mut self) -> Option<BackgroundPoolJob> {
        if self.cleared {
            return None;
        }
        self.background_active = true;
        Some(BackgroundPoolJob {
            config: Arc::new(self.config.clone()),
            secrets: Arc::new(std::mem::replace(&mut self.secrets, RunSecrets::Cleared)),
            source_fingerprint: Arc::<str>::from(std::mem::take(&mut self.source_fingerprint)),
            start: self.cursor,
            count: self.config.end().saturating_sub(self.cursor),
        })
    }

    /// Publishes one completed persistent-worker step as a typed aggregate
    /// snapshot.  Bucket completion can be out of counter order, just as it
    /// is in upstream's independent Web Workers, so `next_counter` follows
    /// the upstream display convention of start plus all completed work.
    fn record_background_progress(
        &mut self,
        processed: u64,
        found: u64,
        matches: Vec<VanityMatch>,
    ) -> Option<VanityChunk> {
        if self.cleared {
            return None;
        }
        debug_assert!(processed <= self.config.count.saturating_sub(self.total_processed));
        self.total_processed = self
            .total_processed
            .saturating_add(processed)
            .min(self.config.count);
        self.total_found = self.total_found.saturating_add(found);
        self.cursor = self.config.start.saturating_add(self.total_processed);
        let elapsed_milliseconds = self
            .started_at
            .elapsed()
            .as_millis()
            .min(u128::from(u64::MAX)) as u64;
        Some(self.chunk_result(processed, matches, elapsed_milliseconds))
    }

    /// Produces the single terminal pool snapshot after every native worker
    /// has exited.  The caller clears the retained state only after this
    /// record has been made available to the JS polling side.
    fn finish_background(&mut self, stopped: bool, failed: bool) -> Option<VanityChunk> {
        if self.cleared {
            return None;
        }
        self.background_active = false;
        self.failed |= failed;
        self.stopped |= stopped || self.failed;
        self.complete = true;
        let elapsed_milliseconds = self
            .started_at
            .elapsed()
            .as_millis()
            .min(u128::from(u64::MAX)) as u64;
        Some(self.chunk_result(0, Vec::new(), elapsed_milliseconds))
    }

    fn chunk_result(
        &self,
        processed: u64,
        matches: Vec<VanityMatch>,
        elapsed_milliseconds: u64,
    ) -> VanityChunk {
        let candidates_per_second = if elapsed_milliseconds == 0 {
            0.0
        } else {
            self.total_processed as f64 / (elapsed_milliseconds as f64 / 1000.0)
        };
        VanityChunk {
            processed,
            total_processed: self.total_processed,
            total_found: self.total_found,
            total_count: self.config.count,
            next_counter: self.cursor,
            progress_percent: if self.config.count == 0 {
                100.0
            } else {
                self.total_processed as f64 * 100.0 / self.config.count as f64
            },
            elapsed_milliseconds,
            candidates_per_second,
            matches,
            complete: self.complete,
            stopped: self.stopped,
            failed: self.failed,
        }
    }
}

/// Immutable material shared by a native background pool.  It deliberately
/// does not retain `VanityRun` itself: dropping a UniFFI object must still be
/// able to signal cancellation without an internal self-reference keeping the
/// object alive.
struct BackgroundPoolJob {
    config: Arc<VanityRunConfig>,
    secrets: Arc<RunSecrets>,
    source_fingerprint: Arc<str>,
    start: u64,
    count: u64,
}

enum BackgroundWorkerEvent {
    Progress {
        processed: u64,
        found: u64,
        matches: Vec<VanityMatch>,
    },
    Failed,
    Finished,
}

impl Drop for VanityRunState {
    fn drop(&mut self) {
        self.clear();
    }
}

/// A native-owned session.  `next_chunk` has a deliberately small bounded
/// work budget, so React Native can schedule another call and Stop can land
/// between chunks without reimplementing a worker protocol in TypeScript.
#[derive(uniffi::Object)]
pub struct VanityRun {
    inner: Arc<Mutex<VanityRunState>>,
    stop_requested: Arc<AtomicBool>,
    background_chunks: Arc<Mutex<VecDeque<VanityChunk>>>,
    /// `clear`/Drop disable publishing before clearing the queue so an
    /// in-flight worker cannot repopulate it with stale records.
    accept_background_chunks: Arc<AtomicBool>,
    background_started: AtomicBool,
}

#[uniffi::export]
impl VanityRun {
    #[uniffi::constructor]
    pub fn new(input: VanityRunInput) -> Result<Arc<Self>, EntropyStudioError> {
        let validated =
            validate_input(input).map_err(|_| EntropyStudioError::InvalidVanityInput)?;
        Ok(Arc::new(Self {
            inner: Arc::new(Mutex::new(VanityRunState::from_validated(validated)?)),
            stop_requested: Arc::new(AtomicBool::new(false)),
            background_chunks: Arc::new(Mutex::new(VecDeque::new())),
            accept_background_chunks: Arc::new(AtomicBool::new(true)),
            background_started: AtomicBool::new(false),
        }))
    }

    pub fn state(&self) -> VanityInputState {
        let state = self
            .inner
            .lock()
            .expect("VanityRun state mutex is not poisoned");
        state.input_state()
    }

    pub fn next_chunk(&self) -> Result<VanityChunk, EntropyStudioError> {
        let mut state = self
            .inner
            .lock()
            .expect("VanityRun state mutex is not poisoned");
        state.chunk(&self.stop_requested)
    }

    /// Begins the native-owned grinder loop. It never calls into JavaScript:
    /// the UI drains typed completed chunks with `take_chunks` at its own
    /// display cadence, so grinding does not wait for a JS timer frame.
    pub fn start(&self) -> bool {
        if self.background_started.swap(true, Ordering::AcqRel) {
            return false;
        }
        let inner = Arc::clone(&self.inner);
        let stop_requested = Arc::clone(&self.stop_requested);
        let background_chunks = Arc::clone(&self.background_chunks);
        let accept_background_chunks = Arc::clone(&self.accept_background_chunks);
        let job = {
            let mut state = inner.lock().expect("VanityRun state mutex is not poisoned");
            state.begin_background()
        };
        let Some(job) = job else {
            self.background_started.store(false, Ordering::Release);
            return false;
        };
        let pool_inner = Arc::clone(&inner);
        let pool_stop_requested = Arc::clone(&stop_requested);
        let pool_background_chunks = Arc::clone(&background_chunks);
        let pool_accept_background_chunks = Arc::clone(&accept_background_chunks);
        let spawned = thread::Builder::new()
            .name("entropystudio-vanity-supervisor".to_owned())
            .spawn(move || {
                run_background_pool(
                    pool_inner,
                    pool_stop_requested,
                    pool_background_chunks,
                    pool_accept_background_chunks,
                    job,
                );
            });
        if spawned.is_err() {
            // A resource-exhausted process must still wake the polling UI.
            // Do this tiny state-only terminal transition on the caller;
            // there are no candidate workers to join in this failure path.
            stop_requested.store(true, Ordering::Release);
            let terminal = inner
                .lock()
                .expect("VanityRun state mutex is not poisoned")
                .finish_background(true, true);
            if let Some(chunk) = terminal {
                publish_background_chunk(&background_chunks, &accept_background_chunks, chunk);
            }
            if let Ok(mut state) = inner.lock() {
                state.clear();
            }
        }
        true
    }

    /// Returns and clears chunks completed by the background grinder.
    pub fn take_chunks(&self) -> Vec<VanityChunk> {
        self.background_chunks
            .lock()
            .expect("VanityRun chunk queue mutex is not poisoned")
            .drain(..)
            .collect()
    }

    /// Asks the active bounded upstream work step to stop. A currently
    /// executing adaptive chunk completes first; no subsequent chunk is
    /// admitted.
    pub fn stop(&self) {
        self.stop_requested.store(true, Ordering::Release);
    }

    /// Makes this session unusable. The caller should drop its object
    /// reference after clearing.
    pub fn clear(&self) {
        self.stop_requested.store(true, Ordering::Release);
        self.accept_background_chunks
            .store(false, Ordering::Release);
        self.background_chunks
            .lock()
            .expect("VanityRun chunk queue mutex is not poisoned")
            .clear();
        let mut state = self
            .inner
            .lock()
            .expect("VanityRun state mutex is not poisoned");
        state.clear();
    }
}

#[cfg(test)]
impl VanityRun {
    /// Lets the Rust transport tests make every P2WPKH candidate match without
    /// weakening the production input validator.
    pub(crate) fn test_set_prefix_after_validation(&self, prefix: &str) {
        self.inner
            .lock()
            .expect("VanityRun state mutex is not poisoned")
            .config
            .prefix = prefix.to_owned();
    }
}

impl Drop for VanityRun {
    fn drop(&mut self) {
        self.stop_requested.store(true, Ordering::Release);
        self.accept_background_chunks
            .store(false, Ordering::Release);
        if let Ok(mut chunks) = self.background_chunks.lock() {
            chunks.clear();
        }
        if let Ok(mut state) = self.inner.lock() {
            state.clear();
        }
    }
}

/// Runs a stable native worker set for the full upstream bucket ranges.  It
/// owns all join handles itself so neither `clear` nor a UniFFI destructor can
/// block the JS thread waiting for a PBKDF2-sized step to finish.
///
/// Concurrent upstream calls are supported here: the pinned libsecp256k1
/// header guarantees that a constructed context is safe for simultaneous use,
/// and `vanity-wasm` neither randomizes nor destroys its shared context after
/// construction.
fn run_background_pool(
    inner: Arc<Mutex<VanityRunState>>,
    stop_requested: Arc<AtomicBool>,
    background_chunks: Arc<Mutex<VecDeque<VanityChunk>>>,
    accept_background_chunks: Arc<AtomicBool>,
    job: BackgroundPoolJob,
) {
    let mut failed = false;

    if !stop_requested.load(Ordering::Acquire) {
        let job = Arc::new(job);
        let worker_count = u64::from(job.config.workers).min(job.count) as usize;
        if worker_count > 0 {
            // At most two pending reports per worker puts backpressure on a
            // runaway producer without placing a lock around candidate work.
            let (event_sender, event_receiver) = mpsc::sync_channel(worker_count * 2);
            let retained_matches = Arc::new(AtomicUsize::new(MAX_BACKGROUND_RETAINED_MATCHES));
            let mut workers = Vec::with_capacity(worker_count);
            let base = job.count / worker_count as u64;
            let extra = job.count % worker_count as u64;
            let mut range_start = job.start;

            for index in 0..worker_count {
                let range_count = base + u64::from(index < extra as usize);
                let worker_job = Arc::clone(&job);
                let worker_stop_requested = Arc::clone(&stop_requested);
                let worker_stop_for_run = Arc::clone(&worker_stop_requested);
                let worker_retained_matches = Arc::clone(&retained_matches);
                let worker_events = event_sender.clone();
                let spawned = thread::Builder::new()
                    .name(format!("entropystudio-vanity-{index}"))
                    .spawn(move || {
                        // A panic must become a terminal pool event; otherwise
                        // the polling UI could wait forever for that worker.
                        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                            run_background_worker(
                                worker_job,
                                range_start,
                                range_count,
                                worker_stop_for_run,
                                worker_retained_matches,
                                worker_events.clone(),
                            );
                        }));
                        if result.is_err() {
                            worker_stop_requested.store(true, Ordering::Release);
                            let _ = worker_events.send(BackgroundWorkerEvent::Failed);
                            let _ = worker_events.send(BackgroundWorkerEvent::Finished);
                        }
                    });
                match spawned {
                    Ok(worker) => workers.push(worker),
                    Err(_) => {
                        failed = true;
                        stop_requested.store(true, Ordering::Release);
                        break;
                    }
                }
                range_start += range_count;
            }
            drop(event_sender);

            let mut finished_workers = 0usize;
            while finished_workers < workers.len() {
                match event_receiver.recv() {
                    Ok(BackgroundWorkerEvent::Progress {
                        processed,
                        found,
                        matches,
                    }) => {
                        let chunk = inner
                            .lock()
                            .expect("VanityRun state mutex is not poisoned")
                            .record_background_progress(processed, found, matches);
                        if let Some(chunk) = chunk {
                            publish_background_chunk(
                                &background_chunks,
                                &accept_background_chunks,
                                chunk,
                            );
                        }
                    }
                    Ok(BackgroundWorkerEvent::Failed) => {
                        failed = true;
                        stop_requested.store(true, Ordering::Release);
                    }
                    Ok(BackgroundWorkerEvent::Finished) => {
                        finished_workers += 1;
                    }
                    // A panic can drop a sender before it reports its
                    // terminal event. Once every sender is gone, all of the
                    // surviving workers have also exited and it is safe to
                    // join below.
                    Err(_) => {
                        failed = true;
                        stop_requested.store(true, Ordering::Release);
                        break;
                    }
                }
            }

            for worker in workers {
                if worker.join().is_err() {
                    failed = true;
                    stop_requested.store(true, Ordering::Release);
                }
            }
        }
    }

    let terminal = inner
        .lock()
        .expect("VanityRun state mutex is not poisoned")
        .finish_background(failed || stop_requested.load(Ordering::Acquire), failed);
    if let Some(chunk) = terminal {
        publish_background_chunk(&background_chunks, &accept_background_chunks, chunk);
    }
    if let Ok(mut state) = inner.lock() {
        state.clear();
    }
}

/// A single long-lived native worker for one of upstream's contiguous
/// `vanityBuckets` ranges. Its cursor, adaptive chunk size, and wasm output
/// allocation stay local to this thread for the whole run.
fn run_background_worker(
    job: Arc<BackgroundPoolJob>,
    mut cursor: u64,
    mut remaining: u64,
    stop_requested: Arc<AtomicBool>,
    retained_matches: Arc<AtomicUsize>,
    events: mpsc::SyncSender<BackgroundWorkerEvent>,
) {
    let mut chunk_size = match job.config.method {
        VanityMethod::Passphrase => INITIAL_PASSPHRASE_CHUNK_SIZE,
        VanityMethod::Derivation => INITIAL_DERIVATION_CHUNK_SIZE,
    };
    let mut scratch = UpstreamGrindScratch::new(&job.config);

    while remaining > 0 && !stop_requested.load(Ordering::Acquire) {
        let count = chunk_size.min(remaining);
        let started_at = Instant::now();
        let raw = match scratch.grind_raw(&job.config, &job.secrets, cursor, count) {
            Ok(raw) => raw,
            Err(_) => {
                stop_requested.store(true, Ordering::Release);
                let _ = events.send(BackgroundWorkerEvent::Failed);
                break;
            }
        };
        let elapsed_milliseconds = started_at.elapsed().as_millis().max(1) as u64;
        chunk_size = upstream_next_chunk_size(count, elapsed_milliseconds);

        if raw.processed > count {
            stop_requested.store(true, Ordering::Release);
            let _ = events.send(BackgroundWorkerEvent::Failed);
            break;
        }

        let retained = reserve_background_match_slots(&retained_matches, raw.matches);
        let matches = match scratch.decode_matches(
            &job.config,
            &job.secrets,
            &job.source_fingerprint,
            raw.matches,
            retained,
        ) {
            Ok(matches) => matches,
            Err(_) => {
                stop_requested.store(true, Ordering::Release);
                let _ = events.send(BackgroundWorkerEvent::Failed);
                break;
            }
        };
        if events
            .send(BackgroundWorkerEvent::Progress {
                processed: raw.processed,
                found: raw.matches as u64,
                matches,
            })
            .is_err()
        {
            return;
        }
        cursor += raw.processed;
        remaining -= raw.processed;
        // The upstream ABI can return a short range only when its output
        // record area fills. A worker-local buffer covers its full chunk, but
        // treat a future short result as a stopped/error run rather than
        // silently reporting an unsearched bucket as complete.
        if raw.processed < count {
            stop_requested.store(true, Ordering::Release);
            let _ = events.send(BackgroundWorkerEvent::Failed);
            break;
        }
    }
    let _ = events.send(BackgroundWorkerEvent::Finished);
}

fn upstream_next_chunk_size(chunk: u64, elapsed_milliseconds: u64) -> u64 {
    // Equivalent to upstream's positive-number `Math.round(chunk * 120 /
    // elapsed)`, including its half-up tie behavior.
    (chunk
        .saturating_mul(TARGET_CHUNK_MILLISECONDS)
        .saturating_add(elapsed_milliseconds / 2)
        / elapsed_milliseconds)
        .clamp(MIN_CHUNK_SIZE, MAX_CHUNK_SIZE)
}

fn reserve_background_match_slots(slots: &AtomicUsize, matches: usize) -> usize {
    let mut available = slots.load(Ordering::Acquire);
    loop {
        let retained = available.min(matches);
        if retained == 0 {
            return 0;
        }
        match slots.compare_exchange_weak(
            available,
            available - retained,
            Ordering::AcqRel,
            Ordering::Acquire,
        ) {
            Ok(_) => return retained,
            Err(current) => available = current,
        }
    }
}

fn publish_background_chunk(
    background_chunks: &Mutex<VecDeque<VanityChunk>>,
    accept_background_chunks: &AtomicBool,
    chunk: VanityChunk,
) {
    if !accept_background_chunks.load(Ordering::Acquire) {
        return;
    }
    let mut chunks = background_chunks
        .lock()
        .expect("VanityRun chunk queue mutex is not poisoned");
    // `clear` can land while this thread waits for the queue mutex. Check
    // again under the mutex so it cannot republish a stale snapshot.
    if !accept_background_chunks.load(Ordering::Acquire) {
        return;
    }
    if chunks.len() < MAX_BACKGROUND_CHUNK_SNAPSHOTS {
        chunks.push_back(chunk);
        return;
    }
    let tail = chunks
        .back_mut()
        .expect("a full vanity chunk queue has a tail");
    tail.processed = tail.processed.saturating_add(chunk.processed);
    tail.total_processed = chunk.total_processed;
    tail.total_found = chunk.total_found;
    tail.total_count = chunk.total_count;
    tail.next_counter = chunk.next_counter;
    tail.progress_percent = chunk.progress_percent;
    tail.elapsed_milliseconds = chunk.elapsed_milliseconds;
    tail.candidates_per_second = chunk.candidates_per_second;
    tail.matches.extend(chunk.matches);
    tail.complete = chunk.complete;
    tail.stopped = chunk.stopped;
    tail.failed = chunk.failed;
}

fn validate_input(input: VanityRunInput) -> Result<ValidatedInput, VanityValidationKind> {
    let mnemonic: String = input.mnemonic.trim().nfkd().collect();
    let normalized_mnemonic_byte_length = byte_length(mnemonic.len());
    if mnemonic.is_empty() {
        return Err(VanityValidationKind::MissingMnemonic);
    }
    if mnemonic.len() > MAX_MNEMONIC_BYTES {
        return Err(VanityValidationKind::MnemonicTooLong);
    }
    if unsafe { entropylab_wasm::el_bip39_validate(mnemonic.as_ptr(), mnemonic.len()) } != 1 {
        return Err(VanityValidationKind::InvalidMnemonic);
    }

    let starting_passphrase: String = input.starting_passphrase.nfkd().collect();
    let normalized_starting_passphrase_byte_length = byte_length(starting_passphrase.len());
    if starting_passphrase.len() > MAX_PASSPHRASE_BYTES {
        return Err(VanityValidationKind::PassphraseTooLong);
    }

    let account_path = parse_path(&input.account_path).map_err(path_validation_kind)?;
    if account_path.len() > MAX_PATH_COMPONENTS {
        return Err(VanityValidationKind::PathTooLong);
    }
    if account_path.len() < 3 {
        return Err(VanityValidationKind::MissingAccountComponents);
    }
    if account_path[1].index != 0 {
        return Err(VanityValidationKind::NonMainnetCoinType);
    }

    let path = if input.script == VanityScript::SilentPayments {
        vec![
            PathComponent {
                index: 352,
                hardened: true,
            },
            PathComponent {
                index: 0,
                hardened: true,
            },
            PathComponent {
                index: account_path[2].index,
                hardened: true,
            },
        ]
    } else {
        let branch_index =
            parse_index(&input.branch_index).ok_or(VanityValidationKind::InvalidBranchIndex)?;
        let address_index =
            parse_index(&input.address_index).ok_or(VanityValidationKind::InvalidAddressIndex)?;
        let mut path = account_path;
        path.push(PathComponent {
            index: branch_index,
            hardened: input.branch_hardened,
        });
        path.push(PathComponent {
            index: address_index,
            hardened: input.address_hardened,
        });
        if path.len() > MAX_PATH_COMPONENTS {
            return Err(VanityValidationKind::PathTooLong);
        }
        path
    };

    let prefix = normalize_prefix(&input.prefix, input.script);
    validate_prefix(&prefix, input.script)?;

    let passphrase_length = if input.method == VanityMethod::Passphrase {
        parse_passphrase_length(&input.passphrase_length)
            .ok_or(VanityValidationKind::InvalidPassphraseLength)?
    } else {
        0
    };
    let start = parse_counter(&input.start);
    let count = parse_counter(&input.count);
    let (start, count, counter_limit) =
        validate_counter_range(input.method, passphrase_length, start, count)?;
    let account_hardened = path[2].hardened;
    let coin_type = path[1].index;

    let config = VanityRunConfig {
        method: input.method,
        script: input.script,
        expected_candidates: expected_candidates(&prefix, input.script),
        prefix,
        account_hardened,
        path,
        passphrase_length,
        start,
        count,
        workers: normalize_workers(&input.workers),
        presentation: VanityValidationMetadata {
            normalized_mnemonic_byte_length,
            normalized_starting_passphrase_byte_length,
            coin_type: Some(coin_type),
            counter_limit: Some(counter_limit),
        },
    };
    Ok(ValidatedInput {
        config,
        mnemonic,
        starting_passphrase,
    })
}

fn normalize_workers(value: &str) -> u8 {
    value
        .parse::<u64>()
        .ok()
        .filter(|workers| *workers > 0)
        .map(|workers| workers.min(u64::from(MAX_WORKERS)) as u8)
        .unwrap_or(1)
}

fn normalize_prefix(value: &str, script: VanityScript) -> String {
    let mut value = value.trim().to_owned();
    if script_metadata(script).bech32 {
        value.make_ascii_lowercase();
    }
    value
}

fn validate_prefix(prefix: &str, script: VanityScript) -> Result<(), VanityValidationKind> {
    let metadata = script_metadata(script);
    if !prefix.starts_with(metadata.fixed_prefix) {
        return Err(VanityValidationKind::InvalidPrefix);
    }
    if prefix.len() <= metadata.fixed_prefix.len() {
        return Err(VanityValidationKind::PrefixTooShort);
    }
    if prefix.len() > metadata.max_length as usize {
        return Err(VanityValidationKind::PrefixTooLong);
    }
    let alphabet = if metadata.bech32 {
        BECH32_ALPHABET
    } else {
        BASE58_ALPHABET
    };
    if !prefix[metadata.fixed_prefix.len()..]
        .chars()
        .all(|character| alphabet.contains(character))
    {
        return Err(VanityValidationKind::PrefixAlphabet);
    }
    if !metadata.first_variable_characters.is_empty()
        && !metadata
            .first_variable_characters
            .contains(prefix.as_bytes()[metadata.fixed_prefix.len()] as char)
    {
        return Err(VanityValidationKind::SilentPaymentParity);
    }
    Ok(())
}

#[derive(Debug, Clone, Copy)]
enum PathParseError {
    Root,
    Index,
}

fn path_validation_kind(error: PathParseError) -> VanityValidationKind {
    match error {
        PathParseError::Root => VanityValidationKind::PathRoot,
        PathParseError::Index => VanityValidationKind::PathIndex,
    }
}

/// Parses the exact two-stage grammar used upstream: a root/shaping failure
/// is distinct from a malformed BIP32 index after a valid `m/...` shape.
fn parse_path(value: &str) -> Result<Vec<PathComponent>, PathParseError> {
    let value = value.trim();
    if value == "m" {
        return Ok(Vec::new());
    }
    let Some(components) = value.strip_prefix("m/") else {
        return Err(PathParseError::Root);
    };
    if components.is_empty() || components.split('/').any(str::is_empty) {
        return Err(PathParseError::Root);
    }

    components
        .split('/')
        .map(parse_path_component)
        .collect::<Option<Vec<_>>>()
        .ok_or(PathParseError::Index)
}

fn parse_path_component(part: &str) -> Option<PathComponent> {
    let hardened = part.ends_with(['\'', 'h', 'H']);
    let digits = if hardened {
        part.strip_suffix(['\'', 'h', 'H'])?
    } else {
        part
    };
    parse_bip32_index(digits).map(|index| PathComponent { index, hardened })
}

fn parse_bip32_index(value: &str) -> Option<u32> {
    (!value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit()))
        .then(|| value.parse::<u64>().ok())
        .flatten()
        .filter(|index| *index <= u64::from(MAX_INDEX))
        .map(|index| index as u32)
}

fn parse_index(value: &str) -> Option<u32> {
    let value = value.trim();
    let value = value.strip_suffix(['\'', 'h', 'H']).unwrap_or(value);
    parse_bip32_index(value)
}

fn parse_passphrase_length(value: &str) -> Option<u8> {
    let value = value.trim();
    if value.is_empty() || !value.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    value
        .parse::<u8>()
        .ok()
        .filter(|length| (1..=MAX_PASSPHRASE_LENGTH).contains(length))
}

fn byte_length(length: usize) -> u32 {
    // UniFFI strings are length-prefixed with a signed 32-bit byte length, so
    // every input that crossed this boundary (and its finite NFKD expansion)
    // fits the non-negative u32 used for presentation metadata.
    u32::try_from(length).expect("normalized vanity input fits in u32")
}

fn normalized_utf8_byte_length(value: &str, trim_boundary_whitespace: bool) -> u32 {
    let value = if trim_boundary_whitespace {
        value.trim()
    } else {
        value
    };
    byte_length(value.nfkd().map(char::len_utf8).sum())
}

#[derive(Debug, Clone, Copy)]
enum CounterParse {
    Invalid,
    Value(u64),
    /// A digits-only counter too large to represent in Rust's native u64.
    /// It remains a syntactically valid upstream BigInt and is classified by
    /// the selected range rule rather than reported as malformed input.
    TooLarge,
}

fn parse_counter(value: &str) -> CounterParse {
    let value = value.trim();
    if value.is_empty() || !value.bytes().all(|byte| byte.is_ascii_digit()) {
        return CounterParse::Invalid;
    }
    // Strip insignificant zeroes before parsing.  This keeps a perfectly
    // valid value such as a long, zero-padded `1` from looking like an
    // overflow merely because its textual representation is long.
    let significant = value.trim_start_matches('0');
    if significant.is_empty() {
        return CounterParse::Value(0);
    }
    significant
        .parse::<u64>()
        .map(CounterParse::Value)
        .unwrap_or(CounterParse::TooLarge)
}

fn counter_value_or_zero(value: CounterParse) -> u64 {
    match value {
        CounterParse::Value(value) => value,
        CounterParse::Invalid | CounterParse::TooLarge => 0,
    }
}

fn validate_counter_range(
    method: VanityMethod,
    passphrase_length: u8,
    start: CounterParse,
    count: CounterParse,
) -> Result<(u64, u64, u64), VanityValidationKind> {
    // `hodlVanityParseInputs` first requires digits-only counters, then the
    // range validators enforce a nonzero count before checking the start or
    // end.  Retain that ordering for identical feedback when several fields
    // are temporarily invalid at once.
    if matches!(start, CounterParse::Invalid) {
        return Err(VanityValidationKind::InvalidStart);
    }
    if matches!(count, CounterParse::Invalid) {
        return Err(VanityValidationKind::InvalidCount);
    }

    if matches!(count, CounterParse::Value(0)) {
        return Err(range_minimum_kind(method));
    }

    let counter_limit = counter_limit(method, passphrase_length);
    let start_value = match start {
        CounterParse::Value(value) => value,
        CounterParse::TooLarge => return Err(start_beyond_kind(method)),
        CounterParse::Invalid => unreachable!("checked above"),
    };
    if start_value >= counter_limit {
        return Err(start_beyond_kind(method));
    }
    let count_value = match count {
        CounterParse::Value(value) => value,
        CounterParse::TooLarge => return Err(range_past_kind(method, passphrase_length)),
        CounterParse::Invalid => unreachable!("checked above"),
    };
    if start_value
        .checked_add(count_value)
        .is_none_or(|end| end > counter_limit)
    {
        return Err(range_past_kind(method, passphrase_length));
    }
    Ok((start_value, count_value, counter_limit))
}

fn counter_limit(method: VanityMethod, passphrase_length: u8) -> u64 {
    match method {
        VanityMethod::Passphrase => passphrase_counter_limit(passphrase_length),
        VanityMethod::Derivation => u64::from(MAX_INDEX) + 1,
    }
}

fn range_minimum_kind(method: VanityMethod) -> VanityValidationKind {
    match method {
        VanityMethod::Passphrase => VanityValidationKind::PassphraseRangeMinimum,
        VanityMethod::Derivation => VanityValidationKind::DerivationRangeMinimum,
    }
}

fn start_beyond_kind(method: VanityMethod) -> VanityValidationKind {
    match method {
        VanityMethod::Passphrase => VanityValidationKind::PassphraseStartBeyond,
        VanityMethod::Derivation => VanityValidationKind::DerivationStartBeyond,
    }
}

fn range_past_kind(method: VanityMethod, passphrase_length: u8) -> VanityValidationKind {
    match method {
        VanityMethod::Passphrase if passphrase_counter_limit(passphrase_length) == u64::MAX => {
            VanityValidationKind::PassphraseRangePast64Bit
        }
        VanityMethod::Passphrase => VanityValidationKind::PassphraseRangePast,
        VanityMethod::Derivation => VanityValidationKind::DerivationRangePast,
    }
}

fn passphrase_counter_limit(length: u8) -> u64 {
    let mut limit = 1u64;
    for _ in 0..length {
        match limit.checked_mul(62) {
            Some(next) => limit = next,
            None => return u64::MAX,
        }
    }
    limit
}

fn format_path(path: &[PathComponent]) -> String {
    let mut formatted = String::from("m");
    for component in path {
        use std::fmt::Write;
        write!(
            formatted,
            "/{}{}",
            component.index,
            if component.hardened { "'" } else { "" }
        )
        .expect("writing to String cannot fail");
    }
    formatted
}

fn input_state_from_config(
    config: &VanityRunConfig,
    validation_kind: VanityValidationKind,
    valid: bool,
) -> VanityInputState {
    let metadata = script_metadata(config.script);
    let path = format_path(&config.path);
    let (silent_payment_scan_path, silent_payment_spend_path) =
        silent_payment_paths(config.script, &path);
    VanityInputState {
        valid,
        validation_kind,
        normalized_mnemonic_byte_length: config.presentation.normalized_mnemonic_byte_length,
        normalized_starting_passphrase_byte_length: config
            .presentation
            .normalized_starting_passphrase_byte_length,
        maximum_mnemonic_byte_length: MAX_MNEMONIC_BYTES as u32,
        maximum_starting_passphrase_byte_length: MAX_PASSPHRASE_BYTES as u32,
        maximum_passphrase_length: MAX_PASSPHRASE_LENGTH,
        maximum_path_components: MAX_PATH_COMPONENTS as u8,
        maximum_bip32_index: MAX_INDEX,
        coin_type: config.presentation.coin_type,
        counter_limit: config
            .presentation
            .counter_limit
            .map(|limit| limit.to_string()),
        normalized_prefix: config.prefix.clone(),
        fixed_prefix: metadata.fixed_prefix.to_owned(),
        prefix_alphabet: if metadata.bech32 {
            BECH32_ALPHABET.to_owned()
        } else {
            BASE58_ALPHABET.to_owned()
        },
        first_variable_characters: metadata.first_variable_characters.to_owned(),
        maximum_prefix_length: metadata.max_length,
        path,
        silent_payment_scan_path,
        silent_payment_spend_path,
        account_hardened: config.account_hardened,
        passphrase_length: config.passphrase_length,
        start: config.start,
        count: config.count,
        total_count: config.count,
        workers: config.workers,
        expected_candidates: config.expected_candidates.clone(),
    }
}

fn silent_payment_paths(script: VanityScript, path: &str) -> (String, String) {
    if script != VanityScript::SilentPayments {
        return (String::new(), String::new());
    }
    (format!("{path}/1'/0"), format!("{path}/0'/0"))
}

struct InputPresentation {
    script: VanityScript,
    presentation: VanityValidationMetadata,
    normalized_prefix: String,
    path: String,
    account_hardened: bool,
    passphrase_length: u8,
    start: u64,
    count: u64,
    workers: u8,
}

impl InputPresentation {
    fn from_input(input: &VanityRunInput) -> Self {
        let script = input.script;
        let normalized_prefix = normalize_prefix(&input.prefix, script);
        let account_path = parse_path(&input.account_path).ok();
        let coin_type = account_path
            .as_ref()
            .and_then(|path| path.get(1).map(|component| component.index));
        let path = if let Some(account_path) = account_path.filter(|path| path.len() >= 3) {
            if script == VanityScript::SilentPayments {
                vec![
                    PathComponent {
                        index: 352,
                        hardened: true,
                    },
                    PathComponent {
                        index: 0,
                        hardened: true,
                    },
                    PathComponent {
                        index: account_path[2].index,
                        hardened: true,
                    },
                ]
            } else if let (Some(branch), Some(address)) = (
                parse_index(&input.branch_index),
                parse_index(&input.address_index),
            ) {
                let mut path = account_path;
                path.push(PathComponent {
                    index: branch,
                    hardened: input.branch_hardened,
                });
                path.push(PathComponent {
                    index: address,
                    hardened: input.address_hardened,
                });
                path
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        };
        let passphrase_length = if input.method == VanityMethod::Passphrase {
            parse_passphrase_length(&input.passphrase_length).unwrap_or(0)
        } else {
            0
        };
        let counter_limit = match input.method {
            VanityMethod::Passphrase if passphrase_length == 0 => None,
            method => Some(counter_limit(method, passphrase_length)),
        };
        Self {
            script,
            presentation: VanityValidationMetadata {
                normalized_mnemonic_byte_length: normalized_utf8_byte_length(&input.mnemonic, true),
                normalized_starting_passphrase_byte_length: normalized_utf8_byte_length(
                    &input.starting_passphrase,
                    false,
                ),
                coin_type,
                counter_limit,
            },
            normalized_prefix,
            account_hardened: path.get(2).is_some_and(|component| component.hardened),
            path: format_path(&path),
            passphrase_length,
            start: counter_value_or_zero(parse_counter(&input.start)),
            count: counter_value_or_zero(parse_counter(&input.count)),
            workers: normalize_workers(&input.workers),
        }
    }

    fn into_state(self, validation_kind: VanityValidationKind) -> VanityInputState {
        let metadata = script_metadata(self.script);
        let (silent_payment_scan_path, silent_payment_spend_path) =
            silent_payment_paths(self.script, &self.path);
        VanityInputState {
            valid: false,
            validation_kind,
            normalized_mnemonic_byte_length: self.presentation.normalized_mnemonic_byte_length,
            normalized_starting_passphrase_byte_length: self
                .presentation
                .normalized_starting_passphrase_byte_length,
            maximum_mnemonic_byte_length: MAX_MNEMONIC_BYTES as u32,
            maximum_starting_passphrase_byte_length: MAX_PASSPHRASE_BYTES as u32,
            maximum_passphrase_length: MAX_PASSPHRASE_LENGTH,
            maximum_path_components: MAX_PATH_COMPONENTS as u8,
            maximum_bip32_index: MAX_INDEX,
            coin_type: self.presentation.coin_type,
            counter_limit: self
                .presentation
                .counter_limit
                .map(|limit| limit.to_string()),
            normalized_prefix: self.normalized_prefix.clone(),
            fixed_prefix: metadata.fixed_prefix.to_owned(),
            prefix_alphabet: if metadata.bech32 {
                BECH32_ALPHABET.to_owned()
            } else {
                BASE58_ALPHABET.to_owned()
            },
            first_variable_characters: metadata.first_variable_characters.to_owned(),
            maximum_prefix_length: metadata.max_length,
            path: self.path,
            silent_payment_scan_path,
            silent_payment_spend_path,
            account_hardened: self.account_hardened,
            passphrase_length: self.passphrase_length,
            start: self.start,
            count: self.count,
            total_count: self.count,
            workers: self.workers,
            expected_candidates: expected_candidates(&self.normalized_prefix, self.script),
        }
    }
}

fn expected_candidates(prefix: &str, script: VanityScript) -> String {
    let metadata = script_metadata(script);
    let free = prefix.len().saturating_sub(metadata.fixed_prefix.len());
    if free == 0 {
        return "1".to_owned();
    }
    let value = BigUint::from(if metadata.first_variable_characters.is_empty() {
        1
    } else {
        metadata.first_variable_characters.len() as u32
    });
    let exponent = if metadata.first_variable_characters.is_empty() {
        free
    } else {
        free.saturating_sub(1)
    };
    let factor: u32 = if metadata.bech32 { 32 } else { 58 };
    let value = value * BigUint::from(factor).pow(exponent as u32);
    value.to_string()
}

fn seed_from_normalized(mnemonic: &str, passphrase: &str) -> Result<[u8; 64], EntropyStudioError> {
    let mut salt = String::from("mnemonic");
    salt.push_str(passphrase);
    let mut seed = [0u8; 64];
    let status = unsafe {
        entropylab_wasm::el_pbkdf2_hmac_sha512(
            mnemonic.as_ptr(),
            mnemonic.len(),
            salt.as_ptr(),
            salt.len(),
            2048,
            seed.as_mut_ptr(),
            seed.len(),
        )
    };
    if status != 64 {
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    Ok(seed)
}

fn master_node(seed: &[u8]) -> Result<VanityNode, EntropyStudioError> {
    let mut node = [0u8; 78];
    let status =
        unsafe { entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), node.as_mut_ptr()) };
    if status != 78 {
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    Ok(node)
}

/// Unlike the general Key Station path helper, this intentionally does not
/// retry an invalid BIP32 child at the next index: the Vanity counter names a
/// specific candidate, and upstream skips that (astronomically rare) candidate
/// rather than silently changing its counter semantics.
fn derive_child_strict(
    parent: VanityNode,
    component: PathComponent,
) -> Result<Option<VanityNode>, EntropyStudioError> {
    let mut child = [0u8; 78];
    let status = unsafe {
        entropylab_wasm::el_hd_ckd_priv(parent.as_ptr(), component.encoded(), child.as_mut_ptr())
    };
    match status {
        78 => Ok(Some(child)),
        1 => Ok(None),
        _ => Err(EntropyStudioError::InvalidMasterKey),
    }
}

fn derive_path_strict(
    mut node: VanityNode,
    path: &[PathComponent],
) -> Result<Option<VanityNode>, EntropyStudioError> {
    for component in path {
        let Some(child) = derive_child_strict(node, *component)? else {
            return Ok(None);
        };
        node = child;
    }
    Ok(Some(node))
}

fn node_fingerprint(node: &VanityNode) -> Result<String, EntropyStudioError> {
    let mut public_key = [0u8; 65];
    let mut hash = [0u8; 20];
    let public_key_status = unsafe {
        entropylab_wasm::secp_pubkey_create(node[46..].as_ptr(), public_key.as_mut_ptr(), 1)
    };
    if public_key_status != 33 {
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    let hash_status =
        unsafe { entropylab_wasm::el_hash160(public_key.as_ptr(), 33, hash.as_mut_ptr()) };
    if hash_status != 20 {
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    let fingerprint = hash[..4].iter().map(|byte| format!("{byte:02x}")).collect();
    Ok(fingerprint)
}

/// Invokes EntropyLab's canonical Rust/WASM grinder for one Studio-sized
/// chunk. Its compact records deliberately contain only the counter,
/// passphrase suffix and public address payload; Studio adapts them to the
/// typed UniFFI result without reimplementing candidate derivation.
fn grind_upstream_ranges(
    config: &VanityRunConfig,
    secrets: &RunSecrets,
    source_fingerprint: &str,
    start: u64,
    count: u64,
) -> Result<(u64, Vec<VanityMatch>), EntropyStudioError> {
    if config.workers == 1 {
        return grind_upstream_chunk(config, secrets, source_fingerprint, start, count);
    }

    let range_count = u64::from(config.workers).min(count) as usize;
    let base = count / range_count as u64;
    let extra = count % range_count as u64;
    thread::scope(|scope| {
        let mut next_start = start;
        let mut jobs = Vec::with_capacity(range_count);
        for index in 0..range_count {
            let range_count = base + u64::from(index < extra as usize);
            let range_start = next_start;
            next_start += range_count;
            jobs.push(scope.spawn(move || {
                grind_upstream_chunk(
                    config,
                    secrets,
                    source_fingerprint,
                    range_start,
                    range_count,
                )
            }));
        }

        let mut processed = 0;
        let mut matches = Vec::new();
        for job in jobs {
            let (range_processed, mut range_matches) = job
                .join()
                .map_err(|_| EntropyStudioError::InvalidMasterKey)??;
            processed += range_processed;
            matches.append(&mut range_matches);
        }
        Ok((processed, matches))
    })
}

fn grind_upstream_chunk(
    config: &VanityRunConfig,
    secrets: &RunSecrets,
    source_fingerprint: &str,
    start: u64,
    count: u64,
) -> Result<(u64, Vec<VanityMatch>), EntropyStudioError> {
    let mut scratch = UpstreamGrindScratch::new(config);
    let raw = scratch.grind_raw(config, secrets, start, count)?;
    let matches = scratch.decode_matches(
        config,
        secrets,
        source_fingerprint,
        raw.matches,
        raw.matches,
    )?;
    Ok((raw.processed, matches))
}

struct UpstreamRawGrind {
    processed: u64,
    matches: usize,
}

/// Per-native-worker reusable buffers around the pinned upstream ABI.  The
/// output grows only when adaptive sizing reaches a new high-water mark, not
/// once per 120 ms step.
struct UpstreamGrindScratch {
    path: Vec<u8>,
    output: Vec<u8>,
}

impl UpstreamGrindScratch {
    fn new(config: &VanityRunConfig) -> Self {
        Self {
            path: upstream_path(config),
            output: Vec::new(),
        }
    }

    fn grind_raw(
        &mut self,
        config: &VanityRunConfig,
        secrets: &RunSecrets,
        start: u64,
        count: u64,
    ) -> Result<UpstreamRawGrind, EntropyStudioError> {
        let output_length = upstream_output_length(count);
        if self.output.len() < output_length {
            self.output.resize(output_length, 0);
        }
        let output = &mut self.output[..output_length];
        let (processed, matches) = match secrets {
            RunSecrets::Passphrase {
                mnemonic,
                starting_passphrase,
            } => call_upstream_grinder(
                config.script,
                &config.prefix,
                config.passphrase_length as usize,
                0,
                mnemonic.as_bytes(),
                starting_passphrase.as_bytes(),
                &self.path,
                u32::MAX,
                start,
                count,
                output,
            )?,
            RunSecrets::Derivation { parent } => {
                let parent = parent
                    .as_ref()
                    .ok_or(EntropyStudioError::VanityRunCleared)?;
                let parent_material = upstream_parent_material(parent);
                call_upstream_grinder(
                    config.script,
                    &config.prefix,
                    config.passphrase_length as usize,
                    1,
                    &parent_material,
                    &[],
                    &self.path,
                    0,
                    start,
                    count,
                    output,
                )?
            }
            RunSecrets::Cleared => return Err(EntropyStudioError::VanityRunCleared),
        };
        Ok(UpstreamRawGrind { processed, matches })
    }

    fn decode_matches(
        &self,
        config: &VanityRunConfig,
        secrets: &RunSecrets,
        source_fingerprint: &str,
        matches: usize,
        retained: usize,
    ) -> Result<Vec<VanityMatch>, EntropyStudioError> {
        let retained = matches.min(retained);
        match secrets {
            RunSecrets::Passphrase {
                mnemonic,
                starting_passphrase,
            } => passphrase_matches(
                config,
                mnemonic,
                starting_passphrase,
                &self.output,
                retained,
            ),
            RunSecrets::Derivation { parent } if parent.is_some() => {
                derivation_matches(config, source_fingerprint, &self.output, retained)
            }
            RunSecrets::Derivation { .. } | RunSecrets::Cleared => {
                Err(EntropyStudioError::VanityRunCleared)
            }
        }
    }
}

fn upstream_output_length(count: u64) -> usize {
    let record_capacity = usize::try_from(count).expect("Vanity chunk size fits usize");
    UPSTREAM_GRIND_HEADER_BYTES
        .checked_add(
            UPSTREAM_GRIND_RECORD_BYTES
                .checked_mul(record_capacity)
                .expect("Vanity chunk output fits usize"),
        )
        .expect("Vanity chunk output fits usize")
}

fn upstream_path(config: &VanityRunConfig) -> Vec<u8> {
    let components = match config.method {
        VanityMethod::Passphrase => &config.path[..],
        VanityMethod::Derivation => &config.path[2..],
    };
    let mut bytes = Vec::with_capacity(components.len() * std::mem::size_of::<u32>());
    for component in components {
        bytes.extend_from_slice(&component.encoded().to_le_bytes());
    }
    bytes
}

#[allow(clippy::too_many_arguments)]
fn call_upstream_grinder(
    script: VanityScript,
    prefix: &str,
    passphrase_length: usize,
    mode: u32,
    key: &[u8],
    salt: &[u8],
    path: &[u8],
    counter_slot: u32,
    start: u64,
    count: u64,
    output: &mut [u8],
) -> Result<(u64, usize), EntropyStudioError> {
    let status = unsafe {
        vanity_wasm::vanity_grind(
            mode,
            key.as_ptr(),
            key.len(),
            salt.as_ptr(),
            salt.len(),
            path.as_ptr(),
            path.len() / std::mem::size_of::<u32>(),
            counter_slot,
            prefix.as_ptr(),
            prefix.len(),
            passphrase_length,
            start,
            count,
            output.as_mut_ptr(),
            output.len(),
            upstream_script_code(script),
        )
    };
    if status != 0 {
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    let processed = u64::from_le_bytes(
        output[..8]
            .try_into()
            .expect("upstream grinder output has its fixed header"),
    );
    let matches = u32::from_le_bytes(
        output[8..UPSTREAM_GRIND_HEADER_BYTES]
            .try_into()
            .expect("upstream grinder output has its fixed header"),
    ) as usize;
    let capacity = (output.len() - UPSTREAM_GRIND_HEADER_BYTES) / UPSTREAM_GRIND_RECORD_BYTES;
    if processed > count || matches > capacity {
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    Ok((processed, matches))
}

fn upstream_script_code(script: VanityScript) -> u32 {
    match script {
        VanityScript::P2pkh => 0,
        VanityScript::P2shP2wpkh => 1,
        VanityScript::P2wpkh => 2,
        VanityScript::P2tr => 3,
        VanityScript::SilentPayments => 4,
    }
}

fn measure_vanity_benchmark() -> VanityBenchmark {
    let benchmark_node = benchmark_node();
    VanityBenchmark {
        passphrase_candidates_per_second: measure_benchmark_sample(
            VanityScript::P2wpkh,
            0,
            BENCHMARK_MNEMONIC.as_bytes(),
            &[84 | HARDENED, HARDENED, HARDENED, 0, 0],
            u32::MAX,
            8,
            24,
        ),
        derivation_candidates_per_second: measure_benchmark_sample(
            VanityScript::P2wpkh,
            1,
            &benchmark_node,
            &[HARDENED, 0, 0],
            0,
            0,
            1_200,
        ),
        silent_payment_candidates_per_second: measure_benchmark_sample(
            VanityScript::SilentPayments,
            1,
            &benchmark_node,
            &[HARDENED],
            0,
            0,
            600,
        ),
    }
}

fn benchmark_node() -> [u8; 64] {
    let mut node = [2; 64];
    node[..32].fill(1);
    node
}

#[allow(clippy::too_many_arguments)]
fn measure_benchmark_sample(
    script: VanityScript,
    mode: u32,
    key: &[u8],
    path_indexes: &[u32],
    counter_slot: u32,
    passphrase_length: usize,
    count: u64,
) -> f64 {
    let mut path = Vec::with_capacity(path_indexes.len() * std::mem::size_of::<u32>());
    for index in path_indexes {
        path.extend_from_slice(&index.to_le_bytes());
    }
    let record_capacity = usize::try_from(count).expect("Vanity benchmark count fits usize");
    let mut output =
        vec![0u8; UPSTREAM_GRIND_HEADER_BYTES + UPSTREAM_GRIND_RECORD_BYTES * record_capacity];
    let started = Instant::now();
    let Ok((processed, _)) = call_upstream_grinder(
        script,
        BENCHMARK_PREFIX,
        passphrase_length,
        mode,
        key,
        &[],
        &path,
        counter_slot,
        0,
        count,
        &mut output,
    ) else {
        return 0.0;
    };
    if processed != count {
        return 0.0;
    }
    let elapsed_seconds = started.elapsed().as_secs_f64();
    if elapsed_seconds == 0.0 {
        return 0.0;
    }
    count as f64 / elapsed_seconds
}

fn upstream_parent_material(parent: &VanityNode) -> [u8; 64] {
    let mut material = [0u8; 64];
    // The upstream grinder's node ABI is private key followed by chain code;
    // EntropyLab's shared primitive serializes xprv as chain code at 13..45
    // and private key at 46..78.
    material[..32].copy_from_slice(&parent[46..78]);
    material[32..].copy_from_slice(&parent[13..45]);
    material
}

fn passphrase_matches(
    config: &VanityRunConfig,
    mnemonic: &str,
    starting_passphrase: &str,
    output: &[u8],
    matches: usize,
) -> Result<Vec<VanityMatch>, EntropyStudioError> {
    let mut result = Vec::with_capacity(matches);
    for index in 0..matches {
        let offset = UPSTREAM_GRIND_HEADER_BYTES + index * UPSTREAM_GRIND_RECORD_BYTES;
        let counter = upstream_counter(output, offset)?;
        let suffix = &output[offset + 8..offset + 8 + config.passphrase_length as usize];
        let candidate_passphrase = joined_passphrase(starting_passphrase, suffix)?;
        let fingerprint = fingerprint_for_passphrase(mnemonic, &candidate_passphrase)?;
        let address = address_from_upstream_payload(
            config.script,
            &output[offset + 8 + UPSTREAM_GRIND_SUFFIX_BYTES
                ..offset + 8 + UPSTREAM_GRIND_SUFFIX_BYTES + UPSTREAM_GRIND_PAYLOAD_BYTES],
        )?;
        result.push(VanityMatch {
            counter,
            account_index: None,
            candidate_passphrase,
            path: format_path(&config.path),
            address,
            master_fingerprint: Some(fingerprint),
        });
    }
    Ok(result)
}

fn derivation_matches(
    config: &VanityRunConfig,
    source_fingerprint: &str,
    output: &[u8],
    matches: usize,
) -> Result<Vec<VanityMatch>, EntropyStudioError> {
    let mut result = Vec::with_capacity(matches);
    for index in 0..matches {
        let offset = UPSTREAM_GRIND_HEADER_BYTES + index * UPSTREAM_GRIND_RECORD_BYTES;
        let counter = upstream_counter(output, offset)?;
        let address = address_from_upstream_payload(
            config.script,
            &output[offset + 8 + UPSTREAM_GRIND_SUFFIX_BYTES
                ..offset + 8 + UPSTREAM_GRIND_SUFFIX_BYTES + UPSTREAM_GRIND_PAYLOAD_BYTES],
        )?;
        let mut path = config.path.clone();
        path[2].index = counter as u32;
        result.push(VanityMatch {
            counter,
            account_index: Some(counter as u32),
            candidate_passphrase: String::new(),
            path: format_path(&path),
            address,
            master_fingerprint: Some(source_fingerprint.to_owned()),
        });
    }
    Ok(result)
}

fn upstream_counter(output: &[u8], offset: usize) -> Result<u64, EntropyStudioError> {
    output
        .get(offset..offset + 8)
        .and_then(|bytes| bytes.try_into().ok())
        .map(u64::from_le_bytes)
        .ok_or(EntropyStudioError::InvalidMasterKey)
}

fn joined_passphrase(
    starting_passphrase: &str,
    suffix: &[u8],
) -> Result<String, EntropyStudioError> {
    let suffix = std::str::from_utf8(suffix).map_err(|_| EntropyStudioError::InvalidMasterKey)?;
    let mut passphrase = String::with_capacity(starting_passphrase.len() + suffix.len());
    passphrase.push_str(starting_passphrase);
    passphrase.push_str(suffix);
    Ok(passphrase)
}

fn fingerprint_for_passphrase(
    mnemonic: &str,
    passphrase: &str,
) -> Result<String, EntropyStudioError> {
    let seed = seed_from_normalized(mnemonic, passphrase)?;
    let root = master_node(&seed)?;
    node_fingerprint(&root)
}

fn address_from_upstream_payload(
    script: VanityScript,
    payload: &[u8],
) -> Result<String, EntropyStudioError> {
    match script {
        VanityScript::P2pkh => {
            let hash = PubkeyHash::from_byte_array(payload_prefix(payload)?);
            Ok(Address::p2pkh(hash, Network::Bitcoin).to_string())
        }
        VanityScript::P2shP2wpkh => {
            let hash = WPubkeyHash::from_byte_array(payload_prefix(payload)?);
            let redeem = ScriptBuf::new_p2wpkh(&hash);
            Address::p2sh(redeem.as_script(), Network::Bitcoin)
                .map(|address| address.to_string())
                .map_err(|_| EntropyStudioError::InvalidMasterKey)
        }
        VanityScript::P2wpkh => {
            let hash = WPubkeyHash::from_byte_array(payload_prefix(payload)?);
            address_from_script(&ScriptBuf::new_p2wpkh(&hash))
        }
        VanityScript::P2tr => {
            let program = WitnessProgram::new(WitnessVersion::V1, &payload_prefix::<32>(payload)?)
                .map_err(|_| EntropyStudioError::InvalidMasterKey)?;
            Ok(Address::from_witness_program(program, KnownHrp::Mainnet).to_string())
        }
        VanityScript::SilentPayments => silent_payment_address_from_payload(payload),
    }
}

fn payload_prefix<const N: usize>(payload: &[u8]) -> Result<[u8; N], EntropyStudioError> {
    payload
        .get(..N)
        .and_then(|bytes| bytes.try_into().ok())
        .ok_or(EntropyStudioError::InvalidMasterKey)
}

fn address_from_script(script: &ScriptBuf) -> Result<String, EntropyStudioError> {
    Address::from_script(script.as_script(), Network::Bitcoin)
        .map(|address| address.to_string())
        .map_err(|_| EntropyStudioError::InvalidMasterKey)
}

fn silent_payment_address_from_payload(payload: &[u8]) -> Result<String, EntropyStudioError> {
    let payload = payload
        .get(..UPSTREAM_GRIND_PAYLOAD_BYTES)
        .ok_or(EntropyStudioError::InvalidMasterKey)?;
    let hrp = Hrp::parse("sp").map_err(|_| EntropyStudioError::InvalidMasterKey)?;
    Ok(payload
        .iter()
        .copied()
        .bytes_to_fes()
        .with_checksum::<Bech32m>(&hrp)
        .with_witness_version(Fe32::Q)
        .chars()
        .collect())
}
