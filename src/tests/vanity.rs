use super::*;

const MNEMONIC: &str =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const PASSPHRASE: &str = "TREZOR";

fn input(method: VanityMethod, script: VanityScript, prefix: String) -> VanityRunInput {
    VanityRunInput {
        method,
        script,
        mnemonic: MNEMONIC.to_owned(),
        starting_passphrase: PASSPHRASE.to_owned(),
        account_path: "m/84'/0'/0'".to_owned(),
        branch_index: "0".to_owned(),
        branch_hardened: false,
        address_index: "0".to_owned(),
        address_hardened: false,
        prefix,
        passphrase_length: "1".to_owned(),
        start: "0".to_owned(),
        count: "1".to_owned(),
        workers: "1".to_owned(),
    }
}

fn fixed_prefix(script: VanityScript) -> &'static str {
    match script {
        VanityScript::P2pkh => "1",
        VanityScript::P2shP2wpkh => "3",
        VanityScript::P2wpkh => "bc1q",
        VanityScript::P2tr => "bc1p",
        VanityScript::SilentPayments => "sp1qq",
    }
}

fn account_script(script: VanityScript) -> AccountScriptType {
    match script {
        VanityScript::P2pkh => AccountScriptType::Legacy,
        VanityScript::P2shP2wpkh => AccountScriptType::NestedSegwit,
        VanityScript::P2wpkh => AccountScriptType::NativeSegwit,
        VanityScript::P2tr => AccountScriptType::Taproot,
        VanityScript::SilentPayments => panic!("Silent Payments have their own BIP-352 encoding"),
    }
}

fn expected_standard_address(
    passphrase: &str,
    account: u32,
    account_hardened: bool,
    script: VanityScript,
) -> String {
    let fingerprint = mnemonic_to_master_fingerprint(MNEMONIC.to_owned(), passphrase.to_owned())
        .expect("test mnemonic has a master fingerprint");
    account_private_material(
        MNEMONIC.to_owned(),
        passphrase.to_owned(),
        format!(
            "m/84'/0'/{account}{}",
            if account_hardened { "'" } else { "" }
        ),
        fingerprint,
        account_script(script),
        vec![0],
        0,
        1,
        false,
        false,
    )
    .expect("test wallet derives")
    .first_watch_only_address
    .expect("one requested address")
    .address
}

fn prefix_for(address: &str, script: VanityScript) -> String {
    let length = fixed_prefix(script).len() + 1;
    address[..length].to_owned()
}

fn one_match(value: VanityRunInput) -> VanityMatch {
    let run = VanityRun::new(value).expect("valid vanity run");
    let chunk = run.next_chunk().expect("one work chunk");
    assert_eq!(chunk.processed, 1);
    assert_eq!(chunk.total_found, 1);
    assert!(chunk.complete);
    assert_eq!(
        chunk.matches.len(),
        1,
        "the input prefix was made from this candidate"
    );
    chunk
        .matches
        .into_iter()
        .next()
        .expect("one matching candidate")
}

fn background_chunks_until_complete(run: &VanityRun) -> Vec<VanityChunk> {
    let mut result = Vec::new();
    for _ in 0..2_000 {
        let mut chunks = run.take_chunks();
        let complete = chunks.iter().any(|chunk| chunk.complete);
        result.append(&mut chunks);
        if complete {
            return result;
        }
        std::thread::sleep(std::time::Duration::from_millis(5));
    }
    panic!("background vanity run did not complete");
}

fn wait_for_background_progress(run: &VanityRun) {
    for _ in 0..2_000 {
        if run
            .take_chunks()
            .into_iter()
            .any(|chunk| chunk.total_processed > 0)
        {
            return;
        }
        std::thread::sleep(std::time::Duration::from_millis(5));
    }
    panic!("background vanity run did not report progress");
}

/// A one-character valid P2WPKH prefix is probabilistic.  This test helper
/// deliberately lowers it to the fixed upstream prefix after validation so a
/// short worker-range test can assert exact counters and result buffering.
fn make_every_p2wpkh_candidate_match(run: &VanityRun) {
    run.test_set_prefix_after_validation("bc1q");
}

#[test]
fn vanity_benchmark_uses_the_upstream_public_fixture_workloads() {
    let benchmark = vanity_benchmark();
    assert!(benchmark.passphrase_candidates_per_second.is_finite());
    assert!(benchmark.derivation_candidates_per_second.is_finite());
    assert!(benchmark.silent_payment_candidates_per_second.is_finite());
    assert!(benchmark.passphrase_candidates_per_second > 0.0);
    assert!(benchmark.derivation_candidates_per_second > 0.0);
    assert!(benchmark.silent_payment_candidates_per_second > 0.0);
}

#[test]
fn vanity_input_state_normalizes_metadata_and_filters_prefixes_natively() {
    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        " BC1Qf ".to_owned(),
    );
    value.passphrase_length = "8".to_owned();
    value.start = "19".to_owned();
    value.count = "12".to_owned();
    value.mnemonic = format!(" {MNEMONIC} ");
    value.starting_passphrase = "\u{00e9}".to_owned();
    let state = vanity_input_state(value);

    assert!(state.valid);
    assert_eq!(state.validation_kind, VanityValidationKind::Valid);
    assert_eq!(state.normalized_mnemonic_byte_length, MNEMONIC.len() as u32);
    assert_eq!(state.normalized_starting_passphrase_byte_length, 3);
    assert_eq!(state.maximum_mnemonic_byte_length, 1024);
    assert_eq!(state.maximum_starting_passphrase_byte_length, 256);
    assert_eq!(state.maximum_passphrase_length, 32);
    assert_eq!(state.maximum_path_components, 16);
    assert_eq!(state.maximum_bip32_index, 2_147_483_647);
    assert_eq!(state.coin_type, Some(0));
    assert_eq!(state.counter_limit.as_deref(), Some("218340105584896"));
    assert_eq!(state.normalized_prefix, "bc1qf");
    assert_eq!(state.fixed_prefix, "bc1q");
    assert_eq!(state.prefix_alphabet, "qpzry9x8gf2tvdw0s3jn54khce6mua7l");
    assert_eq!(state.maximum_prefix_length, 42);
    assert_eq!(state.path, "m/84'/0'/0'/0/0");
    assert_eq!(state.expected_candidates, "32");
    assert_eq!(state.passphrase_length, 8);
    assert_eq!(state.start, 19);
    assert_eq!(state.count, 12);
    assert_eq!(state.workers, 1);
    assert_eq!(
        vanity_filter_prefix(" BC1Qb!f ".to_owned(), VanityScript::P2wpkh),
        "bc1qbf"
    );
    assert_eq!(
        vanity_filter_prefix(" 1O0abIl ".to_owned(), VanityScript::P2pkh),
        "1ab"
    );
}

#[test]
fn vanity_workers_follow_upstream_clamping() {
    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1q".to_owned(),
    );
    value.workers = "99".to_owned();
    assert_eq!(vanity_input_state(value).workers, 64);

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1q".to_owned(),
    );
    value.workers = "1000".to_owned();
    assert_eq!(vanity_input_state(value).workers, 64);

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1q".to_owned(),
    );
    value.workers = "0".to_owned();
    assert_eq!(vanity_input_state(value).workers, 1);
}

#[test]
fn background_run_returns_typed_completed_chunks_without_js_driving_work() {
    let run = VanityRun::new(input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    ))
    .unwrap();
    assert!(run.start());
    assert!(!run.start());

    for _ in 0..100 {
        let chunks = run.take_chunks();
        if let Some(chunk) = chunks.into_iter().find(|chunk| chunk.complete) {
            assert_eq!(chunk.total_processed, 1);
            assert_eq!(chunk.next_counter, 1);
            assert!(!chunk.failed);
            return;
        }
        std::thread::sleep(std::time::Duration::from_millis(1));
    }
    panic!("background vanity run did not complete");
}

#[test]
fn persistent_background_workers_cover_upstream_buckets_once() {
    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.count = "5".to_owned();
    value.workers = "3".to_owned();
    let run = VanityRun::new(value).unwrap();
    make_every_p2wpkh_candidate_match(&run);

    assert!(run.start());
    let chunks = background_chunks_until_complete(&run);
    let terminal = chunks
        .iter()
        .find(|chunk| chunk.complete)
        .expect("terminal pool snapshot");
    assert!(!terminal.stopped);
    assert_eq!(terminal.total_processed, 5);
    assert_eq!(terminal.total_found, 5);
    assert_eq!(terminal.next_counter, 5);

    let mut counters = chunks
        .iter()
        .flat_map(|chunk| chunk.matches.iter().map(|found| found.counter))
        .collect::<Vec<_>>();
    counters.sort_unstable();
    assert_eq!(counters, vec![0, 1, 2, 3, 4]);
}

#[test]
fn persistent_background_pool_bounds_retained_matches_but_reports_all_found() {
    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    // Each three-worker bucket exceeds the initial 512 candidate derivation
    // step, so every persistent worker has to retain its local state for a
    // second adaptive call.
    value.count = "1600".to_owned();
    value.workers = "3".to_owned();
    let run = VanityRun::new(value).unwrap();
    make_every_p2wpkh_candidate_match(&run);

    assert!(run.start());
    let chunks = background_chunks_until_complete(&run);
    let terminal = chunks
        .iter()
        .find(|chunk| chunk.complete)
        .expect("terminal pool snapshot");
    assert_eq!(terminal.total_processed, 1600);
    assert_eq!(terminal.total_found, 1600);
    assert_eq!(
        chunks
            .iter()
            .map(|chunk| chunk.matches.len())
            .sum::<usize>(),
        100
    );
}

#[test]
fn persistent_background_pool_stops_and_clear_suppresses_stale_snapshots() {
    let mut stopped_input = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    stopped_input.count = "100000".to_owned();
    stopped_input.workers = "3".to_owned();
    let stopped = VanityRun::new(stopped_input).unwrap();
    assert!(stopped.start());
    wait_for_background_progress(&stopped);
    stopped.stop();
    let chunks = background_chunks_until_complete(&stopped);
    let terminal = chunks
        .iter()
        .find(|chunk| chunk.complete)
        .expect("stopped terminal pool snapshot");
    assert!(terminal.stopped);
    assert!(terminal.total_processed < terminal.total_count);

    let mut cleared_input = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    cleared_input.count = "100000".to_owned();
    cleared_input.workers = "3".to_owned();
    let cleared = VanityRun::new(cleared_input).unwrap();
    assert!(cleared.start());
    wait_for_background_progress(&cleared);
    cleared.clear();
    assert_eq!(
        cleared.state().validation_kind,
        VanityValidationKind::RunCleared
    );
    std::thread::sleep(std::time::Duration::from_millis(250));
    assert!(cleared.take_chunks().is_empty());
}

#[test]
fn persistent_background_pool_reports_upstream_failures_without_hanging() {
    let run = VanityRun::new(input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    ))
    .unwrap();
    // The production validator never admits an empty prefix.  Mutating this
    // test-only hook makes the pinned upstream ABI reject the worker request,
    // exercising the terminal failure transport rather than a user stop.
    run.test_set_prefix_after_validation("");

    assert!(run.start());
    let chunks = background_chunks_until_complete(&run);
    let terminal = chunks
        .iter()
        .find(|chunk| chunk.complete)
        .expect("failed pool terminal snapshot");
    assert!(terminal.stopped);
    assert!(terminal.failed);
}

#[test]
fn cleared_run_does_not_claim_to_start_a_background_pool() {
    let run = VanityRun::new(input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    ))
    .unwrap();
    run.clear();

    assert!(!run.start());
    assert!(run.take_chunks().is_empty());
}

#[test]
fn vanity_input_state_reports_source_path_prefix_and_range_failures() {
    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.mnemonic.clear();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::MissingMnemonic
    );

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.account_path = "m/84'/1'/0'".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::NonMainnetCoinType
    );

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.account_path = "m/84'/0'".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::MissingAccountComponents
    );

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.branch_index = "2147483648".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::InvalidBranchIndex
    );

    let value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1q".to_owned(),
    );
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::PrefixTooShort
    );

    let value = input(
        VanityMethod::Passphrase,
        VanityScript::SilentPayments,
        "sp1qqx".to_owned(),
    );
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::SilentPaymentParity
    );

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.passphrase_length = "0".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::InvalidPassphraseLength
    );

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.start = "not-a-counter".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::InvalidStart
    );

    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.start = "2147483647".to_owned();
    value.count = "2".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::DerivationRangePast
    );
}

#[test]
fn vanity_input_state_distinguishes_path_root_index_and_depth_errors() {
    for (path, expected) in [
        ("", VanityValidationKind::PathRoot),
        ("m/", VanityValidationKind::PathRoot),
        ("m//0", VanityValidationKind::PathRoot),
        ("M/84'/0'/0'", VanityValidationKind::PathRoot),
        ("m/nope/0/0", VanityValidationKind::PathIndex),
        ("m/84'/0'/2147483648'", VanityValidationKind::PathIndex),
        ("m/84'/0'/0''", VanityValidationKind::PathIndex),
    ] {
        let mut value = input(
            VanityMethod::Passphrase,
            VanityScript::P2wpkh,
            "bc1qf".to_owned(),
        );
        value.account_path = path.to_owned();
        assert_eq!(
            vanity_input_state(value).validation_kind,
            expected,
            "{path}"
        );
    }

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.account_path = format!("m/{}", (0..17).map(|_| "0").collect::<Vec<_>>().join("/"));
    let state = vanity_input_state(value);
    assert_eq!(state.validation_kind, VanityValidationKind::PathTooLong);
    assert_eq!(state.maximum_path_components, 16);
}

#[test]
fn vanity_input_state_reports_normalized_byte_lengths_and_coin_type() {
    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.mnemonic = "a".repeat(1025);
    let state = vanity_input_state(value);
    assert_eq!(state.validation_kind, VanityValidationKind::MnemonicTooLong);
    assert_eq!(state.normalized_mnemonic_byte_length, 1025);
    assert_eq!(state.maximum_mnemonic_byte_length, 1024);

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.starting_passphrase = "\u{00e9}".repeat(129);
    let state = vanity_input_state(value);
    assert_eq!(
        state.validation_kind,
        VanityValidationKind::PassphraseTooLong
    );
    assert_eq!(state.normalized_starting_passphrase_byte_length, 387);
    assert_eq!(state.maximum_starting_passphrase_byte_length, 256);

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.account_path = "m/84'/1'/0'".to_owned();
    let state = vanity_input_state(value);
    assert_eq!(
        state.validation_kind,
        VanityValidationKind::NonMainnetCoinType
    );
    assert_eq!(state.coin_type, Some(1));
}

#[test]
fn vanity_input_state_distinguishes_counter_minimum_start_and_range_bounds() {
    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.count = "0".to_owned();
    let state = vanity_input_state(value);
    assert_eq!(
        state.validation_kind,
        VanityValidationKind::PassphraseRangeMinimum
    );
    assert_eq!(state.counter_limit.as_deref(), Some("62"));

    // Upstream validates a nonzero range before it compares the start to the
    // counter-space bound.
    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.start = "62".to_owned();
    value.count = "0".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::PassphraseRangeMinimum
    );

    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.count = "0".to_owned();
    let state = vanity_input_state(value);
    assert_eq!(
        state.validation_kind,
        VanityValidationKind::DerivationRangeMinimum
    );
    assert_eq!(state.counter_limit.as_deref(), Some("2147483648"));

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.start = "62".to_owned();
    let state = vanity_input_state(value);
    assert_eq!(
        state.validation_kind,
        VanityValidationKind::PassphraseStartBeyond
    );
    assert_eq!(state.counter_limit.as_deref(), Some("62"));

    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.start = "2147483648".to_owned();
    let state = vanity_input_state(value);
    assert_eq!(
        state.validation_kind,
        VanityValidationKind::DerivationStartBeyond
    );

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.start = "61".to_owned();
    value.count = "2".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::PassphraseRangePast
    );

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.passphrase_length = "11".to_owned();
    value.count = "18446744073709551616".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::PassphraseRangePast64Bit
    );

    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.start = "2147483647".to_owned();
    value.count = "2".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::DerivationRangePast
    );

    // For 11 characters and above, upstream caps the exclusive range at
    // u64::MAX rather than 62^length.  The whole capped space is valid.
    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.passphrase_length = "11".to_owned();
    value.count = u64::MAX.to_string();
    let state = vanity_input_state(value);
    assert!(state.valid);
    assert_eq!(state.counter_limit.as_deref(), Some("18446744073709551615"));

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.passphrase_length = "11".to_owned();
    value.start = "1".to_owned();
    value.count = u64::MAX.to_string();
    let state = vanity_input_state(value);
    assert_eq!(
        state.validation_kind,
        VanityValidationKind::PassphraseRangePast64Bit
    );
    assert_eq!(state.counter_limit.as_deref(), Some("18446744073709551615"));

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.passphrase_length = "11".to_owned();
    value.start = "18446744073709551616".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::PassphraseStartBeyond
    );

    // The upstream u64 cap is exclusive: its final valid candidate is
    // u64::MAX - 1, so this one-candidate range remains admissible.
    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.passphrase_length = "11".to_owned();
    value.start = (u64::MAX - 1).to_string();
    let state = vanity_input_state(value);
    assert!(state.valid);
    assert_eq!(state.counter_limit.as_deref(), Some("18446744073709551615"));

    let mut value = input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.passphrase_length = "1".to_owned();
    value.count = "18446744073709551616".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::PassphraseRangePast
    );

    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    );
    value.count = "18446744073709551616".to_owned();
    assert_eq!(
        vanity_input_state(value).validation_kind,
        VanityValidationKind::DerivationRangePast
    );
}

#[test]
fn passphrase_grind_matches_upstream_odometer_vectors_for_standard_scripts() {
    // Upstream's public vectors: 0 -> a, 61 -> 9, 1000 at length two -> qi.
    for (counter, length, suffix, addresses) in [
        (
            0u64,
            "1",
            "a",
            [
                "1HFXjqVAwytr1hrEswQmb5kapH44987ASi",
                "33BiCaH4uE35ivdXzkz2Tm4wnaCaVpmSWi",
                "bc1qkfqhajg5zsgej6eqgsv8x6vk66wqcppmklnjyv",
                "bc1p9f505lywg0gr6fgkd20jwh3hl68f9nvytenvgahcgyejw4nwj76s660wg0",
            ],
        ),
        (
            61,
            "1",
            "9",
            [
                "1JLJCToTMB6zvUdJyg2obfaekYP6gp9MMJ",
                "35ZHJe6XSbRnjy22XTQ7eRMymbEhiEwW3q",
                "bc1qhcsxt06vwl2c64hj6uggsf9s4j02jnpr9m9q87",
                "bc1pz5p9a4pf25qddh7ghqvujep3hvfjh6597v25pgpp0u438yv3k3rsmyxrn5",
            ],
        ),
        (
            1000,
            "2",
            "qi",
            [
                "1AHSb9XfEWbm2PpoMKGXygLbqnfAjuaG3Q",
                "3QUS6zk9wmBMjjG51a1YB6b1PDGrguygUL",
                "bc1qvh2jtktvsxr2tcdagpmqgrp4kxqhaapf4d029g",
                "bc1psycq9ydm3ng89wvf35mn7fcujawz52kgyxpzfkfwns56edhwy3rsppuv3r",
            ],
        ),
    ] {
        for (position, script) in [
            VanityScript::P2pkh,
            VanityScript::P2shP2wpkh,
            VanityScript::P2wpkh,
            VanityScript::P2tr,
        ]
        .into_iter()
        .enumerate()
        {
            let expected = addresses[position];
            let mut value = input(
                VanityMethod::Passphrase,
                script,
                prefix_for(expected, script),
            );
            value.passphrase_length = length.to_owned();
            value.start = counter.to_string();
            let found = one_match(value);
            assert_eq!(found.counter, counter);
            assert_eq!(found.candidate_passphrase, format!("{PASSPHRASE}{suffix}"));
            assert_eq!(found.path, "m/84'/0'/0'/0/0");
            assert_eq!(found.address, expected);
            assert_eq!(
                found.master_fingerprint,
                Some(
                    mnemonic_to_master_fingerprint(
                        MNEMONIC.to_owned(),
                        format!("{PASSPHRASE}{suffix}"),
                    )
                    .unwrap(),
                )
            );
        }
    }
}

#[test]
fn derivation_grind_preserves_the_account_hardening_bit() {
    for (account, hardened, expected) in [
        (
            5u32,
            true,
            "bc1pfk2p8e4lvtye26jk6uv6tenvqllcg2dy4ue47qhmq96hgr5s9whsjpszth",
        ),
        (
            6u32,
            false,
            "bc1pynusfe2pduk4hw4xgt6z98lcq6va77hrxvu5cvkls77vrm6qsqcqzwjgyw",
        ),
    ] {
        let mut value = input(
            VanityMethod::Derivation,
            VanityScript::P2tr,
            prefix_for(expected, VanityScript::P2tr),
        );
        value.account_path = format!("m/84'/0'/{account}{}", if hardened { "'" } else { "" });
        value.start = account.to_string();
        let found = one_match(value);
        assert_eq!(found.account_index, Some(account));
        assert!(found.candidate_passphrase.is_empty());
        assert_eq!(
            found.path,
            format!("m/84'/0'/{account}{}/0/0", if hardened { "'" } else { "" })
        );
        assert_eq!(found.address, expected);
        assert_eq!(found.master_fingerprint, Some("b4e3f5ed".to_owned()));
    }
}

#[test]
fn vanity_match_uses_the_established_uniffi_record_wire_shape() {
    let match_record = VanityMatch {
        counter: 17,
        account_index: Some(3),
        candidate_passphrase: "private-match".to_owned(),
        path: "m/84'/0'/3'/0/0".to_owned(),
        address: "bc1qexample".to_owned(),
        master_fingerprint: Some("deadbeef".to_owned()),
    };
    let lowered = <VanityMatch as uniffi::FfiConverter<crate::UniFfiTag>>::lower(match_record);
    let restored = <VanityMatch as uniffi::FfiConverter<crate::UniFfiTag>>::try_lift(lowered)
        .expect("the manual writer must remain compatible with UniFFI records");

    assert_eq!(restored.counter, 17);
    assert_eq!(restored.account_index, Some(3));
    assert_eq!(restored.candidate_passphrase, "private-match");
    assert_eq!(restored.path, "m/84'/0'/3'/0/0");
    assert_eq!(restored.address, "bc1qexample");
    assert_eq!(restored.master_fingerprint.as_deref(), Some("deadbeef"));
}

#[test]
fn silent_payment_grinds_use_the_bip352_account_scan_and_spend_paths() {
    for (counter, length, suffix, expected) in [
        (
            0u64,
            "1",
            "a",
            "sp1qq0dcmdy5lp803lyyx9phextuqtvsdhgsj5e6n2ly0m8smrm97en3qqascardec2qq7chrz8q0fdtwnk7xr9ntwrnfls8t0m6vf9xgwhsqvtpn0nn",
        ),
        (
            61,
            "1",
            "9",
            "sp1qqttwyvwkmjk0lsu6lnf6znqmrf3shxmf6h07ycur7jgd9pt0mdcgxquh6p84l7aqgktdltatfyu8dz4te2rp3mdxnk8yftv87hvwldcvzgqw5anl",
        ),
        (
            1000,
            "2",
            "qi",
            "sp1qqt3v86ugdjaymuhcfnzp8fzfygw6xgjxpuq2d4fh7vj8rpu87g892qslq2ugn0sthaltdhvwxhltlqe8zuynqu3wytgmc9glp6fuv4mctu8xjfcg",
        ),
    ] {
        let mut value = input(
            VanityMethod::Passphrase,
            VanityScript::SilentPayments,
            prefix_for(expected, VanityScript::SilentPayments),
        );
        value.passphrase_length = length.to_owned();
        value.start = counter.to_string();
        let passphrase = one_match(value);
        assert_eq!(passphrase.counter, counter);
        assert_eq!(passphrase.candidate_passphrase, format!("TREZOR{suffix}"));
        assert_eq!(passphrase.path, "m/352'/0'/0'");
        assert_eq!(passphrase.address, expected);
    }

    let expected = "sp1qqwm94m7pwswa8tu8c2v0rrlug48hp4pjq6ex0kuka92x49r9umkqkqk7erdxdx7z0vjcxkzquqxv03qchhn3xklgq5uusvkhrz7rj5378ql64up2";
    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::SilentPayments,
        prefix_for(expected, VanityScript::SilentPayments),
    );
    value.start = "3".to_owned();
    let derivation = one_match(value);
    assert_eq!(derivation.account_index, Some(3));
    assert_eq!(derivation.path, "m/352'/0'/3'");
    assert_eq!(derivation.address, expected);

    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::SilentPayments,
        "sp1qqg".to_owned(),
    );
    value.account_path = "m/84'/0'/3'".to_owned();
    let state = vanity_input_state(value);
    assert!(state.valid);
    assert_eq!(state.path, "m/352'/0'/3'");
    assert_eq!(state.silent_payment_scan_path, "m/352'/0'/3'/1'/0");
    assert_eq!(state.silent_payment_spend_path, "m/352'/0'/3'/0'/0");
    assert_eq!(state.expected_candidates, "8");
}

#[test]
fn chunks_continue_without_overlap_and_stop_or_clear_safely() {
    let target = expected_standard_address(PASSPHRASE, 0, true, VanityScript::P2wpkh);
    let mut value = input(
        VanityMethod::Derivation,
        VanityScript::P2wpkh,
        prefix_for(&target, VanityScript::P2wpkh),
    );
    value.count = "600".to_owned();
    let run = VanityRun::new(value).unwrap();
    let mut previous = 0u64;
    let mut all_matches = Vec::new();
    loop {
        let chunk = run.next_chunk().unwrap();
        assert_eq!(chunk.total_processed, previous + chunk.processed);
        assert_eq!(chunk.next_counter, chunk.total_processed);
        assert!((0.0..=100.0).contains(&chunk.progress_percent));
        previous = chunk.total_processed;
        all_matches.extend(chunk.matches);
        if chunk.complete {
            assert!(!chunk.stopped);
            break;
        }
    }
    assert_eq!(previous, 600);
    assert!(all_matches.iter().any(|found| found.counter == 0));
    assert!(all_matches
        .windows(2)
        .all(|pair| pair[0].counter < pair[1].counter));

    let stopped = VanityRun::new(input(
        VanityMethod::Passphrase,
        VanityScript::P2wpkh,
        "bc1qf".to_owned(),
    ))
    .unwrap();
    stopped.stop();
    let chunk = stopped.next_chunk().unwrap();
    assert!(chunk.stopped);
    assert!(chunk.complete);
    assert_eq!(chunk.processed, 0);

    run.clear();
    assert_eq!(
        run.state().validation_kind,
        VanityValidationKind::RunCleared
    );
    assert!(matches!(
        run.next_chunk(),
        Err(EntropyStudioError::VanityRunCleared)
    ));
}
