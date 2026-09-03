use super::*;

#[test]
fn seed_phrase_state_owns_words_checksum_candidates_and_number_indexes() {
    let prefix = std::iter::repeat_n("abandon", 11)
        .collect::<Vec<_>>()
        .join(" ");
    let valid_phrase = format!("{prefix} about");

    let candidates = seed_phrase_state(
        format!("{prefix} "),
        SeedPhraseInputMethod::Words,
        12,
        false,
    )
    .unwrap();
    assert_eq!(candidates.normalized_input, format!("{prefix} "));
    assert_eq!(candidates.words, vec!["abandon".to_owned(); 11]);
    assert_eq!(candidates.final_candidates.len(), 128);
    assert!(candidates.final_candidates.contains(&"about".to_owned()));
    assert!(matches!(candidates.status, SeedPhraseStatus::ChooseFinal));
    assert!(!candidates.can_derive);

    let valid = seed_phrase_state(
        valid_phrase.clone(),
        SeedPhraseInputMethod::Words,
        12,
        false,
    )
    .unwrap();
    assert_eq!(valid.phrase, valid_phrase);
    assert!(valid.can_derive);
    assert!(matches!(valid.status, SeedPhraseStatus::Ready));

    let final_prefix = seed_phrase_state(
        format!("{prefix} abo"),
        SeedPhraseInputMethod::Words,
        12,
        false,
    )
    .unwrap();
    assert!(final_prefix.matching_final_candidates > 0);
    assert!(matches!(final_prefix.status, SeedPhraseStatus::FinalPrefix));

    let invalid_word = seed_phrase_state(
        "abandon zzzz".to_owned(),
        SeedPhraseInputMethod::Words,
        12,
        false,
    )
    .unwrap();
    assert_eq!(invalid_word.invalid_position, 2);
    assert_eq!(invalid_word.invalid_token, "zzzz");
    assert!(matches!(invalid_word.status, SeedPhraseStatus::InvalidWord));

    let numbers = format!(
        "{} 4",
        std::iter::repeat_n("1", 11).collect::<Vec<_>>().join(" ")
    );
    let one_indexed =
        seed_phrase_state(numbers, SeedPhraseInputMethod::Numbers, 12, false).unwrap();
    assert_eq!(one_indexed.phrase, valid_phrase);
    assert!(one_indexed.can_derive);
    assert_eq!(one_indexed.minimum_number, 1);
    assert_eq!(one_indexed.maximum_number, 2048);

    let zero_indexed = seed_phrase_state(
        format!(
            "{} 3",
            std::iter::repeat_n("0", 11).collect::<Vec<_>>().join(" ")
        ),
        SeedPhraseInputMethod::Numbers,
        12,
        true,
    )
    .unwrap();
    assert_eq!(zero_indexed.phrase, valid_phrase);
    assert!(zero_indexed.can_derive);
    assert_eq!(zero_indexed.minimum_number, 0);
    assert_eq!(zero_indexed.maximum_number, 2047);

    let invalid_number =
        seed_phrase_state("01".to_owned(), SeedPhraseInputMethod::Numbers, 12, false).unwrap();
    assert_eq!(invalid_number.invalid_position, 1);
    assert_eq!(invalid_number.invalid_token, "01");
    assert!(matches!(
        invalid_number.status,
        SeedPhraseStatus::InvalidNumber
    ));
    assert_eq!(
        seed_phrase_words_to_numbers("abandon about".to_owned(), false),
        "1 4"
    );
    assert_eq!(
        seed_phrase_numbers_to_words("1 4".to_owned(), 12, false).unwrap(),
        "abandon about"
    );
    assert_eq!(
        translate_seed_number_indices("1 4".to_owned(), false, true),
        "0 3"
    );
    assert_eq!(
        translate_seed_number_indices("0 3".to_owned(), true, false),
        "1 4"
    );
    assert!(seed_phrase_key_allowed(
        "aba".to_owned(),
        3,
        3,
        "n".to_owned(),
        SeedPhraseInputMethod::Words,
        12,
        false,
    )
    .unwrap());
    assert!(!seed_phrase_key_allowed(
        "aba".to_owned(),
        3,
        3,
        "z".to_owned(),
        SeedPhraseInputMethod::Words,
        12,
        false,
    )
    .unwrap());
    assert!(seed_phrase_space_allowed(
        "abandon".to_owned(),
        7,
        7,
        SeedPhraseInputMethod::Words,
        12,
        false,
    )
    .unwrap());
    assert!(!seed_phrase_space_allowed(
        "abando".to_owned(),
        6,
        6,
        SeedPhraseInputMethod::Words,
        12,
        false,
    )
    .unwrap());
    let completed = seed_phrase_autocomplete("aban".to_owned(), 4, 12, true).unwrap();
    assert_eq!(completed.value, "abandon ");
    assert_eq!(completed.cursor, 8);
    let final_completed =
        seed_phrase_autocomplete(format!("{prefix} abo"), (prefix.len() + 4) as u32, 12, true)
            .unwrap();
    assert_eq!(final_completed.value, format!("{prefix} about "));
    assert!(seed_phrase_key_allowed(
        String::new(),
        0,
        0,
        "1".to_owned(),
        SeedPhraseInputMethod::Numbers,
        12,
        false,
    )
    .unwrap());
    assert!(!seed_phrase_key_allowed(
        String::new(),
        0,
        0,
        "0".to_owned(),
        SeedPhraseInputMethod::Numbers,
        12,
        false,
    )
    .unwrap());
    assert!(matches!(
        seed_phrase_state(String::new(), SeedPhraseInputMethod::Words, 13, false,),
        Err(EntropyStudioError::UnsupportedDiceWordCount)
    ));
}
