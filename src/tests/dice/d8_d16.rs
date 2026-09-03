use super::*;

#[test]
fn d8_d16_direct_dice_matches_upstream_canonical_and_phase_vectors() {
    let first = direct_dice_state("100".to_owned(), DirectDiceMethod::D8D16, 24).unwrap();
    assert_eq!(first.words, expected_words(&["abandon"]));
    assert_eq!(first.step, DirectDiceStep::D8D16WordD8);
    assert_eq!(first.active_word, 2);
    assert_eq!(first.active_roll, 1);

    let last = direct_dice_state("8FF".to_owned(), DirectDiceMethod::D8D16, 24).unwrap();
    assert_eq!(last.words, expected_words(&["zoo"]));
    assert_eq!(last.step, DirectDiceStep::D8D16WordD8);
    assert_eq!(last.active_word, 2);
    assert_eq!(last.active_roll, 1);

    let full_12_word_transcript = "10E".repeat(11);
    let phase_vectors = vec![
        (
            full_12_word_transcript.clone(),
            DirectDiceStep::D8D16ChecksumD8,
            11_u8,
            11_u8,
            1_u8,
            0_u32,
            128_usize,
        ),
        (
            format!("{full_12_word_transcript}4"),
            DirectDiceStep::D8D16ChecksumD16,
            11_u8,
            11_u8,
            2_u8,
            0_u32,
            128_usize,
        ),
        (
            "10E".repeat(2),
            DirectDiceStep::D8D16WordD8,
            2_u8,
            3_u8,
            1_u8,
            0_u32,
            0_usize,
        ),
        (
            format!("{}1", "10E".repeat(2)),
            DirectDiceStep::D8D16WordD16First,
            2_u8,
            3_u8,
            2_u8,
            0_u32,
            0_usize,
        ),
        (
            format!("{}1A", "10E".repeat(2)),
            DirectDiceStep::D8D16WordD16Second,
            2_u8,
            3_u8,
            3_u8,
            0_u32,
            0_usize,
        ),
        (
            format!("{full_12_word_transcript}G"),
            DirectDiceStep::D8D16Correction,
            11_u8,
            11_u8,
            0_u8,
            1_u32,
            128_usize,
        ),
    ];

    for (
        transcript,
        expected_step,
        expected_groups,
        expected_active_word,
        expected_active_roll,
        expected_invalid_count,
        expected_candidate_count,
    ) in phase_vectors
    {
        let state = direct_dice_state(transcript.clone(), DirectDiceMethod::D8D16, 12).unwrap();

        assert_eq!(
            state.words,
            vec!["achieve".to_owned(); usize::from(expected_groups)],
            "{transcript}",
        );
        assert_eq!(
            state.candidates.len(),
            expected_candidate_count,
            "{transcript}"
        );
        assert_eq!(state.step, expected_step, "{transcript}");
        assert_eq!(state.completed_groups, expected_groups, "{transcript}");
        assert_eq!(state.active_word, expected_active_word, "{transcript}");
        assert_eq!(state.active_roll, expected_active_roll, "{transcript}");
        assert_eq!(state.invalid_count, expected_invalid_count, "{transcript}");
        assert!(!state.complete, "{transcript}");
    }
}

#[test]
fn d8_d16_direct_dice_matches_upstream_completion_and_candidate_indexes() {
    for (target_words, final_rolls, candidate_index, candidate_count, expected_final_word) in [
        (12_u8, "3A", 42_usize, 128_usize, "fiber"),
        (15_u8, "12", 1_usize, 64_usize, "always"),
        (18_u8, "A5", 21_usize, 32_usize, "provide"),
        (21_u8, "A", 10_usize, 16_usize, "pause"),
        (24_u8, "5", 4_usize, 8_usize, "other"),
    ] {
        let partial_words = usize::from(target_words - 1);
        let state = direct_dice_state(
            format!("{}{final_rolls}", "10E".repeat(partial_words)),
            DirectDiceMethod::D8D16,
            target_words,
        )
        .unwrap();

        assert_eq!(
            state.words,
            vec!["achieve".to_owned(); partial_words],
            "{target_words}-word",
        );
        assert_eq!(
            state.candidates.len(),
            candidate_count,
            "{target_words}-word"
        );
        assert_eq!(
            state.candidates[candidate_index], expected_final_word,
            "{target_words}-word"
        );
        assert_eq!(state.final_word, expected_final_word, "{target_words}-word");
        assert_eq!(
            state.step,
            DirectDiceStep::D8D16Complete,
            "{target_words}-word"
        );
        assert_eq!(
            state.completed_groups, partial_words as u8,
            "{target_words}-word"
        );
        assert_eq!(state.active_word, target_words - 1, "{target_words}-word");
        assert_eq!(state.active_roll, 0, "{target_words}-word");
        assert_eq!(state.invalid_count, 0, "{target_words}-word");
        assert_eq!(state.extra_count, 0, "{target_words}-word");
        assert!(state.complete, "{target_words}-word");
    }
}
