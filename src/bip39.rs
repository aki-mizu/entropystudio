use crate::error::EntropyStudioError;
use crate::wipe::{wipe_bytes, wipe_string};

#[uniffi::export]
pub fn bip39_entropy_bits(target_words: u8) -> Result<u16, EntropyStudioError> {
    Ok((bip39_entropy_bytes(target_words)? * 8) as u16)
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

pub(crate) fn bip39_entropy_bytes(target_words: u8) -> Result<usize, EntropyStudioError> {
    match target_words {
        12 => Ok(16),
        15 => Ok(20),
        18 => Ok(24),
        21 => Ok(28),
        24 => Ok(32),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

pub(crate) fn bip39_word(index: usize) -> Result<String, EntropyStudioError> {
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
