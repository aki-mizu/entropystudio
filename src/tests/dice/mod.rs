use super::*;

mod bitbox;
mod d8_d16;
mod hashed;

#[test]
fn dice_input_state_owns_protocol_configuration_and_transcript_formatting() {
    let info = dice_method_info(12).unwrap();
    assert_eq!(info.entropy_bits, 128);
    assert_eq!(info.checksum_candidates, 128);
    assert_eq!(info.recommended_rolls, 50);
    assert_eq!(info.partial_words, 11);
    assert!(matches!(
        info.final_steps.as_slice(),
        [DiceFinalStep::D8, DiceFinalStep::D16]
    ));
    assert_eq!(
        format_dice_transcript("1111111".to_owned(), DiceInputMethod::Bitbox, 24).unwrap(),
        "111111 1"
    );
    assert_eq!(
        format_dice_transcript("123456789".to_owned(), DiceInputMethod::D8D16, 24).unwrap(),
        "123 456 789"
    );

    let state = direct_dice_input_state(
        "111111".repeat(11),
        DirectDiceMethod::Bitbox,
        12,
        " About ".to_owned(),
    )
    .unwrap();
    assert_eq!(state.final_word, "about");
    assert!(state.can_derive);
    assert_eq!(state.progress, 1.0);
    assert!(state.mnemonic.ends_with(" about"));
    assert!(state.allowed_faces.is_empty());
}
