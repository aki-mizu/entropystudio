use super::*;

#[test]
fn direct_card_state_matches_entropylab_rank_draws_for_all_seed_lengths() {
    for (target_words, draw_count, entropy_bytes, candidate_count) in [
        (12_u8, 47_usize, 16_usize, 128_usize),
        (15_u8, 58_usize, 20_usize, 64_usize),
        (18_u8, 70_usize, 24_usize, 32_usize),
        (21_u8, 82_usize, 28_usize, 16_usize),
        (24_u8, 93_usize, 32_usize, 8_usize),
    ] {
        let state = direct_card_state("A".repeat(draw_count), target_words).unwrap();
        assert_eq!(
            state.words,
            vec!["abandon".to_owned(); usize::from(target_words - 1)]
        );
        assert_eq!(state.candidates.len(), candidate_count);
        assert!(state.complete);
        assert_eq!(state.step, DirectCardStep::Complete);
        assert_eq!(state.final_word, state.candidates[0]);

        let phrase = format!("{} {}", state.words.join(" "), state.final_word);
        assert_eq!(mnemonic_to_entropy(phrase).unwrap(), vec![0; entropy_bytes]);
    }
}

#[test]
fn direct_card_state_tracks_input_validation_invalid_and_extra_rank_draws() {
    assert_eq!(
        normalize_direct_card_transcript("A 2,3;4".to_owned()),
        "A234"
    );
    assert!(card_key_allowed("4".to_owned(), CardInputMethod::Direct, 4));
    assert!(!card_key_allowed(
        "5".to_owned(),
        CardInputMethod::Direct,
        4
    ));

    let invalid = direct_card_state("AAA5".to_owned(), 24).unwrap();
    assert_eq!(invalid.invalid_count, 1);
    assert_eq!(invalid.active_max, 8);
    assert_eq!(invalid.step, DirectCardStep::Word);
    assert_eq!(invalid.entered_draws, 4);
    assert_eq!(invalid.final_draws, 1);
    assert_eq!(invalid.required_draws, 93);
    assert!((invalid.progress - 4.0 / 93.0).abs() < f64::EPSILON);

    let extra = direct_card_state("A".repeat(94), 24).unwrap();
    assert_eq!(extra.extra_count, 1);
    assert_eq!(extra.step, DirectCardStep::Correction);
    assert!(!extra.complete);
}
