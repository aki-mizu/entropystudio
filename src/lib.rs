mod bip39;
mod direct_dice;
mod error;
mod hash;
mod hashed_dice;
mod wipe;

pub use bip39::{entropy_to_mnemonic, mnemonic_to_entropy};
pub use direct_dice::{direct_dice_state, DirectDiceMethod, DirectDiceState, DirectDiceStep};
pub use error::EntropyStudioError;
pub use hash::sha256;
pub use hashed_dice::{dice_rolls_to_entropy, DiceRollMethod};

#[cfg(test)]
use wipe::wipe_bytes;

uniffi::setup_scaffolding!();

#[cfg(test)]
mod tests;
