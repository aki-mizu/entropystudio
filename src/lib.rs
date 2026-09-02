use std::error::Error;
use std::fmt;

uniffi::setup_scaffolding!();

#[derive(Debug, uniffi::Error)]
pub enum EntropyStudioError {
    InvalidMnemonic,
    InvalidEntropy,
    InvalidDiceRolls,
    NoDiceRolls,
    UnsupportedDiceWordCount,
}

impl fmt::Display for EntropyStudioError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{self:?}")
    }
}

impl Error for EntropyStudioError {}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum DiceRollMethod {
    Coldcard,
    Coleman,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum DirectDiceMethod {
    Bitbox,
    D8D16,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum DirectDiceStep {
    BitboxDie,
    BitboxCoin,
    BitboxFinalWord,
    D8D16WordD8,
    D8D16WordD16First,
    D8D16WordD16Second,
    D8D16ChecksumD8,
    D8D16ChecksumD16,
    D8D16ChecksumCoin,
    D8D16Correction,
    D8D16Complete,
}

#[derive(Debug, uniffi::Record)]
pub struct DirectDiceState {
    pub words: Vec<String>,
    pub candidates: Vec<String>,
    pub final_word: String,
    pub step: DirectDiceStep,
    pub complete: bool,
    pub invalid_count: u32,
    pub extra_count: u32,
    pub skipped_count: u32,
    pub partial_words: u8,
    pub completed_groups: u8,
    pub active_word: u8,
    pub active_roll: u8,
}

#[uniffi::export]
pub fn sha256(mut input: Vec<u8>) -> Vec<u8> {
    let mut digest = [0u8; 32];
    unsafe {
        entropylab_wasm::el_sha256(input.as_ptr(), input.len(), digest.as_mut_ptr());
    }
    wipe_bytes(&mut input);
    let result = digest.to_vec();
    wipe_bytes(&mut digest);
    result
}

#[uniffi::export]
pub fn mnemonic_to_entropy(mut normalized_phrase: String) -> Result<Vec<u8>, EntropyStudioError> {
    let mut entropy = [0u8; 32];
    let length = unsafe {
        entropylab_wasm::el_bip39_mnemonic_to_entropy(
            normalized_phrase.as_ptr(),
            normalized_phrase.len(),
            entropy.as_mut_ptr(),
            entropy.len(),
        )
    };
    wipe_string(&mut normalized_phrase);

    if length < 0 {
        wipe_bytes(&mut entropy);
        return Err(EntropyStudioError::InvalidMnemonic);
    }

    let result = entropy[..length as usize].to_vec();
    wipe_bytes(&mut entropy);
    Ok(result)
}

#[uniffi::export]
pub fn entropy_to_mnemonic(mut entropy: Vec<u8>) -> Result<String, EntropyStudioError> {
    let mut phrase = [0u8; 256];
    let length = unsafe {
        entropylab_wasm::el_bip39_entropy_to_mnemonic(
            entropy.as_ptr(),
            entropy.len(),
            phrase.as_mut_ptr(),
            phrase.len(),
        )
    };
    wipe_bytes(&mut entropy);

    if length < 0 {
        wipe_bytes(&mut phrase);
        return Err(EntropyStudioError::InvalidEntropy);
    }

    let result = std::str::from_utf8(&phrase[..length as usize])
        .map(str::to_owned)
        .map_err(|_| EntropyStudioError::InvalidEntropy);
    wipe_bytes(&mut phrase);
    result
}

#[uniffi::export]
pub fn dice_rolls_to_entropy(
    mut rolls: String,
    method: DiceRollMethod,
    target_words: u8,
) -> Result<Vec<u8>, EntropyStudioError> {
    let entropy_length = dice_entropy_length(target_words)?;
    let mut hash_input = Vec::with_capacity(rolls.len());

    for face in rolls.chars() {
        match face {
            '1'..='6' => hash_input.push(match method {
                DiceRollMethod::Coldcard => face as u8,
                DiceRollMethod::Coleman if face == '6' => b'0',
                DiceRollMethod::Coleman => face as u8,
            }),
            separator if is_dice_separator(separator) => {}
            _ => {
                wipe_string(&mut rolls);
                wipe_bytes(&mut hash_input);
                return Err(EntropyStudioError::InvalidDiceRolls);
            }
        }
    }
    wipe_string(&mut rolls);

    if hash_input.is_empty() {
        wipe_bytes(&mut hash_input);
        return Err(EntropyStudioError::NoDiceRolls);
    }

    let mut digest = sha256(hash_input);
    let result = digest[..entropy_length].to_vec();
    wipe_bytes(&mut digest);
    Ok(result)
}

#[uniffi::export]
pub fn direct_dice_state(
    mut rolls: String,
    method: DirectDiceMethod,
    target_words: u8,
) -> Result<DirectDiceState, EntropyStudioError> {
    let result = match method {
        DirectDiceMethod::Bitbox => bitbox_dice_state(&rolls, target_words),
        DirectDiceMethod::D8D16 => d8_d16_dice_state(&rolls, target_words),
    };
    wipe_string(&mut rolls);
    result
}

#[derive(Clone, Copy)]
enum D8D16FinalStep {
    D8,
    D16,
    Coin,
}

const D8_D16_FINAL_STEPS_12: &[D8D16FinalStep] = &[D8D16FinalStep::D8, D8D16FinalStep::D16];
const D8_D16_FINAL_STEPS_15: &[D8D16FinalStep] = &[D8D16FinalStep::D8, D8D16FinalStep::D8];
const D8_D16_FINAL_STEPS_18: &[D8D16FinalStep] = &[D8D16FinalStep::D16, D8D16FinalStep::Coin];
const D8_D16_FINAL_STEPS_21: &[D8D16FinalStep] = &[D8D16FinalStep::D16];
const D8_D16_FINAL_STEPS_24: &[D8D16FinalStep] = &[D8D16FinalStep::D8];

fn bitbox_dice_state(rolls: &str, target_words: u8) -> Result<DirectDiceState, EntropyStudioError> {
    let partial_words = direct_dice_partial_words(target_words)?;
    let mut words = Vec::with_capacity(usize::from(partial_words));
    let mut dice_faces = Vec::with_capacity(5);
    let mut invalid_count = 0;
    let mut extra_count = 0;
    let mut skipped_count = 0;

    for character in rolls.chars() {
        if is_dice_separator(character) {
            continue;
        }

        let face = match character {
            '1'..='6' => character as u8 - b'0',
            _ => {
                invalid_count += 1;
                continue;
            }
        };
        if words.len() >= usize::from(partial_words) {
            extra_count += 1;
            continue;
        }
        if dice_faces.len() < 5 {
            if face >= 5 {
                skipped_count += 1;
            } else {
                dice_faces.push(face);
            }
            continue;
        }

        let word_index = dice_faces
            .iter()
            .fold(0usize, |index, die| index * 4 + usize::from(*die - 1))
            * 2
            + usize::from(face >= 4);
        words.push(bip39_word(word_index)?);
        wipe_bytes(&mut dice_faces);
        dice_faces.clear();
    }

    let (step, active_roll) = if words.len() >= usize::from(partial_words) {
        (DirectDiceStep::BitboxFinalWord, 0)
    } else if dice_faces.len() == 5 {
        (DirectDiceStep::BitboxCoin, 6)
    } else {
        (DirectDiceStep::BitboxDie, dice_faces.len() as u8 + 1)
    };
    let active_word = if words.len() >= usize::from(partial_words) {
        partial_words
    } else {
        words.len() as u8 + 1
    };
    let candidates = direct_dice_candidates(&words, target_words);
    wipe_bytes(&mut dice_faces);

    Ok(DirectDiceState {
        completed_groups: words.len() as u8,
        words,
        candidates,
        final_word: String::new(),
        step,
        complete: false,
        invalid_count,
        extra_count,
        skipped_count,
        partial_words,
        active_word,
        active_roll,
    })
}

fn d8_d16_dice_state(rolls: &str, target_words: u8) -> Result<DirectDiceState, EntropyStudioError> {
    let partial_words = direct_dice_partial_words(target_words)?;
    let final_steps = d8_d16_final_steps(target_words)?;
    let entries: Vec<char> = rolls
        .chars()
        .filter(|character| !is_dice_separator(*character))
        .map(|character| character.to_ascii_uppercase())
        .collect();
    let required_word_entries = usize::from(partial_words) * 3;
    let rolled_word_entries = entries.len().min(required_word_entries);
    let mut words = Vec::with_capacity(usize::from(partial_words));
    let mut invalid_count = 0;

    for group_index in 0..usize::from(partial_words) {
        let start = group_index * 3;
        if start >= rolled_word_entries {
            break;
        }
        let end = (start + 3).min(rolled_word_entries);
        let group = &entries[start..end];
        let valid = group.iter().enumerate().all(|(position, face)| {
            if position == 0 {
                matches!(face, '1'..='8')
            } else {
                d8_d16_value(*face).is_some()
            }
        });
        invalid_count += group
            .iter()
            .enumerate()
            .filter(|(position, face)| {
                if *position == 0 {
                    !matches!(face, '1'..='8')
                } else {
                    d8_d16_value(**face).is_none()
                }
            })
            .count() as u32;

        if group.len() == 3 && valid {
            let word_index =
                d8_d16_step_value(D8D16FinalStep::D8, group[0]).expect("validated D8 face") * 256
                    + d8_d16_value(group[1]).expect("validated D16 face") * 16
                    + d8_d16_value(group[2]).expect("validated D16 face");
            words.push(bip39_word(word_index)?);
        }
    }

    let all_word_entries_complete = rolled_word_entries == required_word_entries;
    let all_word_entries_valid = all_word_entries_complete
        && invalid_count == 0
        && words.len() == usize::from(partial_words);
    let candidates = if all_word_entries_valid {
        direct_dice_candidates(&words, target_words)
    } else {
        Vec::new()
    };
    let mut final_values = Vec::with_capacity(final_steps.len());

    for (position, step) in final_steps.iter().enumerate() {
        let Some(face) = entries.get(required_word_entries + position) else {
            final_values.push(None);
            continue;
        };
        let value = d8_d16_step_value(*step, *face);
        if value.is_none() {
            invalid_count += 1;
        }
        final_values.push(value);
    }

    let expected_entries = required_word_entries + final_steps.len();
    let extra_count = entries.len().saturating_sub(expected_entries) as u32;
    let completed_groups = (rolled_word_entries / 3).min(usize::from(partial_words)) as u8;
    let active_word = if all_word_entries_complete {
        partial_words
    } else {
        (rolled_word_entries / 3) as u8 + 1
    };
    let mut final_word = String::new();
    let mut complete = false;
    let (step, active_roll) = if !all_word_entries_complete {
        match rolled_word_entries % 3 {
            0 => (DirectDiceStep::D8D16WordD8, 1),
            1 => (DirectDiceStep::D8D16WordD16First, 2),
            _ => (DirectDiceStep::D8D16WordD16Second, 3),
        }
    } else if !all_word_entries_valid || invalid_count > 0 {
        (DirectDiceStep::D8D16Correction, 0)
    } else if let Some((position, _)) = final_values
        .iter()
        .enumerate()
        .find(|(_, value)| value.is_none())
    {
        (
            d8_d16_step_to_state(final_steps[position]),
            position as u8 + 1,
        )
    } else {
        let final_index =
            final_values
                .iter()
                .zip(final_steps)
                .fold(0usize, |index, (value, step)| {
                    index * d8_d16_step_radix(*step) + value.expect("complete D8/D16 final roll")
                });
        final_word = candidates.get(final_index).cloned().unwrap_or_default();
        complete = !final_word.is_empty();
        if complete {
            (DirectDiceStep::D8D16Complete, 0)
        } else {
            (DirectDiceStep::D8D16Correction, 0)
        }
    };

    Ok(DirectDiceState {
        words,
        candidates,
        final_word,
        step,
        complete,
        invalid_count,
        extra_count,
        skipped_count: 0,
        partial_words,
        completed_groups,
        active_word,
        active_roll,
    })
}

fn direct_dice_partial_words(target_words: u8) -> Result<u8, EntropyStudioError> {
    dice_entropy_length(target_words)?;
    Ok(target_words - 1)
}

fn d8_d16_final_steps(target_words: u8) -> Result<&'static [D8D16FinalStep], EntropyStudioError> {
    match target_words {
        12 => Ok(D8_D16_FINAL_STEPS_12),
        15 => Ok(D8_D16_FINAL_STEPS_15),
        18 => Ok(D8_D16_FINAL_STEPS_18),
        21 => Ok(D8_D16_FINAL_STEPS_21),
        24 => Ok(D8_D16_FINAL_STEPS_24),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

fn d8_d16_value(face: char) -> Option<usize> {
    match face {
        '0'..='9' => Some(face as usize - '0' as usize),
        'A'..='F' => Some(face as usize - 'A' as usize + 10),
        _ => None,
    }
}

fn d8_d16_step_value(step: D8D16FinalStep, face: char) -> Option<usize> {
    match step {
        D8D16FinalStep::D8 => match face {
            '1'..='8' => Some(face as usize - '1' as usize),
            _ => None,
        },
        D8D16FinalStep::D16 => d8_d16_value(face),
        D8D16FinalStep::Coin => match face {
            '1'..='4' => Some(0),
            '5'..='8' => Some(1),
            _ => None,
        },
    }
}

fn d8_d16_step_to_state(step: D8D16FinalStep) -> DirectDiceStep {
    match step {
        D8D16FinalStep::D8 => DirectDiceStep::D8D16ChecksumD8,
        D8D16FinalStep::D16 => DirectDiceStep::D8D16ChecksumD16,
        D8D16FinalStep::Coin => DirectDiceStep::D8D16ChecksumCoin,
    }
}

fn d8_d16_step_radix(step: D8D16FinalStep) -> usize {
    match step {
        D8D16FinalStep::D8 => 8,
        D8D16FinalStep::D16 => 16,
        D8D16FinalStep::Coin => 2,
    }
}

fn bip39_word(index: usize) -> Result<String, EntropyStudioError> {
    let mut bytes = [0u8; 16];
    let length =
        unsafe { entropylab_wasm::el_bip39_word_at(index as u32, bytes.as_mut_ptr(), bytes.len()) };
    if length < 0 {
        wipe_bytes(&mut bytes);
        return Err(EntropyStudioError::InvalidEntropy);
    }
    let result = std::str::from_utf8(&bytes[..length as usize])
        .map(str::to_owned)
        .map_err(|_| EntropyStudioError::InvalidEntropy);
    wipe_bytes(&mut bytes);
    result
}

fn direct_dice_candidates(words: &[String], target_words: u8) -> Vec<String> {
    if words.len() != usize::from(target_words.saturating_sub(1)) {
        return Vec::new();
    }

    let mut partial_phrase = words.join(" ");
    let mut candidates = Vec::new();
    for index in 0..2048 {
        let Ok(mut word) = bip39_word(index) else {
            continue;
        };
        let mut phrase = String::with_capacity(partial_phrase.len() + word.len() + 1);
        phrase.push_str(&partial_phrase);
        phrase.push(' ');
        phrase.push_str(&word);
        let valid =
            unsafe { entropylab_wasm::el_bip39_validate(phrase.as_ptr(), phrase.len()) == 1 };
        wipe_string(&mut phrase);
        if valid {
            candidates.push(word);
        } else {
            wipe_string(&mut word);
        }
    }
    wipe_string(&mut partial_phrase);
    candidates
}

fn dice_entropy_length(target_words: u8) -> Result<usize, EntropyStudioError> {
    match target_words {
        12 => Ok(16),
        15 => Ok(20),
        18 => Ok(24),
        21 => Ok(28),
        24 => Ok(32),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

fn is_dice_separator(character: char) -> bool {
    character.is_whitespace() || matches!(character, ',' | ';' | '|')
}

fn wipe_bytes(bytes: &mut [u8]) {
    for byte in bytes {
        unsafe { std::ptr::write_volatile(byte, 0) };
    }
    std::sync::atomic::compiler_fence(std::sync::atomic::Ordering::SeqCst);
}

fn wipe_string(value: &mut String) {
    unsafe { wipe_bytes(value.as_mut_vec()) };
}

#[cfg(test)]
mod tests {
    use super::*;

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
    fn dice_rolls_match_entropylabs_hashed_dice_methods() {
        let mut coldcard_digest = sha256(b"123456".to_vec());
        let coldcard_expected = coldcard_digest[..16].to_vec();
        wipe_bytes(&mut coldcard_digest);
        assert_eq!(
            dice_rolls_to_entropy("1 2,3;4|5\n6".to_owned(), DiceRollMethod::Coldcard, 12,)
                .unwrap(),
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
    fn bitbox_direct_dice_matches_the_upstream_lookup_and_checksum_candidates() {
        let state = direct_dice_state("111111".to_owned(), DirectDiceMethod::Bitbox, 12).unwrap();
        assert_eq!(state.words, vec!["abandon".to_owned()]);
        assert_eq!(state.step, DirectDiceStep::BitboxDie);
        assert_eq!(state.active_word, 2);
        assert_eq!(state.active_roll, 1);

        let state = direct_dice_state("111111".repeat(11), DirectDiceMethod::Bitbox, 12).unwrap();
        assert_eq!(state.words, vec!["abandon".to_owned(); 11]);
        assert_eq!(state.step, DirectDiceStep::BitboxFinalWord);
        assert_eq!(state.candidates.len(), 128);
        assert!(state.candidates.contains(&"about".to_owned()));
    }

    #[test]
    fn d8_d16_direct_dice_matches_the_upstream_lookup_and_checksum_selection() {
        let state = direct_dice_state("100".to_owned(), DirectDiceMethod::D8D16, 12).unwrap();
        assert_eq!(state.words, vec!["abandon".to_owned()]);
        assert_eq!(state.step, DirectDiceStep::D8D16WordD8);
        assert_eq!(state.active_word, 2);
        assert_eq!(state.active_roll, 1);

        let state = direct_dice_state(
            format!("{}10", "100".repeat(11)),
            DirectDiceMethod::D8D16,
            12,
        )
        .unwrap();
        assert_eq!(state.words, vec!["abandon".to_owned(); 11]);
        assert_eq!(state.candidates.len(), 128);
        assert_eq!(state.final_word, "about");
        assert_eq!(state.step, DirectDiceStep::D8D16Complete);
        assert!(state.complete);
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
}
