use super::*;

const KEY_ONE_HEX: &str = "0000000000000000000000000000000000000000000000000000000000000001";
const MAINNET_WIF: &str = "KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn";
const TESTNET_WIF: &str = "cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN87JcbXMTcA";
const MINI_KEY: &str = "S6c56bnXQiBjk9mqSYE7ykVQ7NzrRy";

fn key_allowed(value: &str, character: &str, format: PrivateKeyFormat) -> bool {
    private_key_key_allowed(
        value.to_owned(),
        value.len() as u32,
        value.len() as u32,
        character.to_owned(),
        format,
    )
}

#[test]
fn private_key_entropy_matches_mainnet_wif_hex_and_minikey_vectors() {
    let expected_key_one = {
        let mut value = vec![0u8; 31];
        value.push(1);
        value
    };

    assert_eq!(
        private_key_entropy(MAINNET_WIF.to_owned(), PrivateKeyFormat::Wif).unwrap(),
        expected_key_one
    );
    assert_eq!(
        private_key_entropy(
            format!("  0x{} {}  ", &KEY_ONE_HEX[..32], &KEY_ONE_HEX[32..]),
            PrivateKeyFormat::Hex,
        )
        .unwrap(),
        expected_key_one
    );
    assert_eq!(
        private_key_entropy(MINI_KEY.to_owned(), PrivateKeyFormat::MiniKey).unwrap(),
        vec![
            0x4c, 0x7a, 0x96, 0x40, 0xc7, 0x2d, 0xc2, 0x09, 0x9f, 0x23, 0x71, 0x5d, 0x0c, 0x8a,
            0x0d, 0x8a, 0x35, 0xf8, 0x90, 0x6e, 0x3c, 0xab, 0x61, 0xdd, 0x3f, 0x78, 0xb6, 0x7b,
            0xf8, 0x87, 0xc9, 0xab,
        ]
    );
}

#[test]
fn brain_wallet_entropy_hashes_exact_utf8_text() {
    assert_eq!(
        private_key_entropy("abc".to_owned(), PrivateKeyFormat::BrainWallet).unwrap(),
        vec![
            0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae,
            0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61,
            0xf2, 0x00, 0x15, 0xad,
        ]
    );
    assert_ne!(
        private_key_entropy(
            " recovery phrase ".to_owned(),
            PrivateKeyFormat::BrainWallet
        )
        .unwrap(),
        private_key_entropy("recovery phrase".to_owned(), PrivateKeyFormat::BrainWallet).unwrap()
    );
}

#[test]
fn private_key_key_admission_matches_upstream_prefix_rules() {
    for first_character in ["5", "K", "L"] {
        assert!(key_allowed("", first_character, PrivateKeyFormat::Wif));
    }
    for first_character in ["9", "c", "a"] {
        assert!(!key_allowed("", first_character, PrivateKeyFormat::Wif));
    }
    assert!(key_allowed(
        &MAINNET_WIF[..MAINNET_WIF.len() - 1],
        &MAINNET_WIF[MAINNET_WIF.len() - 1..],
        PrivateKeyFormat::Wif
    ));
    assert!(!key_allowed(
        &MAINNET_WIF[..MAINNET_WIF.len() - 1],
        "o",
        PrivateKeyFormat::Wif
    ));

    assert!(key_allowed("", "0", PrivateKeyFormat::Hex));
    assert!(key_allowed("0", "x", PrivateKeyFormat::Hex));
    assert!(key_allowed(
        &KEY_ONE_HEX[..KEY_ONE_HEX.len() - 1],
        &KEY_ONE_HEX[KEY_ONE_HEX.len() - 1..],
        PrivateKeyFormat::Hex
    ));
    assert!(!key_allowed(&"0".repeat(63), "0", PrivateKeyFormat::Hex));

    assert!(key_allowed("", "S", PrivateKeyFormat::MiniKey));
    assert!(key_allowed(
        &MINI_KEY[..MINI_KEY.len() - 1],
        &MINI_KEY[MINI_KEY.len() - 1..],
        PrivateKeyFormat::MiniKey
    ));
    assert!(!key_allowed(
        &MINI_KEY[..MINI_KEY.len() - 1],
        "z",
        PrivateKeyFormat::MiniKey
    ));
    assert!(key_allowed("", " ", PrivateKeyFormat::BrainWallet));
}

#[test]
fn private_key_input_state_owns_progress_and_readiness() {
    let empty_wif = private_key_input_state(String::new(), PrivateKeyFormat::Wif);
    assert_eq!(empty_wif.entered_count, 0);
    assert_eq!(empty_wif.minimum_count, 51);
    assert_eq!(empty_wif.maximum_count, 52);
    assert_eq!(empty_wif.required_count, 0);
    assert!(matches!(empty_wif.status, PrivateKeyInputStatus::Prefix));
    assert!(!empty_wif.can_derive);

    let wif_prefix = private_key_input_state("5".to_owned(), PrivateKeyFormat::Wif);
    assert_eq!(wif_prefix.entered_count, 1);
    assert_eq!(wif_prefix.required_count, 51);
    assert_eq!(wif_prefix.remaining_count, 50);
    assert!(matches!(
        wif_prefix.status,
        PrivateKeyInputStatus::Incomplete
    ));
    assert!(!wif_prefix.can_derive);

    let valid_wif = private_key_input_state(MAINNET_WIF.to_owned(), PrivateKeyFormat::Wif);
    assert_eq!(valid_wif.entered_count, 52);
    assert_eq!(valid_wif.required_count, 52);
    assert_eq!(valid_wif.remaining_count, 0);
    assert!(matches!(valid_wif.status, PrivateKeyInputStatus::Ready));
    assert!(valid_wif.can_derive);

    let testnet_wif = private_key_input_state(TESTNET_WIF.to_owned(), PrivateKeyFormat::Wif);
    assert!(matches!(testnet_wif.status, PrivateKeyInputStatus::Invalid));
    assert!(!testnet_wif.can_derive);

    let hex_prefix = private_key_input_state("0x0".to_owned(), PrivateKeyFormat::Hex);
    assert_eq!(hex_prefix.entered_count, 1);
    assert_eq!(hex_prefix.required_count, 64);
    assert_eq!(hex_prefix.remaining_count, 63);
    assert!(matches!(
        hex_prefix.status,
        PrivateKeyInputStatus::Incomplete
    ));

    let mini_prefix = private_key_input_state("S".to_owned(), PrivateKeyFormat::MiniKey);
    assert_eq!(mini_prefix.entered_count, 1);
    assert_eq!(mini_prefix.required_count, 22);
    assert_eq!(mini_prefix.remaining_count, 21);
    assert!(matches!(
        mini_prefix.status,
        PrivateKeyInputStatus::Incomplete
    ));

    let brain_wallet = private_key_input_state("text".to_owned(), PrivateKeyFormat::BrainWallet);
    assert_eq!(brain_wallet.entered_count, 4);
    assert!(matches!(brain_wallet.status, PrivateKeyInputStatus::Ready));
    assert!(brain_wallet.can_derive);
}

#[test]
fn private_key_entropy_rejects_invalid_input() {
    assert!(matches!(
        private_key_entropy("0".repeat(64), PrivateKeyFormat::Hex),
        Err(EntropyStudioError::InvalidPrivateKeyRange)
    ));
    let mut malformed_compressed_payload = [0u8; 34];
    malformed_compressed_payload[0] = 0x80;
    malformed_compressed_payload[32] = 1;
    malformed_compressed_payload[33] = 2;
    let mut malformed_compressed_wif_bytes = [0u8; 64];
    let encoded_length = unsafe {
        entropylab_wasm::el_b58check_encode(
            malformed_compressed_payload.as_ptr(),
            malformed_compressed_payload.len(),
            malformed_compressed_wif_bytes.as_mut_ptr(),
            malformed_compressed_wif_bytes.len(),
        )
    };
    let malformed_compressed_wif =
        std::str::from_utf8(&malformed_compressed_wif_bytes[..encoded_length as usize])
            .unwrap()
            .to_owned();
    wipe_bytes(&mut malformed_compressed_payload);
    wipe_bytes(&mut malformed_compressed_wif_bytes);
    assert!(matches!(
        private_key_entropy(malformed_compressed_wif, PrivateKeyFormat::Wif),
        Err(EntropyStudioError::InvalidWifPrivateKey)
    ));
    assert!(matches!(
        private_key_entropy("not-a-key".to_owned(), PrivateKeyFormat::Wif),
        Err(EntropyStudioError::InvalidWifPrivateKey)
    ));
    assert!(matches!(
        private_key_entropy(TESTNET_WIF.to_owned(), PrivateKeyFormat::Wif),
        Err(EntropyStudioError::InvalidWifPrivateKey)
    ));
    assert!(matches!(
        private_key_entropy(
            "S6c56bnXQiBjk9mqSYE7ykVQ7NzrRz".to_owned(),
            PrivateKeyFormat::MiniKey
        ),
        Err(EntropyStudioError::InvalidMiniPrivateKey)
    ));
    assert!(matches!(
        private_key_entropy(String::new(), PrivateKeyFormat::BrainWallet),
        Err(EntropyStudioError::EmptyBrainWallet)
    ));
}
