use crate::error::EntropyStudioError;
use crate::hash::sha256;
use crate::wipe::{wipe_bytes, wipe_string};

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum DiceRollMethod {
    Coldcard,
    Coleman,
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

pub(crate) fn dice_entropy_length(target_words: u8) -> Result<usize, EntropyStudioError> {
    match target_words {
        12 => Ok(16),
        15 => Ok(20),
        18 => Ok(24),
        21 => Ok(28),
        24 => Ok(32),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

pub(crate) fn is_dice_separator(character: char) -> bool {
    character.is_whitespace() || matches!(character, ',' | ';' | '|')
}
