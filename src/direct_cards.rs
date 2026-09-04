use crate::bip39::{bip39_entropy_bytes, bip39_word};
use crate::cards::is_card_separator;
use crate::error::EntropyStudioError;
use crate::wipe::wipe_string;

#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum DirectCardStep {
    Word,
    Final,
    Correction,
    Complete,
}

#[derive(Debug, uniffi::Record)]
pub struct DirectCardState {
    pub words: Vec<String>,
    pub candidates: Vec<String>,
    pub final_word: String,
    pub step: DirectCardStep,
    pub complete: bool,
    pub invalid_count: u32,
    pub extra_count: u32,
    pub partial_words: u8,
    pub completed_groups: u8,
    pub active_word: u8,
    pub active_draw: u8,
    pub active_max: u8,
    pub entered_draws: u32,
    pub final_draws: u8,
    pub progress: f64,
    pub required_draws: u32,
}

#[uniffi::export]
pub fn direct_card_state(
    mut transcript: String,
    target_words: u8,
) -> Result<DirectCardState, EntropyStudioError> {
    let result = direct_card_state_inner(&transcript, target_words);
    wipe_string(&mut transcript);
    result
}

fn direct_card_state_inner(
    transcript: &str,
    target_words: u8,
) -> Result<DirectCardState, EntropyStudioError> {
    let partial_words = direct_card_partial_words(target_words)?;
    let final_radices = direct_card_final_radices(target_words)?;
    let required_word_draws = usize::from(partial_words) * 4;
    let required_draws = required_word_draws + final_radices.len();
    let entries: Vec<char> = transcript
        .chars()
        .filter(|character| !is_card_separator(*character))
        .map(|character| character.to_ascii_uppercase())
        .collect();
    let entered_draws = entries.len();
    let usable_draws = entered_draws.min(required_draws);
    let mut values = Vec::with_capacity(usable_draws);
    let mut invalid_count = 0;

    for (position, rank) in entries.iter().take(required_draws).enumerate() {
        let max = direct_card_step_max(position, required_word_draws, final_radices);
        match direct_card_rank_value(*rank) {
            Some(value) if value < usize::from(max) => values.push(Some(value)),
            _ => {
                values.push(None);
                invalid_count += 1;
            }
        }
    }

    let mut words = Vec::with_capacity(usize::from(partial_words));
    let mut all_partial_valid = values.len() >= required_word_draws;
    for word_position in 0..usize::from(partial_words) {
        let start = word_position * 4;
        let Some(group) = values.get(start..start + 4) else {
            all_partial_valid = false;
            continue;
        };
        let Some(first) = group[0] else {
            all_partial_valid = false;
            continue;
        };
        let Some(second) = group[1] else {
            all_partial_valid = false;
            continue;
        };
        let Some(third) = group[2] else {
            all_partial_valid = false;
            continue;
        };
        let Some(fourth) = group[3] else {
            all_partial_valid = false;
            continue;
        };
        let word_index = ((first * 8 + second) * 8 + third) * 4 + fourth;
        words.push(bip39_word(word_index)?);
    }

    let candidates = if all_partial_valid {
        direct_card_candidates(&words, target_words)
    } else {
        Vec::new()
    };
    let final_values = values.get(required_word_draws..).unwrap_or_default();
    let final_valid = final_values.len() == final_radices.len()
        && final_values.iter().all(Option::is_some);
    let final_index = if final_valid {
        final_values
            .iter()
            .zip(final_radices)
            .fold(0usize, |index, (value, radix)| {
                index * usize::from(*radix) + value.expect("validated direct-card rank")
            })
    } else {
        0
    };
    let final_word = if final_valid {
        candidates.get(final_index).cloned().unwrap_or_default()
    } else {
        String::new()
    };
    let extra_count = entered_draws.saturating_sub(required_draws) as u32;
    let complete = entered_draws == required_draws
        && invalid_count == 0
        && extra_count == 0
        && !final_word.is_empty();
    let completed_groups = (entered_draws.min(required_word_draws) / 4) as u8;
    let (step, active_word, active_draw, active_max) = if entered_draws < required_word_draws {
        let position = entered_draws;
        (
            DirectCardStep::Word,
            (position / 4) as u8 + 1,
            (position % 4) as u8 + 1,
            direct_card_step_max(position, required_word_draws, final_radices),
        )
    } else if !all_partial_valid || invalid_count > 0 || extra_count > 0 {
        (DirectCardStep::Correction, partial_words, 0, 0)
    } else if entered_draws < required_draws {
        let position = entered_draws;
        (
            DirectCardStep::Final,
            partial_words,
            (position - required_word_draws) as u8 + 1,
            direct_card_step_max(position, required_word_draws, final_radices),
        )
    } else if complete {
        (DirectCardStep::Complete, partial_words, 0, 0)
    } else {
        (DirectCardStep::Correction, partial_words, 0, 0)
    };

    Ok(DirectCardState {
        words,
        candidates,
        final_word,
        step,
        complete,
        invalid_count,
        extra_count,
        partial_words,
        completed_groups,
        active_word,
        active_draw,
        active_max,
        entered_draws: entered_draws as u32,
        final_draws: final_radices.len() as u8,
        progress: (entered_draws as f64 / required_draws as f64).min(1.0),
        required_draws: required_draws as u32,
    })
}

fn direct_card_partial_words(target_words: u8) -> Result<u8, EntropyStudioError> {
    bip39_entropy_bytes(target_words)?;
    Ok(target_words - 1)
}

fn direct_card_final_radices(target_words: u8) -> Result<&'static [u8], EntropyStudioError> {
    match target_words {
        12 => Ok(&[8, 8, 2]),
        15 => Ok(&[8, 8]),
        18 => Ok(&[8, 4]),
        21 => Ok(&[8, 2]),
        24 => Ok(&[8]),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

fn direct_card_step_max(position: usize, required_word_draws: usize, final_radices: &[u8]) -> u8 {
    if position < required_word_draws {
        if position % 4 == 3 {
            4
        } else {
            8
        }
    } else {
        final_radices[position - required_word_draws]
    }
}

fn direct_card_rank_value(rank: char) -> Option<usize> {
    match rank {
        'A' => Some(0),
        '2'..='8' => Some(rank as usize - '2' as usize + 1),
        _ => None,
    }
}

fn direct_card_candidates(words: &[String], target_words: u8) -> Vec<String> {
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