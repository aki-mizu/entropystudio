mod bip39;
mod cards;
mod direct_cards;
mod direct_dice;
mod error;
mod hash;
mod hashed_dice;
mod wipe;

pub use bip39::{entropy_to_mnemonic, mnemonic_to_entropy};
pub use cards::{card_transcript_to_entropy, CardHashMethod};
pub use direct_cards::{direct_card_state, DirectCardState, DirectCardStep};
pub use direct_dice::{direct_dice_state, DirectDiceMethod, DirectDiceState, DirectDiceStep};
pub use error::EntropyStudioError;
pub use hash::sha256;
pub use hashed_dice::{dice_rolls_to_entropy, DiceRollMethod};

#[cfg(test)]
use wipe::wipe_bytes;

uniffi::setup_scaffolding!();

#[cfg(test)]
mod tests;
