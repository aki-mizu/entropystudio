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
