use super::*;

#[test]
fn bip39_entropy_bits_matches_supported_seed_lengths() {
    for (word_count, expected_bits) in [(12, 128), (15, 160), (18, 192), (21, 224), (24, 256)] {
        assert_eq!(bip39_entropy_bits(word_count).unwrap(), expected_bits);
    }
}

#[test]
fn sha256_uses_entropylab_implementation() {
    assert_eq!(
        sha256(b"abc".to_vec()),
        vec![
            0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae,
            0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61,
            0xf2, 0x00, 0x15, 0xad,
        ]
    );
}

#[test]
fn mnemonic_to_entropy_returns_bip39_entropy() {
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    assert_eq!(mnemonic_to_entropy(phrase.to_owned()).unwrap(), vec![0; 16]);
}

#[test]
fn seed_qr_data_returns_numeric_and_compact_seedqr_payloads() {
    let data = seed_qr_data(
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
            .to_owned(),
    )
    .unwrap();

    assert_eq!(data.word_count, 12);
    assert_eq!(data.numeric, format!("{}0003", "0000".repeat(11)));
    assert_eq!(data.compact, vec![0; 16]);
}

#[test]
fn seed_qr_data_is_unavailable_for_non_seedqr_word_counts() {
    let data = seed_qr_data(
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon address"
            .to_owned(),
    )
    .unwrap();

    assert_eq!(data.word_count, 15);
    assert!(data.numeric.is_empty());
    assert!(data.compact.is_empty());
}

#[test]
fn mnemonic_to_entropy_returns_typed_error() {
    assert!(matches!(
        mnemonic_to_entropy("not a valid mnemonic".to_owned()),
        Err(EntropyStudioError::InvalidMnemonic)
    ));
}

#[test]
fn mnemonic_to_seed_returns_bip39_master_seed() {
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    let seed = mnemonic_to_seed(phrase.to_owned(), "TREZOR".to_owned());

    assert_eq!(
        hex(&seed),
        "c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04"
    );
}

#[test]
fn mnemonic_to_master_fingerprint_matches_entropylab_bip32() {
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    assert_eq!(
        mnemonic_to_master_fingerprint(phrase.to_owned(), String::new()).unwrap(),
        "73c5da0a"
    );
    assert_eq!(
        mnemonic_to_master_fingerprint(phrase.to_owned(), "TREZOR".to_owned()).unwrap(),
        "b4e3f5ed"
    );
}

#[test]
fn mnemonic_to_master_xprv_matches_entropylab_bip32() {
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    assert_eq!(
        mnemonic_to_master_xprv(phrase.to_owned(), String::new()).unwrap(),
        "xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu"
    );
    assert_eq!(
        mnemonic_to_master_xprv(phrase.to_owned(), "TREZOR".to_owned()).unwrap(),
        "xprv9s21ZrQH143K3h3fDYiay8mocZ3afhfULfb5GX8kCBdno77K4HiA15Tg23wpbeF1pLfs1c5SPmYHrEpTuuRhxMwvKDwqdKiGJS9XFKzUsAF"
    );
}

#[test]
fn account_private_material_uses_the_selected_branch_in_its_descriptors() {
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    let material = account_private_material(phrase.to_owned(), String::new(), "m/84'/0'/0'".to_owned(), "73c5da0a".to_owned(), AccountScriptType::NativeSegwit, vec![0], 0, 1, false, false).unwrap();
    assert!(material.bitcoin_core_xprv.starts_with("xprv"));
    assert!(material.slip132_private.as_deref().is_some_and(|key| key.starts_with("zprv")));
    assert!(material.watch_only_change_descriptor.starts_with(&format!("wpkh([73c5da0a/84h/0h/0h]{}/0/*)#", material.bitcoin_core_xpub)));
    let address = material.first_watch_only_address.as_ref().expect("first selected address");
    assert!(!address.address.is_empty());
    assert_eq!(address.path, "m/84'/0'/0'/0/0");

    let five_addresses = account_private_material(phrase.to_owned(), String::new(), "m/84'/0'/0'".to_owned(), "73c5da0a".to_owned(), AccountScriptType::NativeSegwit, vec![0], 0, 5, false, false).unwrap();
    assert_eq!(five_addresses.watch_only_addresses.len(), 5);
    assert_eq!(five_addresses.watch_only_addresses[4].index, 4);

    let receive_and_change = account_private_material(phrase.to_owned(), String::new(), "m/84'/0'/0'".to_owned(), "73c5da0a".to_owned(), AccountScriptType::NativeSegwit, vec![0, 1], 0, 1, false, false).unwrap();
    assert!(receive_and_change.watch_only_change_descriptor.contains("/<0;1>/*)#"));

    let custom_purpose = account_private_material(phrase.to_owned(), String::new(), "m/44'/0'/0'".to_owned(), "73c5da0a".to_owned(), AccountScriptType::NativeSegwit, vec![0], 0, 1, true, true).unwrap();
    assert!(custom_purpose.slip132_private.is_none());
    assert!(custom_purpose.spending_change_descriptor.contains("/0h/*')#"));
}

#[test]
fn account_address_check_matches_shown_and_further_selected_branch_addresses() {
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    let material = account_private_material(phrase.to_owned(), String::new(), "m/84'/0'/0'".to_owned(), "73c5da0a".to_owned(), AccountScriptType::NativeSegwit, vec![0, 1], 0, 1, false, false).unwrap();
    let shown = account_address_check(phrase.to_owned(), String::new(), "m/84'/0'/0'".to_owned(), AccountScriptType::NativeSegwit, vec![0, 1], 0, 1, false, false, format!("bitcoin:{}?amount=1", material.first_watch_only_address.unwrap().address.to_uppercase())).unwrap();
    assert!(shown.is_match);
    assert!(!shown.beyond_shown);
    assert_eq!(shown.shown_count, 1);
    assert_eq!(shown.index, Some(0));
    let later = account_private_material(phrase.to_owned(), String::new(), "m/84'/0'/0'".to_owned(), "73c5da0a".to_owned(), AccountScriptType::NativeSegwit, vec![1], 2, 1, false, false).unwrap();
    let checked = account_address_check(phrase.to_owned(), String::new(), "m/84'/0'/0'".to_owned(), AccountScriptType::NativeSegwit, vec![0, 1], 0, 1, false, false, later.first_watch_only_address.unwrap().address).unwrap();
    assert!(checked.is_match);
    assert!(checked.beyond_shown);
    assert_eq!(checked.branch, Some(1));
    assert_eq!(checked.index, Some(2));
    assert_eq!(checked.path.as_deref(), Some("m/84'/0'/0'/1/2"));
}

#[test]
fn mnemonic_to_master_xpub_returns_a_mainnet_watch_only_root_key() {
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    let xpub = mnemonic_to_master_xpub(phrase.to_owned(), String::new()).unwrap();

    assert_eq!(
        xpub,
        "xpub661MyMwAqRbcFkPHucMnrGNzDwb6teAX1RbKQmqtEF8kK3Z7LZ59qafCjB9eCRLiTVG3uxBxgKvRgbubRhqSKXnGGb1aoaqLrpMBDrVxga8"
    );
}

#[test]
fn mnemonic_to_seed_nfkd_normalizes_the_passphrase() {
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    let composed = mnemonic_to_seed(phrase.to_owned(), "\u{00e9}".to_owned());
    let decomposed = mnemonic_to_seed(phrase.to_owned(), "e\u{0301}".to_owned());

    assert_eq!(composed, decomposed);
}

#[test]
fn entropy_to_mnemonic_returns_bip39_phrase() {
    assert_eq!(
        entropy_to_mnemonic(vec![0; 16]).unwrap(),
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
    );
}

#[test]
fn entropy_to_mnemonic_returns_typed_error() {
    assert!(matches!(
        entropy_to_mnemonic(vec![0; 17]),
        Err(EntropyStudioError::InvalidEntropy)
    ));
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}
