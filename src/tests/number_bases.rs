use super::*;

#[test]
fn number_base_input_analysis_and_entropy_are_owned_by_rust() {
    let aliases = analyze_number_base_input(
        format!("{}000", "O".repeat(25)),
        NumberBaseFormat::Base32,
        12,
    )
    .unwrap();
    assert_eq!(aliases.digits, 28);
    assert_eq!(aliases.full_digits, 25);
    assert_eq!(aliases.final_characters, "01");
    assert_eq!(aliases.remainder_bits, 3);
    assert_eq!(aliases.digit_count, 28);
    assert!(aliases.is_ready);
    assert_eq!(aliases.preview_words, vec!["abandon".to_owned(); 11]);
    assert_eq!(
        number_base_entropy(
            format!("{}000", "O".repeat(25)),
            NumberBaseFormat::Base32,
            12,
        )
        .unwrap(),
        vec![0; 16]
    );

    let invalid_final =
        analyze_number_base_input(format!("{}4", "0".repeat(42)), NumberBaseFormat::Base8, 12)
            .unwrap();
    assert!(invalid_final.final_invalid);
    assert!(!invalid_final.is_ready);
    assert!(matches!(
        number_base_entropy(format!("{}4", "0".repeat(42)), NumberBaseFormat::Base8, 12,),
        Err(EntropyStudioError::InvalidNumberBaseInput)
    ));
}

#[test]
fn number_base_formats_and_zero_entropy_vectors_are_native_owned() {
    for (format, input, digits, full_digits, remainder_bits, final_characters) in [
        (NumberBaseFormat::Bin, "0".repeat(128), 128, 128, 0, "01"),
        (NumberBaseFormat::Base4, "0".repeat(64), 64, 64, 0, "0123"),
        (NumberBaseFormat::Base8, "0".repeat(43), 43, 42, 2, "0123"),
        (
            NumberBaseFormat::Hex,
            "0".repeat(32),
            32,
            32,
            0,
            "0123456789ABCDEF",
        ),
        (NumberBaseFormat::Base32, "0".repeat(28), 28, 25, 3, "01"),
        (
            NumberBaseFormat::Base64,
            format!("{}00", "A".repeat(21)),
            23,
            21,
            2,
            "01",
        ),
    ] {
        let analysis = analyze_number_base_input(input.clone(), format, 12).unwrap();
        assert_eq!(analysis.digits, digits, "{format:?}");
        assert_eq!(analysis.full_digits, full_digits, "{format:?}");
        assert_eq!(analysis.remainder_bits, remainder_bits, "{format:?}");
        assert_eq!(analysis.final_characters, final_characters, "{format:?}");
        assert!(analysis.is_ready, "{format:?}");
        assert_eq!(number_base_entropy(input, format, 12).unwrap(), vec![0; 16]);
    }
}

#[test]
fn number_base_calculation_rows_are_owned_by_rust() {
    let partial = number_base_calculations(
        "10000000000".to_owned(),
        NumberBaseFormat::Bin,
        12,
    )
    .unwrap();
    assert_eq!(partial.rows.len(), 1);
    assert_eq!(partial.rows[0].number, 1);
    assert_eq!(partial.rows[0].index, 1024);
    assert_eq!(partial.rows[0].terms.len(), 11);
    assert_eq!(partial.rows[0].terms[0].bit_weight, 1024);
    assert_eq!(partial.rows[0].terms[0].bit, 1);
    assert_eq!(partial.rows[0].terms[0].contribution, 1024);
    assert_eq!(partial.rows[0].terms[1].contribution, 0);

    let complete = number_base_calculations("0".repeat(128), NumberBaseFormat::Bin, 12)
        .unwrap();
    assert_eq!(complete.rows.len(), 12);
    assert_eq!(complete.rows[0].word, "abandon");
    assert_eq!(complete.rows[0].index, 0);
    assert_eq!(complete.rows[11].word, "about");
    assert_eq!(complete.rows[11].index, 3);

    let base4 = number_base_calculations(String::new(), NumberBaseFormat::Base4, 12).unwrap();
    assert_eq!(base4.digit_values[3].digit, "3");
    assert_eq!(base4.digit_values[3].bits, "11");

    assert!(number_base_calculations("X0".to_owned(), NumberBaseFormat::Bin, 12)
        .unwrap()
        .rows
        .is_empty());
}
