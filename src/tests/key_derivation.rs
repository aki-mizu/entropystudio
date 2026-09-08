use super::*;

fn state(
    purpose: &str,
    coin_type: &str,
    account: &str,
    branch_start: &str,
    branch_range: &str,
    address_start: &str,
    address_range: &str,
) -> KeyDerivationAdvancedState {
    key_derivation_advanced_state(KeyDerivationAdvancedInput {
        purpose: purpose.to_owned(),
        coin_type: coin_type.to_owned(),
        account: account.to_owned(),
        branch_start: branch_start.to_owned(),
        branch_range: branch_range.to_owned(),
        address_start: address_start.to_owned(),
        address_range: address_range.to_owned(),
    })
}

fn advanced_input(
    purpose: &str,
    coin_type: &str,
    account: &str,
    branch_start: &str,
    branch_range: &str,
    address_start: &str,
    address_range: &str,
) -> KeyDerivationAdvancedInput {
    KeyDerivationAdvancedInput {
        purpose: purpose.to_owned(),
        coin_type: coin_type.to_owned(),
        account: account.to_owned(),
        branch_start: branch_start.to_owned(),
        branch_range: branch_range.to_owned(),
        address_start: address_start.to_owned(),
        address_range: address_range.to_owned(),
    }
}

#[test]
fn advanced_derivation_state_models_the_receive_and_change_vector() {
    let state = state("84'", "0'", "0'", "0", "2", "0", "5");

    assert!(state.valid);
    assert!(state.windows_valid);
    assert_eq!(state.network_kind, KeyDerivationNetworkKind::Mainnet);
    assert_eq!(state.validation_kind, KeyDerivationValidationKind::Valid);
    assert_eq!(
        state.path_help_kind,
        KeyDerivationPathHelpKind::MultipleBranchesAndIndexes
    );

    assert!(state.purpose.hardened);
    assert!(state.coin_type.hardened);
    assert!(state.account.hardened);
    assert!(!state.branch_window.start.hardened);
    assert!(!state.address_window.start.hardened);
    assert_eq!(state.branch_window.range.maximum, 2);
    assert_eq!(state.address_window.range.maximum, 10_000);
    assert_eq!(state.branch_window.end, 1);
    assert_eq!(state.address_window.end, 4);
    assert_eq!(state.address_count, 10);
    assert_eq!(
        state
            .branch_window
            .branches
            .iter()
            .map(|branch| (branch.index, branch.role))
            .collect::<Vec<_>>(),
        vec![
            (0, KeyDerivationBranchRole::Receive),
            (1, KeyDerivationBranchRole::Change),
        ]
    );
}

#[test]
fn address_estimate_uses_the_native_benchmark_for_valid_windows_only() {
    let benchmark = key_derivation_address_benchmark_milliseconds();
    assert!(benchmark.is_finite());
    assert!(benchmark >= 0.01);

    // The regular Key Station estimate counts four address-key operations for
    // each selected address. Its window remains meaningful while an unrelated
    // account-prefix draft is temporarily invalid, just as upstream's status
    // widget does.
    let receive_and_change = advanced_input("", "0'", "0'", "0", "2", "0", "5");
    let estimated = key_derivation_address_estimate_milliseconds(receive_and_change);
    assert!((estimated - benchmark * 40.0).abs() < f64::EPSILON);

    let invalid_range = advanced_input("84'", "0'", "0'", "0", "1", "0", "0");
    assert_eq!(
        key_derivation_address_estimate_milliseconds(invalid_range),
        0.0
    );
}

#[test]
fn advanced_derivation_state_preserves_hardening_and_coin_type_semantics() {
    let testnet = state("84h", "1H", "7", "1'", "1", "12h", "1");

    assert!(testnet.valid);
    assert!(testnet.purpose.hardened);
    assert!(testnet.coin_type.hardened);
    assert!(!testnet.account.hardened);
    assert!(testnet.branch_window.start.hardened);
    assert!(testnet.address_window.start.hardened);
    assert_eq!(testnet.network_kind, KeyDerivationNetworkKind::Testnet);
    assert_eq!(
        testnet.branch_window.branches[0].role,
        KeyDerivationBranchRole::Change
    );

    let custom = state("84'", "2'", "0'", "2", "1", "0", "1");
    assert!(custom.valid);
    assert_eq!(
        custom.network_kind,
        KeyDerivationNetworkKind::CustomMainnetAddresses
    );
    assert_eq!(
        custom.branch_window.branches[0].role,
        KeyDerivationBranchRole::Custom
    );
    assert_eq!(custom.branch_window.branches[0].index, 2);
}

#[test]
fn advanced_derivation_state_clamps_numeric_ranges_to_dynamic_maxima() {
    let default_maxima = state("84'", "0'", "0'", "0", "3", "0", "10001");

    assert!(default_maxima.valid);
    assert_eq!(default_maxima.branch_window.range.maximum, 2);
    assert_eq!(default_maxima.branch_window.range.value, 2);
    assert_eq!(default_maxima.branch_window.range.display_value, "2");
    assert_eq!(default_maxima.address_window.range.maximum, 10_000);
    assert_eq!(default_maxima.address_window.range.value, 10_000);
    assert_eq!(default_maxima.address_window.range.display_value, "10000");

    let javascript_safe_oversize = state(
        "84'",
        "0'",
        "0'",
        "0",
        "9007199254740991",
        "0",
        "9007199254740991",
    );
    assert!(javascript_safe_oversize.valid);
    assert_eq!(javascript_safe_oversize.branch_window.range.value, 2);
    assert_eq!(javascript_safe_oversize.address_window.range.value, 10_000);

    let javascript_unsafe_oversize = state("84'", "0'", "0'", "0", "9007199254740992", "0", "1");
    assert!(!javascript_unsafe_oversize.branch_window.range.valid);

    let at_maximum = state("84'", "0'", "0'", "2147483647", "2", "2147483647", "10000");

    assert!(at_maximum.valid);
    assert_eq!(at_maximum.branch_window.range.maximum, 1);
    assert_eq!(at_maximum.branch_window.range.value, 1);
    assert_eq!(at_maximum.branch_window.range.display_value, "1");
    assert_eq!(at_maximum.branch_window.end, 2_147_483_647);
    assert_eq!(at_maximum.address_window.range.maximum, 1);
    assert_eq!(at_maximum.address_window.range.value, 1);
    assert_eq!(at_maximum.address_window.range.display_value, "1");
    assert_eq!(at_maximum.address_window.end, 2_147_483_647);

    let final_two_indexes = state("84'", "0'", "0'", "2147483646", "2", "2147483646", "2");
    assert!(final_two_indexes.valid);
    assert_eq!(final_two_indexes.branch_window.range.maximum, 2);
    assert_eq!(final_two_indexes.branch_window.end, 2_147_483_647);
    assert_eq!(final_two_indexes.address_window.range.maximum, 2);
    assert_eq!(final_two_indexes.address_window.end, 2_147_483_647);
}

#[test]
fn advanced_derivation_state_tracks_invalid_drafts_without_inventing_a_window() {
    let invalid_branch_start = state("84'", "0'", "0'", "2147483648", "3", "0", "1");

    assert!(!invalid_branch_start.valid);
    assert!(!invalid_branch_start.windows_valid);
    assert!(!invalid_branch_start.branch_window.start.valid);
    assert_eq!(invalid_branch_start.branch_window.range.maximum, 2);
    assert!(invalid_branch_start.branch_window.range.valid);
    assert_eq!(invalid_branch_start.branch_window.range.value, 2);
    assert!(invalid_branch_start.branch_window.branches.is_empty());
    assert_eq!(
        invalid_branch_start.path_help_kind,
        KeyDerivationPathHelpKind::Invalid
    );
    assert_eq!(
        invalid_branch_start.validation_kind,
        KeyDerivationValidationKind::BranchStart
    );

    let invalid_ranges = state("84'", "0'", "0'", "0", "0", "0", "not-a-number");
    assert!(!invalid_ranges.valid);
    assert!(!invalid_ranges.branch_window.range.valid);
    assert_eq!(invalid_ranges.branch_window.range.display_value, "0");
    assert!(!invalid_ranges.address_window.range.valid);
    assert_eq!(
        invalid_ranges.address_window.range.display_value,
        "not-a-number"
    );
    assert_eq!(invalid_ranges.branch_window.end, 0);
    assert_eq!(invalid_ranges.address_window.end, 0);
    assert_eq!(
        invalid_ranges.validation_kind,
        KeyDerivationValidationKind::BranchRange
    );

    let invalid_address_range = state("84'", "0'", "0'", "0", "1", "0", "0");
    assert_eq!(
        invalid_address_range.validation_kind,
        KeyDerivationValidationKind::AddressRange
    );

    let invalid_coin_type = state("84'", "2,147", "0'", "0", "1", "0", "1");
    assert!(!invalid_coin_type.valid);
    assert_eq!(
        invalid_coin_type.network_kind,
        KeyDerivationNetworkKind::Invalid
    );
    assert_eq!(
        invalid_coin_type.path_help_kind,
        KeyDerivationPathHelpKind::Invalid
    );
    assert_eq!(
        invalid_coin_type.validation_kind,
        KeyDerivationValidationKind::AccountPrefix
    );
}

#[test]
fn advanced_derivation_state_uses_upstream_path_help_variants() {
    let exact = state("84'", "0'", "0'", "0", "1", "0", "1");
    assert_eq!(exact.path_help_kind, KeyDerivationPathHelpKind::Exact);

    let branches = state("84'", "0'", "0'", "0", "2", "0", "1");
    assert_eq!(
        branches.path_help_kind,
        KeyDerivationPathHelpKind::MultipleBranches
    );

    let indexes = state("84'", "0'", "0'", "0", "1", "0", "2");
    assert_eq!(
        indexes.path_help_kind,
        KeyDerivationPathHelpKind::MultipleIndexes
    );
}

#[test]
fn advanced_derivation_state_matches_bip32_component_admission() {
    let canonical = state(" 84H ", " 0' ", " 0 ", " 0h ", " 1 ", " 0 ", " 1 ");
    assert!(canonical.valid);
    assert_eq!(canonical.purpose.value, 84);
    assert!(canonical.purpose.hardened);
    assert_eq!(canonical.coin_type.value, 0);
    assert!(canonical.coin_type.hardened);
    assert_eq!(canonical.account.value, 0);
    assert!(!canonical.account.hardened);
    assert_eq!(canonical.branch_window.start.value, 0);
    assert!(canonical.branch_window.start.hardened);

    for invalid_component in ["", "'", "-1", "+1", "1.0", "1''", "2147483648", "١"] {
        let state = state(invalid_component, "0'", "0'", "0", "1", "0", "1");
        assert!(!state.purpose.valid, "{invalid_component:?}");
        assert!(!state.valid, "{invalid_component:?}");
    }

    let invalid_hardened = state("2147483648h", "0'", "0'", "0", "1", "0", "1");
    assert!(!invalid_hardened.purpose.valid);
    assert!(invalid_hardened.purpose.hardened);
}

#[test]
fn advanced_path_projection_uses_the_range_selected_hierarchy_level() {
    let exact = key_derivation_project_advanced_path(KeyDerivationPathProjectionInput {
        account_path: "m/44'/1'/2'/777h".to_owned(),
        advanced: advanced_input("84'", "0'", "7'", "4h", "1", "9H", "1"),
    });

    assert!(exact.valid);
    assert!(exact.advanced_state.valid);
    assert_eq!(exact.display_kind, KeyDerivationPathDisplayKind::Exact);
    assert_eq!(exact.account_path, "m/84'/0'/7'/777'");
    assert_eq!(exact.visible_path, "m/84'/0'/7'/777'/4'/9'");

    let branch = key_derivation_project_advanced_path(KeyDerivationPathProjectionInput {
        account_path: exact.account_path,
        advanced: advanced_input("84'", "0'", "7'", "4h", "1", "9H", "2"),
    });
    assert_eq!(branch.display_kind, KeyDerivationPathDisplayKind::Branch);
    assert_eq!(branch.account_path, "m/84'/0'/7'/777'");
    assert_eq!(branch.visible_path, "m/84'/0'/7'/777'/4'");

    let account = key_derivation_project_advanced_path(KeyDerivationPathProjectionInput {
        account_path: branch.account_path,
        advanced: advanced_input("84'", "0'", "7'", "0", "2", "9H", "5"),
    });
    assert_eq!(account.display_kind, KeyDerivationPathDisplayKind::Account);
    assert_eq!(account.account_path, "m/84'/0'/7'/777'");
    assert_eq!(account.visible_path, "m/84'/0'/7'/777'");
}

#[test]
fn advanced_path_projection_rejects_invalid_drafts_without_replacing_the_visible_path() {
    let invalid = key_derivation_project_advanced_path(KeyDerivationPathProjectionInput {
        account_path: "m/84'/0'/0'/101".to_owned(),
        advanced: advanced_input("84'", "0'", "0'", "0", "0", "0", "1"),
    });

    assert!(!invalid.valid);
    assert!(!invalid.advanced_state.valid);
    assert_eq!(
        invalid.advanced_state.validation_kind,
        KeyDerivationValidationKind::BranchRange
    );
    assert_eq!(invalid.display_kind, KeyDerivationPathDisplayKind::Invalid);
    assert!(invalid.account_path.is_empty());
    assert!(invalid.visible_path.is_empty());

    let malformed_cache = key_derivation_project_advanced_path(KeyDerivationPathProjectionInput {
        account_path: "not a path".to_owned(),
        advanced: advanced_input("84'", "0'", "0'", "0", "1", "0", "1"),
    });
    assert!(malformed_cache.valid);
    assert!(malformed_cache.advanced_state.valid);
    assert_eq!(malformed_cache.account_path, "m/84'/0'/0'");
    assert_eq!(malformed_cache.visible_path, "m/84'/0'/0'/0/0");
}

#[test]
fn visible_path_parser_accepts_account_branch_and_exact_path_shapes() {
    let account = key_derivation_visible_path_state(KeyDerivationVisiblePathInput {
        path: " m/84H/0'/7' ".to_owned(),
        branch_start: "0".to_owned(),
        branch_range: "2".to_owned(),
        address_start: "9".to_owned(),
        address_range: "5".to_owned(),
    });
    assert!(account.valid);
    assert_eq!(account.display_kind, KeyDerivationPathDisplayKind::Account);
    assert_eq!(account.visible_path, "m/84'/0'/7'");
    assert_eq!(account.account_path, "m/84'/0'/7'");
    assert_eq!(account.account_components.len(), 3);
    assert!(account.branch.is_none());
    assert!(account.address.is_none());

    let branch = key_derivation_visible_path_state(KeyDerivationVisiblePathInput {
        path: "m/84'/0'/7'/4H".to_owned(),
        branch_start: "4".to_owned(),
        branch_range: "1".to_owned(),
        address_start: "9".to_owned(),
        address_range: "2".to_owned(),
    });
    assert!(branch.valid);
    assert_eq!(branch.display_kind, KeyDerivationPathDisplayKind::Branch);
    assert_eq!(branch.account_path, "m/84'/0'/7'");
    assert_eq!(
        branch.branch,
        Some(KeyDerivationPathComponent {
            index: 4,
            hardened: true
        })
    );
    assert!(branch.address.is_none());

    let exact = key_derivation_visible_path_state(KeyDerivationVisiblePathInput {
        path: "m/84H/0'/7'/4h/9H".to_owned(),
        branch_start: "4".to_owned(),
        branch_range: "1".to_owned(),
        address_start: "9".to_owned(),
        address_range: "1".to_owned(),
    });
    assert!(exact.valid);
    assert_eq!(exact.display_kind, KeyDerivationPathDisplayKind::Exact);
    assert_eq!(exact.account_path, "m/84'/0'/7'");
    assert_eq!(exact.visible_path, "m/84'/0'/7'/4'/9'");
    assert_eq!(
        exact.branch,
        Some(KeyDerivationPathComponent {
            index: 4,
            hardened: true
        })
    );
    assert_eq!(
        exact.address,
        Some(KeyDerivationPathComponent {
            index: 9,
            hardened: true
        })
    );
}

#[test]
fn visible_path_parser_preserves_extra_account_components_before_its_suffix() {
    let parsed = key_derivation_visible_path_state(KeyDerivationVisiblePathInput {
        path: "m/84'/0'/7'/201/202h/4".to_owned(),
        branch_start: "4".to_owned(),
        branch_range: "1".to_owned(),
        address_start: "9".to_owned(),
        address_range: "2".to_owned(),
    });

    assert!(parsed.valid);
    assert_eq!(parsed.display_kind, KeyDerivationPathDisplayKind::Branch);
    assert_eq!(parsed.account_path, "m/84'/0'/7'/201/202'");
    assert_eq!(parsed.account_components.len(), 5);
    assert_eq!(parsed.account_components[3].index, 201);
    assert!(!parsed.account_components[3].hardened);
    assert_eq!(parsed.account_components[4].index, 202);
    assert!(parsed.account_components[4].hardened);
    assert_eq!(
        parsed.branch,
        Some(KeyDerivationPathComponent {
            index: 4,
            hardened: false
        })
    );
}

#[test]
fn visible_path_parser_reports_path_and_window_errors_in_upstream_order() {
    let root_before_window = key_derivation_visible_path_state(KeyDerivationVisiblePathInput {
        path: "wrong/84'/0'/0'".to_owned(),
        branch_start: "0".to_owned(),
        branch_range: "0".to_owned(),
        address_start: "0".to_owned(),
        address_range: "1".to_owned(),
    });
    assert!(!root_before_window.valid);
    assert_eq!(
        root_before_window.validation_kind,
        KeyDerivationVisiblePathValidationKind::Root
    );

    let index = key_derivation_visible_path_state(KeyDerivationVisiblePathInput {
        path: "m/84'/oops/0'/0/0".to_owned(),
        branch_start: "0".to_owned(),
        branch_range: "1".to_owned(),
        address_start: "0".to_owned(),
        address_range: "1".to_owned(),
    });
    assert_eq!(
        index.validation_kind,
        KeyDerivationVisiblePathValidationKind::Index
    );

    let missing_branch = key_derivation_visible_path_state(KeyDerivationVisiblePathInput {
        path: "m/84'/0'/0'".to_owned(),
        branch_start: "0".to_owned(),
        branch_range: "1".to_owned(),
        address_start: "0".to_owned(),
        address_range: "2".to_owned(),
    });
    assert_eq!(
        missing_branch.validation_kind,
        KeyDerivationVisiblePathValidationKind::MissingComponents
    );

    let invalid_branch_range = key_derivation_visible_path_state(KeyDerivationVisiblePathInput {
        path: "m/84'/0'/0'/0/0".to_owned(),
        branch_start: "0".to_owned(),
        branch_range: "0".to_owned(),
        address_start: "0".to_owned(),
        address_range: "1".to_owned(),
    });
    assert_eq!(
        invalid_branch_range.validation_kind,
        KeyDerivationVisiblePathValidationKind::BranchRange
    );
}
