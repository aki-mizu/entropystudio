use super::*;

#[test]
fn entropy_sync_emits_upstream_direct_representations() {
    let snapshot = synchronize_entropy(
        "0".repeat(32),
        EntropySyncSource::NumberBaseHex,
        12,
        false,
        String::new(),
    )
    .unwrap();

    assert_eq!(snapshot.bit_count, 128);
    assert_eq!(snapshot.effective_entropy_bits, 128);
    assert!(!snapshot.entropy_strength_unknown);
    assert!(!snapshot.entropy_below_minimum);
    assert_eq!(snapshot.minimum_entropy_bits, 128);
    assert_eq!(snapshot.hex, "0".repeat(32));
    assert_eq!(snapshot.base32, format!("{}000", "0".repeat(25)));
    assert_eq!(snapshot.base64, format!("{}00", "A".repeat(21)));
    assert_eq!(
        snapshot.seed_words,
        format!("{} about", vec!["abandon"; 11].join(" "))
    );
    assert_eq!(
        snapshot.seed_numbers_zero_indexed,
        format!("{} 3", vec!["0"; 11].join(" "))
    );
    assert_eq!(
        snapshot.seed_numbers_one_indexed,
        format!("{} 4", vec!["1"; 11].join(" "))
    );
    assert_eq!(snapshot.bitbox_dice, vec!["111111"; 11].join(" "));
    assert_eq!(
        snapshot.d8_d16_dice,
        format!("{} 10", vec!["100"; 11].join(" "))
    );
    assert_eq!(
        snapshot.direct_cards,
        format!("{} AAA", vec!["AAAA"; 11].join(" "))
    );
    assert_eq!(snapshot.hex_private_key, "0".repeat(32));
    assert!(snapshot.wif_private_key.is_empty());

    assert_eq!(
        number_base_entropy(snapshot.hex.clone(), NumberBaseFormat::Hex, 12).unwrap(),
        vec![0; 16]
    );

    let bitbox = direct_dice_input_state(
        snapshot.bitbox_dice.clone(),
        DirectDiceMethod::Bitbox,
        12,
        "about".to_owned(),
    )
    .unwrap();
    assert_eq!(bitbox.mnemonic, snapshot.seed_words);

    let d8_d16 = direct_dice_input_state(
        snapshot.d8_d16_dice.clone(),
        DirectDiceMethod::D8D16,
        12,
        String::new(),
    )
    .unwrap();
    assert_eq!(d8_d16.mnemonic, snapshot.seed_words);

    let cards = direct_card_state(snapshot.direct_cards.clone(), 12).unwrap();
    assert!(cards.complete);
    assert_eq!(
        format!("{} {}", cards.words.join(" "), cards.final_word),
        snapshot.seed_words
    );
}

#[test]
fn entropy_sync_emits_only_complete_destination_symbols() {
    let snapshot = synchronize_entropy(
        "10101".to_owned(),
        EntropySyncSource::NumberBaseBin,
        12,
        false,
        String::new(),
    )
    .unwrap();

    assert_eq!(snapshot.bit_count, 5);
    assert_eq!(snapshot.effective_entropy_bits, 5);
    assert!(!snapshot.entropy_strength_unknown);
    assert!(snapshot.entropy_below_minimum);
    assert_eq!(snapshot.minimum_entropy_bits, 128);
    assert_eq!(snapshot.bin, "10101");
    assert_eq!(snapshot.base4, "22");
    assert_eq!(snapshot.base8, "5");
    assert_eq!(snapshot.hex, "A");
    assert_eq!(snapshot.base32, "N");
    assert!(snapshot.base64.is_empty());
    assert!(snapshot.seed_words.is_empty());

    let d8_d16_snapshot = synchronize_entropy(
        "00000000000".to_owned(),
        EntropySyncSource::NumberBaseBin,
        12,
        false,
        String::new(),
    )
    .unwrap();
    assert_eq!(d8_d16_snapshot.d8_d16_dice, "100");
}

#[test]
fn entropy_sync_accepts_hashed_sources_without_reverse_filling_them() {
    let snapshot = synchronize_entropy(
        "123456".to_owned(),
        EntropySyncSource::DiceColdcard,
        12,
        false,
        String::new(),
    )
    .unwrap();

    assert_eq!(snapshot.bit_count, 128);
    assert_eq!(snapshot.effective_entropy_bits, 15);
    assert!(!snapshot.entropy_strength_unknown);
    assert!(snapshot.entropy_below_minimum);
    assert!(!snapshot.seed_words.is_empty());
    assert!(!snapshot.d8_d16_dice.is_empty());
}

#[test]
fn entropy_sync_marks_brain_wallet_strength_as_unknown() {
    let snapshot = synchronize_entropy(
        "brain wallet text".to_owned(),
        EntropySyncSource::PrivateKeyBrainWallet,
        12,
        false,
        String::new(),
    )
    .unwrap();

    assert_eq!(snapshot.bit_count, 128);
    assert_eq!(snapshot.effective_entropy_bits, 128);
    assert!(snapshot.entropy_strength_unknown);
    assert!(!snapshot.entropy_below_minimum);
}

#[test]
fn entropy_sync_trims_brain_wallet_boundary_whitespace_when_requested() {
    let exact = synchronize_entropy(
        " recovery phrase ".to_owned(),
        EntropySyncSource::PrivateKeyBrainWallet,
        24,
        false,
        String::new(),
    )
    .unwrap();
    let trimmed = synchronize_entropy(
        " recovery phrase ".to_owned(),
        EntropySyncSource::PrivateKeyBrainWalletTrimmed,
        24,
        false,
        String::new(),
    )
    .unwrap();
    let expected = private_key_entropy(
        "recovery phrase".to_owned(),
        PrivateKeyFormat::BrainWallet,
        false,
    )
    .unwrap()
    .iter()
    .map(|byte| format!("{byte:02X}"))
    .collect::<String>();

    assert_ne!(exact.hex, trimmed.hex);
    assert_eq!(trimmed.hex, expected);
    assert!(trimmed.entropy_strength_unknown);
}

#[test]
fn entropy_sync_emits_a_mainnet_wif_for_a_valid_256_bit_private_key() {
    let key_one = format!("{}1", "0".repeat(63));
    let snapshot = synchronize_entropy(
        key_one.clone(),
        EntropySyncSource::PrivateKeyHex,
        24,
        false,
        String::new(),
    )
    .unwrap();

    assert_eq!(snapshot.hex_private_key, key_one);
    assert_eq!(
        snapshot.wif_private_key,
        "KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn"
    );
    assert_eq!(
        private_key_entropy(snapshot.wif_private_key, PrivateKeyFormat::Wif, false).unwrap(),
        {
            let mut entropy = vec![0u8; 31];
            entropy.push(1);
            entropy
        }
    );
}
