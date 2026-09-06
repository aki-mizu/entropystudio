use super::*;

#[test]
fn direct_dice_calculation_rows_are_owned_by_rust() {
    let bitbox =
        direct_dice_calculations("432144".to_owned(), DirectDiceMethod::Bitbox, 12).unwrap();
    assert_eq!(bitbox.len(), 1);
    assert_eq!(bitbox[0].number, 1);
    assert_eq!(bitbox[0].index, 1831);
    assert_eq!(
        bitbox[0]
            .terms
            .iter()
            .map(|term| term.face.as_str())
            .collect::<Vec<_>>(),
        vec!["4", "3", "2", "1", "4", "4"],
    );
    assert_eq!(
        bitbox[0]
            .terms
            .iter()
            .map(|term| term.contribution)
            .collect::<Vec<_>>(),
        vec![1536, 256, 32, 0, 6, 1],
    );
    assert_eq!(
        bitbox[0].terms[5].kind,
        DirectDiceCalculationTermKind::BitboxCoin,
    );

    let d8_d16 = direct_dice_calculations("8FF".to_owned(), DirectDiceMethod::D8D16, 12).unwrap();
    assert_eq!(d8_d16.len(), 1);
    assert_eq!(d8_d16[0].word, "zoo");
    assert_eq!(d8_d16[0].index, 2047);
    assert_eq!(
        d8_d16[0]
            .terms
            .iter()
            .map(|term| term.contribution)
            .collect::<Vec<_>>(),
        vec![1792, 240, 15],
    );
    assert_eq!(d8_d16[0].terms[0].kind, DirectDiceCalculationTermKind::D8);
    assert_eq!(d8_d16[0].terms[1].kind, DirectDiceCalculationTermKind::D16);

    assert!(
        direct_dice_calculations("11".to_owned(), DirectDiceMethod::Bitbox, 12)
            .unwrap()
            .is_empty()
    );
}
