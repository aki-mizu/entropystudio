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
