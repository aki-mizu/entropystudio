//! Native state for Key Station's advanced derivation controls.
//!
//! This module deliberately returns semantic values rather than UI strings.
//! The React Native layer owns localized presentation, while Rust owns the
//! BIP32-component and window rules used to choose that presentation.

use std::hint::black_box;
use std::sync::OnceLock;
use std::time::Instant;

const MAX_BIP32_CHILD_INDEX: u32 = 2_147_483_647;
const MAX_ADDRESS_BRANCH_RANGE: u32 = 2;
const MAX_ADDRESS_RANGE: u32 = 10_000;
const MAX_JAVASCRIPT_SAFE_INTEGER: u64 = 9_007_199_254_740_991;
const ADDRESS_BENCHMARK_SAMPLES: u32 = 32;
// Regular Studio Key Station inputs always create a root wallet. EntropyLab
// estimates four address-key operations for that path; its one-key estimate
// is reserved for imported extended keys, which Studio does not expose here.
const ROOT_WALLET_ADDRESS_KEY_COUNT: u32 = 4;
const HARDENED_CHILD_OFFSET: u32 = 1 << 31;

static ADDRESS_BENCHMARK_MILLISECONDS: OnceLock<f64> = OnceLock::new();

/// Raw drafts from the regular Key Station advanced-entry controls.
///
/// BIP32 component drafts accept an unsigned decimal index with an optional
/// trailing `h`, `H`, or apostrophe. Ranges accept unsigned decimal integers.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationAdvancedInput {
    pub purpose: String,
    pub coin_type: String,
    pub account: String,
    pub branch_start: String,
    pub branch_range: String,
    pub address_start: String,
    pub address_range: String,
}

/// Parsed state of one editable BIP32 component.
///
/// `value` is zero when `valid` is false. Consumers must use `valid` to
/// distinguish that sentinel from a valid child index zero. `hardened`
/// preserves a trailing hardening marker even while the numeric draft is
/// temporarily invalid, matching the independent upstream toggle.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationIndexState {
    pub valid: bool,
    pub value: u32,
    pub hardened: bool,
}

/// One validated component of a BIP32 derivation path.
///
/// Unlike `KeyDerivationIndexState`, this type is used only after a complete
/// path component has passed validation, so it does not need a `valid`
/// sentinel.
#[derive(Debug, Clone, PartialEq, Eq, uniffi::Record)]
pub struct KeyDerivationPathComponent {
    pub index: u32,
    pub hardened: bool,
}

/// Parsed state of one editable range.
///
/// `display_value` mirrors upstream's range-limit synchronization: a valid
/// numeric draft above the dynamic maximum is clamped to that maximum;
/// otherwise its trimmed draft is retained. `value` is zero when `valid` is
/// false.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationRangeState {
    pub valid: bool,
    pub value: u32,
    pub maximum: u32,
    pub display_value: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum KeyDerivationBranchRole {
    Receive,
    Change,
    Custom,
}

/// One selected branch, including its semantic role for display formatting.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationBranch {
    pub index: u32,
    pub role: KeyDerivationBranchRole,
}

/// Branch-window validity and its selected branch indexes.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationBranchWindowState {
    pub valid: bool,
    pub start: KeyDerivationIndexState,
    pub range: KeyDerivationRangeState,
    pub end: u32,
    pub branches: Vec<KeyDerivationBranch>,
}

/// Address-index-window validity.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationAddressWindowState {
    pub valid: bool,
    pub start: KeyDerivationIndexState,
    pub range: KeyDerivationRangeState,
    pub end: u32,
}

/// The network label semantics selected by a coin-type index.
///
/// `Invalid` corresponds to upstream's temporary `Custom` label while its
/// draft is invalid. A valid nonzero/nonone index uses
/// `CustomMainnetAddresses`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum KeyDerivationNetworkKind {
    Mainnet,
    Testnet,
    CustomMainnetAddresses,
    Invalid,
}

/// The range-dependent semantic variant of the direct derivation-path help.
#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum KeyDerivationPathHelpKind {
    Exact,
    MultipleBranches,
    MultipleIndexes,
    MultipleBranchesAndIndexes,
    Invalid,
}

/// Which portion of the derivation hierarchy is shown in the visible path.
///
/// When more than one branch is selected, the path stops at the account.
/// When more than one address index is selected, it stops at the branch.
#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum KeyDerivationPathDisplayKind {
    Account,
    Branch,
    Exact,
    Invalid,
}

/// The semantic reason an edited visible derivation path cannot be applied.
///
/// These cases correspond to the validation sequence in EntropyLab's
/// visible-path reader. The UI owns the rendered upstream copy.
#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum KeyDerivationVisiblePathValidationKind {
    Valid,
    Root,
    Index,
    MissingComponents,
    MissingAccount,
    BranchStart,
    BranchRange,
    AddressStart,
    AddressRange,
}

/// The first Advanced-entry validation condition that prevents a path update.
///
/// This is deliberately semantic rather than rendered copy, so the UI can
/// localize the exact upstream message without recreating validation order.
#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum KeyDerivationValidationKind {
    Valid,
    AccountPrefix,
    BranchStart,
    BranchRange,
    AddressStart,
    AddressRange,
}

/// Semantic snapshot used to render all regular Key Station advanced helpers.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationAdvancedState {
    pub purpose: KeyDerivationIndexState,
    pub coin_type: KeyDerivationIndexState,
    pub account: KeyDerivationIndexState,
    pub branch_window: KeyDerivationBranchWindowState,
    pub address_window: KeyDerivationAddressWindowState,
    pub network_kind: KeyDerivationNetworkKind,
    pub windows_valid: bool,
    pub valid: bool,
    pub validation_kind: KeyDerivationValidationKind,
    pub address_count: u32,
    pub path_help_kind: KeyDerivationPathHelpKind,
}

/// Inputs needed to rebuild the visible path after an Advanced-entry edit.
///
/// `account_path` is the separately retained path through the account level.
/// Its first three components are replaced with the supplied Advanced-entry
/// values; any additional account-level components are preserved when valid.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationPathProjectionInput {
    pub advanced: KeyDerivationAdvancedInput,
    pub account_path: String,
}

/// The canonical path projection after an Advanced-entry edit.
///
/// If `advanced_state.valid` is false, both path strings are empty and the
/// caller should retain its current visible draft while showing the typed
/// validation state. This matches upstream, which does not overwrite the
/// visible field after a failed Advanced-entry update.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationPathProjectionState {
    pub valid: bool,
    pub advanced_state: KeyDerivationAdvancedState,
    pub account_path: String,
    pub visible_path: String,
    pub display_kind: KeyDerivationPathDisplayKind,
}

/// Inputs needed to interpret a user-edited visible path.
///
/// The branch and address window drafts decide whether the visible path ends
/// at the account, branch, or exact address level.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationVisiblePathInput {
    pub path: String,
    pub branch_start: String,
    pub branch_range: String,
    pub address_start: String,
    pub address_range: String,
}

/// Parsed form of a visible derivation-path draft.
///
/// `account_components` always contains every visible component before the
/// optional branch/address suffix. It therefore preserves custom account-path
/// components beyond purpose, coin type, and account.
#[derive(Debug, uniffi::Record)]
pub struct KeyDerivationVisiblePathState {
    pub valid: bool,
    pub validation_kind: KeyDerivationVisiblePathValidationKind,
    pub display_kind: KeyDerivationPathDisplayKind,
    pub visible_path: String,
    pub account_path: String,
    pub account_components: Vec<KeyDerivationPathComponent>,
    pub branch: Option<KeyDerivationPathComponent>,
    pub address: Option<KeyDerivationPathComponent>,
}

/// Parses and validates regular Key Station advanced-entry drafts.
///
/// This mirrors EntropyLab's `hodlReadDerivationIndex`, range-limit syncing,
/// and branch/address window rules. It intentionally does not format helper
/// copy: callers receive roles, maxima, hardening, and validity instead.
#[uniffi::export]
pub fn key_derivation_advanced_state(
    input: KeyDerivationAdvancedInput,
) -> KeyDerivationAdvancedState {
    let purpose = parse_component(&input.purpose);
    let coin_type = parse_component(&input.coin_type);
    let account = parse_component(&input.account);
    let (branch_window, address_window) = window_states(
        &input.branch_start,
        &input.branch_range,
        &input.address_start,
        &input.address_range,
    );
    let windows_valid = branch_window.valid && address_window.valid;
    let validation_kind = validation_kind(
        &purpose,
        &coin_type,
        &account,
        &branch_window,
        &address_window,
    );
    let valid = validation_kind == KeyDerivationValidationKind::Valid;
    let address_count = if windows_valid {
        address_window.range.value * branch_window.branches.len() as u32
    } else {
        0
    };

    KeyDerivationAdvancedState {
        network_kind: network_kind(&coin_type),
        path_help_kind: path_help_kind(validation_kind, &branch_window, &address_window),
        purpose,
        coin_type,
        account,
        branch_window,
        address_window,
        windows_valid,
        valid,
        validation_kind,
        address_count,
    }
}

/// Measures the fixed BIP84 address row used by EntropyLab's regular Key
/// Station estimate and returns its per-address duration in milliseconds.
///
/// The benchmark is run only once per process. It uses the pinned upstream
/// Rust crypto implementation for EntropyLab's deterministic 32-row BIP32
/// and P2WPKH-address workload: a zero seed through
/// `m/84'/0'/0'/0/index`. No user-provided key material is involved.
#[uniffi::export]
pub fn key_derivation_address_benchmark_milliseconds() -> f64 {
    *ADDRESS_BENCHMARK_MILLISECONDS.get_or_init(measure_address_benchmark_milliseconds)
}

/// Estimates regular Key Station address derivation time in milliseconds.
///
/// This uses the native range state, so invalid address/branch windows return
/// zero. As in EntropyLab, a valid window is independent of temporary
/// purpose, coin-type, or account drafts for purposes of this status value.
#[uniffi::export]
pub fn key_derivation_address_estimate_milliseconds(input: KeyDerivationAdvancedInput) -> f64 {
    let state = key_derivation_advanced_state(input);
    if !state.windows_valid {
        return 0.0;
    }

    key_derivation_address_benchmark_milliseconds()
        * f64::from(state.address_count)
        * f64::from(ROOT_WALLET_ADDRESS_KEY_COUNT)
}

/// Projects validated Advanced-entry values to the path level selected by its
/// branch and address ranges.
#[uniffi::export]
pub fn key_derivation_project_advanced_path(
    input: KeyDerivationPathProjectionInput,
) -> KeyDerivationPathProjectionState {
    // EntropyLab deliberately falls back to no preserved components when its
    // hidden account-path cache is malformed. Its three live Advanced-entry
    // components still form a usable canonical account path.
    let preserved_account_tail: Vec<KeyDerivationPathComponent> =
        parse_path_components(&input.account_path)
            .map(|components| components.into_iter().skip(3).collect())
            .unwrap_or_default();
    let advanced_state = key_derivation_advanced_state(input.advanced);

    if !advanced_state.valid {
        return KeyDerivationPathProjectionState {
            valid: false,
            advanced_state,
            account_path: String::new(),
            visible_path: String::new(),
            display_kind: KeyDerivationPathDisplayKind::Invalid,
        };
    }

    let mut account_components = vec![
        path_component_from_index(&advanced_state.purpose),
        path_component_from_index(&advanced_state.coin_type),
        path_component_from_index(&advanced_state.account),
    ];
    account_components.extend(preserved_account_tail);
    let account_path = format_path(&account_components);
    let display_kind = path_display_kind(
        &advanced_state.branch_window,
        &advanced_state.address_window,
    );
    let mut visible_components = account_components;

    match display_kind {
        KeyDerivationPathDisplayKind::Account => {}
        KeyDerivationPathDisplayKind::Branch => {
            visible_components.push(path_component_from_index(
                &advanced_state.branch_window.start,
            ));
        }
        KeyDerivationPathDisplayKind::Exact => {
            visible_components.push(path_component_from_index(
                &advanced_state.branch_window.start,
            ));
            visible_components.push(path_component_from_index(
                &advanced_state.address_window.start,
            ));
        }
        KeyDerivationPathDisplayKind::Invalid => {
            unreachable!("validated windows have a path level")
        }
    }

    KeyDerivationPathProjectionState {
        valid: true,
        advanced_state,
        account_path,
        visible_path: format_path(&visible_components),
        display_kind,
    }
}

/// Parses a visible path at the hierarchy level selected by the supplied
/// branch and address window drafts.
#[uniffi::export]
pub fn key_derivation_visible_path_state(
    input: KeyDerivationVisiblePathInput,
) -> KeyDerivationVisiblePathState {
    // Upstream parses the user's visible path before checking the selected
    // windows, so retain that error precedence here.
    let components = match parse_path_components(&input.path) {
        Ok(components) => components,
        Err(validation_kind) => return invalid_visible_path_state(validation_kind),
    };
    let (branch_window, address_window) = window_states(
        &input.branch_start,
        &input.branch_range,
        &input.address_start,
        &input.address_range,
    );
    if let Some(validation_kind) =
        visible_path_window_validation_kind(&branch_window, &address_window)
    {
        return invalid_visible_path_state(validation_kind);
    }

    let display_kind = path_display_kind(&branch_window, &address_window);
    let suffix_count = match display_kind {
        KeyDerivationPathDisplayKind::Account => 0,
        KeyDerivationPathDisplayKind::Branch => 1,
        KeyDerivationPathDisplayKind::Exact => 2,
        KeyDerivationPathDisplayKind::Invalid => {
            unreachable!("validated windows have a path level")
        }
    };
    if components.len() < 3 + suffix_count {
        return invalid_visible_path_state(
            KeyDerivationVisiblePathValidationKind::MissingComponents,
        );
    }

    let account_end = components.len() - suffix_count;
    if account_end < 3 {
        return invalid_visible_path_state(KeyDerivationVisiblePathValidationKind::MissingAccount);
    }

    let account_components = components[..account_end].to_vec();
    let branch = (suffix_count >= 1).then(|| components[account_end].clone());
    let address = (suffix_count == 2).then(|| components[account_end + 1].clone());

    KeyDerivationVisiblePathState {
        valid: true,
        validation_kind: KeyDerivationVisiblePathValidationKind::Valid,
        display_kind,
        visible_path: format_path(&components),
        account_path: format_path(&account_components),
        account_components,
        branch,
        address,
    }
}

fn parse_component(draft: &str) -> KeyDerivationIndexState {
    parse_component_raw(draft.trim())
}

fn parse_component_raw(raw: &str) -> KeyDerivationIndexState {
    let (digits, hardened) = match raw.as_bytes().last() {
        Some(b'h' | b'H' | b'\'') => (&raw[..raw.len() - 1], true),
        _ => (raw, false),
    };

    let value = (!digits.is_empty() && digits.bytes().all(|byte| byte.is_ascii_digit()))
        .then(|| digits.parse::<u64>().ok())
        .flatten()
        .filter(|value| *value <= u64::from(MAX_BIP32_CHILD_INDEX))
        .map(|value| value as u32);

    match value {
        Some(value) => KeyDerivationIndexState {
            valid: true,
            value,
            hardened,
        },
        None => KeyDerivationIndexState {
            valid: false,
            value: 0,
            hardened,
        },
    }
}

fn window_states(
    branch_start_draft: &str,
    branch_range_draft: &str,
    address_start_draft: &str,
    address_range_draft: &str,
) -> (
    KeyDerivationBranchWindowState,
    KeyDerivationAddressWindowState,
) {
    let branch_start = parse_component(branch_start_draft);
    let address_start = parse_component(address_start_draft);
    let branch_maximum = maximum_range(&branch_start, MAX_ADDRESS_BRANCH_RANGE);
    let address_maximum = maximum_range(&address_start, MAX_ADDRESS_RANGE);
    let branch_range = parse_range(branch_range_draft, branch_maximum);
    let address_range = parse_range(address_range_draft, address_maximum);

    (
        branch_window_state(branch_start, branch_range),
        address_window_state(address_start, address_range),
    )
}

fn parse_path_components(
    value: &str,
) -> Result<Vec<KeyDerivationPathComponent>, KeyDerivationVisiblePathValidationKind> {
    let raw = value.trim();
    if raw == "m" {
        return Ok(Vec::new());
    }
    let Some(components_raw) = raw.strip_prefix("m/") else {
        return Err(KeyDerivationVisiblePathValidationKind::Root);
    };
    if components_raw.is_empty() || components_raw.split('/').any(str::is_empty) {
        return Err(KeyDerivationVisiblePathValidationKind::Root);
    }

    components_raw
        .split('/')
        .map(|component| {
            let parsed = parse_component_raw(component);
            parsed
                .valid
                .then(|| path_component_from_index(&parsed))
                .ok_or(KeyDerivationVisiblePathValidationKind::Index)
        })
        .collect()
}

fn path_component_from_index(index: &KeyDerivationIndexState) -> KeyDerivationPathComponent {
    debug_assert!(index.valid);
    KeyDerivationPathComponent {
        index: index.value,
        hardened: index.hardened,
    }
}

fn format_path(components: &[KeyDerivationPathComponent]) -> String {
    let mut path = String::from("m");
    for component in components {
        path.push('/');
        path.push_str(&component.index.to_string());
        if component.hardened {
            path.push('\'');
        }
    }
    path
}

fn path_display_kind(
    branch_window: &KeyDerivationBranchWindowState,
    address_window: &KeyDerivationAddressWindowState,
) -> KeyDerivationPathDisplayKind {
    if !branch_window.valid || !address_window.valid {
        return KeyDerivationPathDisplayKind::Invalid;
    }
    if branch_window.range.value > 1 {
        KeyDerivationPathDisplayKind::Account
    } else if address_window.range.value > 1 {
        KeyDerivationPathDisplayKind::Branch
    } else {
        KeyDerivationPathDisplayKind::Exact
    }
}

fn visible_path_window_validation_kind(
    branch_window: &KeyDerivationBranchWindowState,
    address_window: &KeyDerivationAddressWindowState,
) -> Option<KeyDerivationVisiblePathValidationKind> {
    if !branch_window.start.valid {
        return Some(KeyDerivationVisiblePathValidationKind::BranchStart);
    }
    if !branch_window.range.valid {
        return Some(KeyDerivationVisiblePathValidationKind::BranchRange);
    }
    if !address_window.start.valid {
        return Some(KeyDerivationVisiblePathValidationKind::AddressStart);
    }
    if !address_window.range.valid {
        return Some(KeyDerivationVisiblePathValidationKind::AddressRange);
    }
    None
}

fn invalid_visible_path_state(
    validation_kind: KeyDerivationVisiblePathValidationKind,
) -> KeyDerivationVisiblePathState {
    KeyDerivationVisiblePathState {
        valid: false,
        validation_kind,
        display_kind: KeyDerivationPathDisplayKind::Invalid,
        visible_path: String::new(),
        account_path: String::new(),
        account_components: Vec::new(),
        branch: None,
        address: None,
    }
}

/// The fixed workload used by EntropyLab's browser-side benchmark. The
/// upstream crate exposes these operations as its low-level Rust boundary,
/// rather than as a typed row-derivation API, so this wrapper keeps the
/// byte-buffer handling local and never exposes it through UniFFI.
fn measure_address_benchmark_milliseconds() -> f64 {
    measure_address_benchmark_workload()
        .unwrap_or(0.25)
        .max(0.01)
}

fn measure_address_benchmark_workload() -> Option<f64> {
    let mut account = benchmark_account_node()?;
    let started = Instant::now();
    let mut success = true;

    for index in 0..ADDRESS_BENCHMARK_SAMPLES {
        if !benchmark_address_row(&account, index) {
            success = false;
            break;
        }
    }

    let elapsed_milliseconds = started.elapsed().as_secs_f64() * 1_000.0;
    account.fill(0);

    success.then_some(elapsed_milliseconds / f64::from(ADDRESS_BENCHMARK_SAMPLES))
}

fn benchmark_account_node() -> Option<[u8; 78]> {
    let mut seed = [0u8; 32];
    let mut node = [0u8; 78];
    let status =
        unsafe { entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), node.as_mut_ptr()) };
    seed.fill(0);
    if status != 78 {
        node.fill(0);
        return None;
    }

    for index in [
        HARDENED_CHILD_OFFSET + 84,
        HARDENED_CHILD_OFFSET,
        HARDENED_CHILD_OFFSET,
    ] {
        let Some(child) = benchmark_derive_child(&node, index) else {
            node.fill(0);
            return None;
        };
        node.fill(0);
        node = child;
    }

    Some(node)
}

fn benchmark_derive_child(parent: &[u8; 78], index: u32) -> Option<[u8; 78]> {
    let mut child_index = index;

    loop {
        let mut child = [0u8; 78];
        let status = unsafe {
            entropylab_wasm::el_hd_ckd_priv(parent.as_ptr(), child_index, child.as_mut_ptr())
        };
        if status == 78 {
            return Some(child);
        }
        child.fill(0);
        if status != 1 {
            return None;
        }
        child_index = child_index.checked_add(1)?;
    }
}

fn benchmark_address_row(account: &[u8; 78], index: u32) -> bool {
    let Some(mut branch) = benchmark_derive_child(account, 0) else {
        return false;
    };
    let Some(mut child) = benchmark_derive_child(&branch, index) else {
        branch.fill(0);
        return false;
    };
    branch.fill(0);

    // An extended private key serializes its 32-byte secret at bytes 46..78.
    // `secp_pubkey_create` requires a 65-byte output buffer even for its
    // compressed 33-byte form.
    let mut public_key = [0u8; 65];
    let mut script = [0u8; 22];
    let mut address = [0u8; 128];
    let public_key_status = unsafe {
        entropylab_wasm::secp_pubkey_create(child[46..].as_ptr(), public_key.as_mut_ptr(), 1)
    };
    let script_status = if public_key_status == 33 {
        unsafe {
            entropylab_wasm::el_spk_p2wpkh(
                public_key.as_ptr(),
                33,
                script.as_mut_ptr(),
                script.len(),
            )
        }
    } else {
        -1
    };
    let address_status = if script_status == 22 {
        unsafe {
            entropylab_wasm::el_addr_from_script(
                script.as_ptr(),
                script.len(),
                0,
                address.as_mut_ptr(),
                address.len(),
            )
        }
    } else {
        -1
    };

    if address_status > 0 {
        black_box(address[0]);
    }
    child.fill(0);
    public_key.fill(0);
    script.fill(0);
    address.fill(0);
    address_status > 0
}

fn maximum_range(start: &KeyDerivationIndexState, configured_maximum: u32) -> u32 {
    if !start.valid {
        return configured_maximum;
    }

    configured_maximum.min(MAX_BIP32_CHILD_INDEX - start.value + 1)
}

fn parse_range(draft: &str, maximum: u32) -> KeyDerivationRangeState {
    let display_value = draft.trim().to_owned();
    let parsed = (!display_value.is_empty()
        && display_value.bytes().all(|byte| byte.is_ascii_digit()))
    .then(|| display_value.parse::<u64>().ok())
    .flatten()
    .filter(|value| *value <= MAX_JAVASCRIPT_SAFE_INTEGER);

    match parsed {
        Some(value) if value > u64::from(maximum) => KeyDerivationRangeState {
            valid: true,
            value: maximum,
            maximum,
            display_value: maximum.to_string(),
        },
        Some(value) if value >= 1 => KeyDerivationRangeState {
            valid: true,
            value: value as u32,
            maximum,
            display_value,
        },
        _ => KeyDerivationRangeState {
            valid: false,
            value: 0,
            maximum,
            display_value,
        },
    }
}

fn branch_window_state(
    start: KeyDerivationIndexState,
    range: KeyDerivationRangeState,
) -> KeyDerivationBranchWindowState {
    let valid = start.valid && range.valid;
    let end = if valid {
        start.value + range.value - 1
    } else {
        0
    };
    let branches = if valid {
        (start.value..=end)
            .map(|index| KeyDerivationBranch {
                index,
                role: branch_role(index),
            })
            .collect()
    } else {
        Vec::new()
    };

    KeyDerivationBranchWindowState {
        valid,
        start,
        range,
        end,
        branches,
    }
}

fn address_window_state(
    start: KeyDerivationIndexState,
    range: KeyDerivationRangeState,
) -> KeyDerivationAddressWindowState {
    let valid = start.valid && range.valid;
    let end = if valid {
        start.value + range.value - 1
    } else {
        0
    };

    KeyDerivationAddressWindowState {
        valid,
        start,
        range,
        end,
    }
}

fn branch_role(index: u32) -> KeyDerivationBranchRole {
    match index {
        0 => KeyDerivationBranchRole::Receive,
        1 => KeyDerivationBranchRole::Change,
        _ => KeyDerivationBranchRole::Custom,
    }
}

fn network_kind(coin_type: &KeyDerivationIndexState) -> KeyDerivationNetworkKind {
    if !coin_type.valid {
        return KeyDerivationNetworkKind::Invalid;
    }

    match coin_type.value {
        0 => KeyDerivationNetworkKind::Mainnet,
        1 => KeyDerivationNetworkKind::Testnet,
        _ => KeyDerivationNetworkKind::CustomMainnetAddresses,
    }
}

fn validation_kind(
    purpose: &KeyDerivationIndexState,
    coin_type: &KeyDerivationIndexState,
    account: &KeyDerivationIndexState,
    branch_window: &KeyDerivationBranchWindowState,
    address_window: &KeyDerivationAddressWindowState,
) -> KeyDerivationValidationKind {
    if !purpose.valid || !coin_type.valid || !account.valid {
        return KeyDerivationValidationKind::AccountPrefix;
    }
    if !branch_window.start.valid {
        return KeyDerivationValidationKind::BranchStart;
    }
    if !branch_window.range.valid {
        return KeyDerivationValidationKind::BranchRange;
    }
    if !address_window.start.valid {
        return KeyDerivationValidationKind::AddressStart;
    }
    if !address_window.range.valid {
        return KeyDerivationValidationKind::AddressRange;
    }

    KeyDerivationValidationKind::Valid
}

fn path_help_kind(
    validation_kind: KeyDerivationValidationKind,
    branch_window: &KeyDerivationBranchWindowState,
    address_window: &KeyDerivationAddressWindowState,
) -> KeyDerivationPathHelpKind {
    if validation_kind != KeyDerivationValidationKind::Valid {
        return KeyDerivationPathHelpKind::Invalid;
    }

    match (
        branch_window.range.value > 1,
        address_window.range.value > 1,
    ) {
        (false, false) => KeyDerivationPathHelpKind::Exact,
        (true, false) => KeyDerivationPathHelpKind::MultipleBranches,
        (false, true) => KeyDerivationPathHelpKind::MultipleIndexes,
        (true, true) => KeyDerivationPathHelpKind::MultipleBranchesAndIndexes,
    }
}
