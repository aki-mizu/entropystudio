use crate::bip39::{bip39_entropy_bytes, bip39_word};
use crate::error::EntropyStudioError;
use crate::hashed_dice::{is_dice_separator, recommended_dice_rolls};
use crate::wipe::{wipe_bytes, wipe_string};

#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum DirectDiceMethod {
    Bitbox,
    D8D16,
}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum DiceInputMethod {
    Coldcard,
    Coleman,
    Bitbox,
    D8D16,
}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum DiceFinalStep {
    D8,
    D16,
    Coin,
}

#[derive(Debug, uniffi::Record)]
pub struct DiceMethodInfo {
    pub checksum_candidates: u16,
    pub entropy_bits: u16,
    pub final_steps: Vec<DiceFinalStep>,
    pub partial_words: u8,
    pub recommended_rolls: u8,
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
    pub allowed_faces: Vec<String>,
    pub can_derive: bool,
    pub mnemonic: String,
    pub progress: f64,
}

#[uniffi::export]
pub fn direct_dice_state(
    mut rolls: String,
    method: DirectDiceMethod,
    target_words: u8,
) -> Result<DirectDiceState, EntropyStudioError> {
    let result = direct_dice_input_state_inner(&rolls, method, target_words, "");
    wipe_string(&mut rolls);
    result
}

#[uniffi::export]
pub fn direct_dice_input_state(
    mut rolls: String,
    method: DirectDiceMethod,
    target_words: u8,
    mut selected_final_word: String,
) -> Result<DirectDiceState, EntropyStudioError> {
    let result = direct_dice_input_state_inner(&rolls, method, target_words, &selected_final_word);
    wipe_string(&mut rolls);
    wipe_string(&mut selected_final_word);
    result
}

#[uniffi::export]
pub fn dice_method_info(target_words: u8) -> Result<DiceMethodInfo, EntropyStudioError> {
    let entropy_bits = bip39_entropy_bytes(target_words)? * 8;
    let checksum_bits = entropy_bits / 32;
    let final_steps = d8_d16_final_steps(target_words)?
        .iter()
        .map(|step| match step {
            D8D16FinalStep::D8 => DiceFinalStep::D8,
            D8D16FinalStep::D16 => DiceFinalStep::D16,
            D8D16FinalStep::Coin => DiceFinalStep::Coin,
        })
        .collect();

    Ok(DiceMethodInfo {
        checksum_candidates: (1usize << (11 - checksum_bits)) as u16,
        entropy_bits: entropy_bits as u16,
        final_steps,
        partial_words: target_words - 1,
        recommended_rolls: recommended_dice_rolls(target_words)?,
    })
}

#[uniffi::export]
pub fn format_dice_transcript(
    mut rolls: String,
    method: DiceInputMethod,
    target_words: u8,
) -> Result<String, EntropyStudioError> {
    let result = match method {
        DiceInputMethod::Coldcard | DiceInputMethod::Coleman => Ok(rolls.clone()),
        DiceInputMethod::Bitbox => format_bitbox_transcript(&rolls, target_words),
        DiceInputMethod::D8D16 => Ok(format_d8_d16_transcript(&rolls, target_words)),
    };
    wipe_string(&mut rolls);
    result
}

fn direct_dice_input_state_inner(
    rolls: &str,
    method: DirectDiceMethod,
    target_words: u8,
    selected_final_word: &str,
) -> Result<DirectDiceState, EntropyStudioError> {
    let state = match method {
        DirectDiceMethod::Bitbox => bitbox_dice_state(&rolls, target_words),
        DirectDiceMethod::D8D16 => d8_d16_dice_state(&rolls, target_words),
    }?;
    Ok(finalize_direct_dice_state(state, method, selected_final_word))
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
        allowed_faces: Vec::new(),
        can_derive: false,
        mnemonic: String::new(),
        progress: 0.0,
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
        allowed_faces: Vec::new(),
        can_derive: false,
        mnemonic: String::new(),
        progress: 0.0,
    })
}

fn finalize_direct_dice_state(
    mut state: DirectDiceState,
    method: DirectDiceMethod,
    selected_final_word: &str,
) -> DirectDiceState {
    let valid_partial_phrase = state.invalid_count == 0
        && state.words.len() == usize::from(state.partial_words);
    if matches!(method, DirectDiceMethod::Bitbox) && valid_partial_phrase {
        let selected = selected_final_word.trim().to_ascii_lowercase();
        if state.candidates.iter().any(|candidate| candidate == &selected) {
            state.final_word = selected;
        }
    }

    state.can_derive = valid_partial_phrase
        && match method {
            DirectDiceMethod::Bitbox => !state.final_word.is_empty(),
            DirectDiceMethod::D8D16 => state.complete,
        };
    state.progress = (f64::from(state.completed_groups) + f64::from(state.can_derive))
        / f64::from(state.partial_words + 1);
    state.allowed_faces = direct_dice_allowed_faces(method, state.step);
    if state.can_derive {
        state.mnemonic = format!("{} {}", state.words.join(" "), state.final_word);
    }
    state
}

fn direct_dice_allowed_faces(method: DirectDiceMethod, step: DirectDiceStep) -> Vec<String> {
    match (method, step) {
        (DirectDiceMethod::Bitbox, DirectDiceStep::BitboxDie) => {
            ('1'..='4').map(|face| face.to_string()).collect()
        }
        (DirectDiceMethod::Bitbox, DirectDiceStep::BitboxCoin) => {
            ('1'..='6').map(|face| face.to_string()).collect()
        }
        (
            DirectDiceMethod::D8D16,
            DirectDiceStep::D8D16WordD8
            | DirectDiceStep::D8D16ChecksumD8
            | DirectDiceStep::D8D16ChecksumCoin,
        ) => ('1'..='8').map(|face| face.to_string()).collect(),
        (
            DirectDiceMethod::D8D16,
            DirectDiceStep::D8D16WordD16First
            | DirectDiceStep::D8D16WordD16Second
            | DirectDiceStep::D8D16ChecksumD16,
        ) => "0123456789ABCDEF".chars().map(|face| face.to_string()).collect(),
        _ => Vec::new(),
    }
}

fn format_bitbox_transcript(rolls: &str, target_words: u8) -> Result<String, EntropyStudioError> {
    let partial_words = direct_dice_partial_words(target_words)?;
    let mut completed_words = 0;
    let mut rolls_in_word = 0;
    let mut separate_next_roll = false;
    let mut transcript = String::with_capacity(rolls.len() + usize::from(partial_words));

    for face in rolls.chars() {
        if separate_next_roll {
            transcript.push(' ');
            separate_next_roll = false;
        }
        transcript.push(face);

        if completed_words >= partial_words {
            continue;
        }
        if rolls_in_word < 5 {
            if matches!(face, '1'..='4') {
                rolls_in_word += 1;
            }
        } else {
            completed_words += 1;
            rolls_in_word = 0;
            separate_next_roll = true;
        }
    }

    Ok(transcript)
}

fn format_d8_d16_transcript(rolls: &str, target_words: u8) -> String {
    let word_roll_count = usize::from(target_words.saturating_sub(1)) * 3;
    let mut transcript = String::with_capacity(rolls.len() + usize::from(target_words));

    for (index, face) in rolls.chars().enumerate() {
        if index > 0
            && (index == word_roll_count || (index < word_roll_count && index % 3 == 0))
        {
            transcript.push(' ');
        }
        transcript.push(face);
    }

    transcript
}

fn direct_dice_partial_words(target_words: u8) -> Result<u8, EntropyStudioError> {
    bip39_entropy_bytes(target_words)?;
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
