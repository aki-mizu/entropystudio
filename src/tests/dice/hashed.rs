use super::*;

#[test]
fn dice_rolls_skip_separators_and_apply_method_specific_mapping() {
    let mut coldcard_digest = sha256(b"123456".to_vec());
    let coldcard_expected = coldcard_digest[..16].to_vec();
    wipe_bytes(&mut coldcard_digest);
    assert_eq!(
        dice_rolls_to_entropy("1 2,3;4|5\n6".to_owned(), DiceRollMethod::Coldcard, 12,).unwrap(),
        coldcard_expected
    );

    let mut coleman_digest = sha256(b"123450".to_vec());
    let coleman_expected = coleman_digest[..16].to_vec();
    wipe_bytes(&mut coleman_digest);
    assert_eq!(
        dice_rolls_to_entropy("123456".to_owned(), DiceRollMethod::Coleman, 12).unwrap(),
        coleman_expected
    );
}

#[test]
fn dice_rolls_support_each_bip39_entropy_size() {
    for (words, expected_bytes) in [(12, 16), (15, 20), (18, 24), (21, 28), (24, 32)] {
        assert_eq!(
            dice_rolls_to_entropy("1".repeat(99), DiceRollMethod::Coldcard, words)
                .unwrap()
                .len(),
            expected_bytes
        );
    }
}

#[test]
fn hashed_dice_state_owns_roll_counts_and_progress() {
    let state = hashed_dice_state("1 x 2, 3".to_owned(), 12).unwrap();
    assert_eq!(
        state.allowed_faces,
        expected_words(&["1", "2", "3", "4", "5", "6"])
    );
    assert_eq!(state.roll_count, 3);
    assert_eq!(state.recommended_rolls, 50);
    assert_eq!(state.invalid_faces, "x");
    assert!(state.has_rolls);
    assert!(state.can_derive);
    assert!((state.progress - 0.06).abs() < f64::EPSILON);
    assert!((state.estimated_entropy_bits - 3.0 * 6_f64.log2()).abs() < f64::EPSILON);
}

#[test]
fn hashed_dice_recommendations_match_the_supported_entropy_sizes() {
    for (target_words, recommended_rolls) in [(12, 50), (15, 62), (18, 75), (21, 87), (24, 99)] {
        let state = hashed_dice_state(String::new(), target_words).unwrap();
        assert_eq!(state.recommended_rolls, recommended_rolls);
        assert_eq!(state.roll_count, 0);
        assert!(!state.can_derive);
    }
}

#[test]
fn dice_rolls_return_typed_validation_errors() {
    assert!(matches!(
        dice_rolls_to_entropy("123x".to_owned(), DiceRollMethod::Coldcard, 24),
        Err(EntropyStudioError::InvalidDiceRolls)
    ));
    assert!(matches!(
        dice_rolls_to_entropy(" ,;|\n".to_owned(), DiceRollMethod::Coldcard, 24),
        Err(EntropyStudioError::NoDiceRolls)
    ));
    assert!(matches!(
        dice_rolls_to_entropy("123456".to_owned(), DiceRollMethod::Coldcard, 13),
        Err(EntropyStudioError::UnsupportedDiceWordCount)
    ));
}
