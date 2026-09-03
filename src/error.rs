use std::error::Error;
use std::fmt;

#[derive(Debug, uniffi::Error)]
pub enum EntropyStudioError {
    InvalidMnemonic,
    InvalidEntropy,
    InvalidNumberBaseInput,
    InvalidDiceRolls,
    NoDiceRolls,
    UnsupportedDiceWordCount,
    InvalidCardTranscript,
    NoCards,
    DuplicateCard,
}

impl fmt::Display for EntropyStudioError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{self:?}")
    }
}

impl Error for EntropyStudioError {}
