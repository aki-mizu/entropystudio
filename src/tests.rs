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

fn expected_words(words: &[&str]) -> Vec<String> {
    words.iter().map(|word| (*word).to_owned()).collect()
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
fn card_transcripts_match_entropylab_ascii_and_coleman_hashes() {
    let mut ascii_digest = sha256(b"As 2c Td".to_vec());
    let ascii_expected = ascii_digest[..16].to_vec();
    wipe_bytes(&mut ascii_digest);
    assert_eq!(
        card_transcript_to_entropy(
            "as, 2C; 10\u{2666}".to_owned(),
            CardHashMethod::Ascii,
            12,
        )
        .unwrap(),
        ascii_expected
    );

    let mut coleman_digest = sha256("A\u{2660} 2\u{2663} T\u{2666}".as_bytes().to_vec());
    let coleman_expected = coleman_digest[..16].to_vec();
    wipe_bytes(&mut coleman_digest);
    assert_eq!(
        card_transcript_to_entropy(
            "AS 2C TD".to_owned(),
            CardHashMethod::Coleman,
            12,
        )
        .unwrap(),
        coleman_expected
    );
}

#[test]
fn card_transcripts_support_all_bip39_entropy_sizes() {
    for (words, expected_bytes) in [(12, 16), (15, 20), (18, 24), (21, 28), (24, 32)] {
        assert_eq!(
            card_transcript_to_entropy("AS".to_owned(), CardHashMethod::Ascii, words)
                .unwrap()
                .len(),
            expected_bytes
        );
    }
}

#[test]
fn card_transcripts_reject_invalid_empty_and_duplicate_deals() {
    assert!(matches!(
        card_transcript_to_entropy("AS ZZ".to_owned(), CardHashMethod::Ascii, 24),
        Err(EntropyStudioError::InvalidCardTranscript)
    ));
    assert!(matches!(
        card_transcript_to_entropy(" ,;|".to_owned(), CardHashMethod::Ascii, 24),
        Err(EntropyStudioError::NoCards)
    ));
    assert!(matches!(
        card_transcript_to_entropy("AS AS".to_owned(), CardHashMethod::Ascii, 24),
        Err(EntropyStudioError::DuplicateCard)
    ));
}

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
        assert_eq!(state.words, vec!["abandon".to_owned(); usize::from(target_words - 1)]);
        assert_eq!(state.candidates.len(), candidate_count);
        assert!(state.complete);
        assert_eq!(state.step, DirectCardStep::Complete);
        assert_eq!(state.final_word, state.candidates[0]);

        let phrase = format!("{} {}", state.words.join(" "), state.final_word);
        assert_eq!(mnemonic_to_entropy(phrase).unwrap(), vec![0; entropy_bytes]);
    }
}

#[test]
fn direct_card_state_tracks_invalid_and_extra_rank_draws() {
    let invalid = direct_card_state("AAA5".to_owned(), 24).unwrap();
    assert_eq!(invalid.invalid_count, 1);
    assert_eq!(invalid.active_max, 8);
    assert_eq!(invalid.step, DirectCardStep::Word);

    let extra = direct_card_state("A".repeat(94), 24).unwrap();
    assert_eq!(extra.extra_count, 1);
    assert_eq!(extra.step, DirectCardStep::Correction);
    assert!(!extra.complete);
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
            "{target_words}-word",
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
