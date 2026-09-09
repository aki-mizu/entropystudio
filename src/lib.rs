mod bip39;
mod cards;
mod direct_cards;
mod direct_dice;
mod entropy_sync;
mod error;
mod hash;
mod hashed_dice;
mod key_derivation;
mod lifehash;
mod number_bases;
mod private_key;
mod seed_phrase;
mod wipe;

pub use bip39::{
	account_private_material, AccountPrivateMaterial, AccountScriptType,
	bip39_entropy_bits, entropy_to_mnemonic, mnemonic_to_entropy, mnemonic_to_master_fingerprint,
	mnemonic_to_master_xprv, mnemonic_to_master_xpub, mnemonic_to_seed, seed_qr_data, SeedQrData,
};
pub use cards::{
	card_key_allowed, card_transcript_to_entropy, hashed_card_state, normalize_card_token,
	normalize_direct_card_transcript, CardHashMethod, CardInputMethod, HashedCardInstruction,
	HashedCardState,
};
pub use direct_cards::{direct_card_state, DirectCardState, DirectCardStep};
pub use direct_dice::{
	dice_method_info, direct_dice_calculations, direct_dice_input_state, direct_dice_state,
	format_dice_transcript, DiceFinalStep, DiceInputMethod, DiceMethodInfo,
	DirectDiceCalculationRow, DirectDiceCalculationTerm, DirectDiceCalculationTermKind,
	DirectDiceMethod, DirectDiceState, DirectDiceStep,
};
pub use entropy_sync::{synchronize_entropy, EntropySyncSnapshot, EntropySyncSource};
pub use error::EntropyStudioError;
pub use hash::sha256;
pub use hashed_dice::{dice_rolls_to_entropy, hashed_dice_state, DiceRollMethod, HashedDiceState};
pub use key_derivation::{
    key_derivation_address_benchmark_milliseconds, key_derivation_address_estimate_milliseconds,
    key_derivation_advanced_state, key_derivation_project_advanced_path,
    key_derivation_visible_path_state, KeyDerivationAddressWindowState, KeyDerivationAdvancedInput,
    KeyDerivationAdvancedState, KeyDerivationBranch, KeyDerivationBranchRole,
    KeyDerivationBranchWindowState, KeyDerivationIndexState, KeyDerivationNetworkKind,
    KeyDerivationPathComponent, KeyDerivationPathDisplayKind, KeyDerivationPathHelpKind,
    KeyDerivationPathProjectionInput, KeyDerivationPathProjectionState, KeyDerivationRangeState,
    KeyDerivationValidationKind, KeyDerivationVisiblePathInput, KeyDerivationVisiblePathState,
    KeyDerivationVisiblePathValidationKind,
};
pub use lifehash::lifehash_from_fingerprint;
pub use number_bases::{
	analyze_number_base_input, number_base_calculations, number_base_entropy,
	NumberBaseAnalysis, NumberBaseCalculationRow, NumberBaseCalculationTerm,
	NumberBaseCalculations, NumberBaseDigitValue, NumberBaseFormat,
};
pub use private_key::{
	private_key_entropy, private_key_input_state, private_key_key_allowed, private_key_material,
	PrivateKeyFormat, PrivateKeyInputState, PrivateKeyInputStatus, PrivateKeyMaterial,
};
pub use seed_phrase::{
	bip39_passphrase_autocomplete, bip39_passphrase_key_allowed, bip39_passphrase_space_allowed,
	bip39_passphrase_state, seed_phrase_autocomplete, seed_phrase_key_allowed,
	seed_phrase_numbers_to_words, seed_phrase_space_allowed, seed_phrase_state,
	seed_phrase_words_to_numbers, translate_seed_number_indices, Bip39PassphraseState,
	SeedPhraseAutocompleteResult, SeedPhraseInputMethod, SeedPhraseState, SeedPhraseStatus,
};

#[cfg(test)]
use wipe::wipe_bytes;

uniffi::setup_scaffolding!();

#[cfg(test)]
mod tests;
