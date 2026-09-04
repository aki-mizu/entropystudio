mod bip39;
mod cards;
mod direct_cards;
mod direct_dice;
mod entropy_sync;
mod error;
mod hash;
mod hashed_dice;
mod number_bases;
mod private_key;
mod seed_phrase;
mod wipe;

pub use bip39::{entropy_to_mnemonic, mnemonic_to_entropy};
pub use cards::{
	card_key_allowed, card_transcript_to_entropy, hashed_card_state, normalize_card_token,
	normalize_direct_card_transcript, CardHashMethod, CardInputMethod, HashedCardInstruction,
	HashedCardState,
};
pub use direct_cards::{direct_card_state, DirectCardState, DirectCardStep};
pub use direct_dice::{
	dice_method_info, direct_dice_input_state, direct_dice_state, format_dice_transcript,
	DiceFinalStep, DiceInputMethod, DiceMethodInfo, DirectDiceMethod, DirectDiceState,
	DirectDiceStep,
};
pub use entropy_sync::{synchronize_entropy, EntropySyncSnapshot, EntropySyncSource};
pub use error::EntropyStudioError;
pub use hash::sha256;
pub use hashed_dice::{dice_rolls_to_entropy, hashed_dice_state, DiceRollMethod, HashedDiceState};
pub use number_bases::{
	analyze_number_base_input, number_base_entropy, NumberBaseAnalysis, NumberBaseFormat,
};
pub use private_key::{
	private_key_entropy, private_key_input_state, private_key_key_allowed, PrivateKeyFormat,
	PrivateKeyInputState, PrivateKeyInputStatus,
};
pub use seed_phrase::{
	seed_phrase_autocomplete, seed_phrase_key_allowed, seed_phrase_numbers_to_words,
	seed_phrase_space_allowed, seed_phrase_state, seed_phrase_words_to_numbers,
	translate_seed_number_indices, SeedPhraseAutocompleteResult, SeedPhraseInputMethod,
	SeedPhraseState, SeedPhraseStatus,
};

#[cfg(test)]
use wipe::wipe_bytes;

uniffi::setup_scaffolding!();

#[cfg(test)]
mod tests;
