use super::*;

#[test]
fn card_transcripts_match_entropylab_ascii_and_coleman_hashes() {
    let mut ascii_digest = sha256(b"As 2c Td".to_vec());
    let ascii_expected = ascii_digest[..16].to_vec();
    wipe_bytes(&mut ascii_digest);
    assert_eq!(
        card_transcript_to_entropy("as, 2C; 10\u{2666}".to_owned(), CardHashMethod::Ascii, 12,)
            .unwrap(),
        ascii_expected
    );

    let mut coleman_digest = sha256("A\u{2660} 2\u{2663} T\u{2666}".as_bytes().to_vec());
    let coleman_expected = coleman_digest[..16].to_vec();
    wipe_bytes(&mut coleman_digest);
    assert_eq!(
        card_transcript_to_entropy("AS 2C TD".to_owned(), CardHashMethod::Coleman, 12,).unwrap(),
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
fn hashed_card_state_owns_card_availability_and_progress() {
    let state = hashed_card_state("as 2C AS invalid".to_owned(), 12).unwrap();
    assert_eq!(state.card_count, 3);
    assert_eq!(state.first_shuffle_cards, 25);
    assert_eq!(state.required_cards, 25);
    assert!(state.has_input);
    assert!(state.can_derive);
    assert_eq!(state.first_duplicate_card, "AS");
    assert_eq!(state.invalid_tokens, vec!["invalid".to_owned()]);
    assert!(!state.available_cards.contains(&"AS".to_owned()));
    assert!(state.available_cards.contains(&"KD".to_owned()));
    assert_eq!(state.instruction, HashedCardInstruction::FirstShuffle);
    assert!((state.progress - 0.12).abs() < f64::EPSILON);
    assert!(state.entropy_bits > 16.0);

    assert_eq!(normalize_card_token("10\u{2665}".to_owned()), "TH");
    assert!(card_key_allowed("1".to_owned(), CardInputMethod::Hashed, 0));
    assert!(card_key_allowed("4".to_owned(), CardInputMethod::Hashed, 0));
    assert!(!card_key_allowed(
        "B".to_owned(),
        CardInputMethod::Hashed,
        0
    ));
}
