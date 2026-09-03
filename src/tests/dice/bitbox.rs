use super::*;

fn bitbox_lookup_transcript(row: [u8; 4]) -> String {
    let mut transcript = String::with_capacity(48);
    for column in 0..8 {
        for face in row {
            transcript.push(char::from(b'0' + face));
        }
        transcript.push(char::from(b'1' + (column / 2) as u8));
        transcript.push(if column % 2 == 0 { '3' } else { '4' });
    }
    transcript
}

#[test]
fn bitbox_direct_dice_matches_upstream_lookup_rows() {
    let cases: [([u8; 4], [&str; 8]); 6] = [
        (
            [1, 1, 1, 1],
            [
                "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
            ],
        ),
        (
            [1, 4, 4, 3],
            [
                "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree",
                "discover",
            ],
        ),
        (
            [2, 4, 4, 2],
            [
                "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law",
            ],
        ),
        (
            [3, 4, 4, 1],
            [
                "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude",
            ],
        ),
        (
            [4, 4, 3, 3],
            [
                "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife",
            ],
        ),
        (
            [4, 4, 4, 4],
            [
                "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo",
            ],
        ),
    ];

    for (row, expected) in cases {
        let state =
            direct_dice_state(bitbox_lookup_transcript(row), DirectDiceMethod::Bitbox, 24).unwrap();

        assert_eq!(state.words, expected_words(&expected), "row {row:?}");
        assert_eq!(state.candidates, Vec::<String>::new(), "row {row:?}");
        assert_eq!(state.step, DirectDiceStep::BitboxDie, "row {row:?}");
        assert_eq!(state.completed_groups, 8, "row {row:?}");
        assert_eq!(state.active_word, 9, "row {row:?}");
        assert_eq!(state.active_roll, 1, "row {row:?}");
        assert_eq!(state.invalid_count, 0, "row {row:?}");
        assert_eq!(state.extra_count, 0, "row {row:?}");
        assert_eq!(state.skipped_count, 0, "row {row:?}");
    }
}

#[test]
fn bitbox_direct_dice_matches_upstream_checksum_vectors() {
    let state = direct_dice_state("111111".repeat(23), DirectDiceMethod::Bitbox, 24).unwrap();
    assert_eq!(state.words, vec!["abandon".to_owned(); 23]);
    assert_eq!(
        state.candidates,
        expected_words(&[
            "art", "diesel", "false", "kite", "organ", "ready", "surface", "trouble",
        ]),
    );
    assert_eq!(state.step, DirectDiceStep::BitboxFinalWord);
    assert_eq!(state.completed_groups, 23);
    assert_eq!(state.active_word, 23);
    assert_eq!(state.active_roll, 0);

    for (target_words, candidate_count) in [
        (12_u8, 128_usize),
        (15_u8, 64_usize),
        (18_u8, 32_usize),
        (21_u8, 16_usize),
        (24_u8, 8_usize),
    ] {
        let partial_words = usize::from(target_words - 1);
        let state = direct_dice_state(
            "5123413".repeat(partial_words),
            DirectDiceMethod::Bitbox,
            target_words,
        )
        .unwrap();

        assert_eq!(state.words.len(), partial_words, "{target_words}-word");
        assert_eq!(
            state.candidates.len(),
            candidate_count,
            "{target_words}-word"
        );
        assert_eq!(
            state.step,
            DirectDiceStep::BitboxFinalWord,
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
        assert_eq!(
            state.skipped_count, partial_words as u32,
            "{target_words}-word"
        );
    }

    let extra_roll_state = direct_dice_state(
        format!("{}1", "111111".repeat(23)),
        DirectDiceMethod::Bitbox,
        24,
    )
    .unwrap();
    assert_eq!(extra_roll_state.extra_count, 1);
    assert_eq!(extra_roll_state.invalid_count, 0);
    assert_eq!(extra_roll_state.step, DirectDiceStep::BitboxFinalWord);
}
