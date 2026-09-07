use crate::error::EntropyStudioError;
use crate::wipe::{wipe_bytes, wipe_string};
use unicode_normalization::UnicodeNormalization;

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
pub fn mnemonic_to_seed(mut phrase: String, mut passphrase: String) -> Vec<u8> {
    let mut normalized_phrase: String = phrase.nfkd().collect();
    let mut salt = String::from("mnemonic");
    salt.push_str(&passphrase);
    let mut normalized_salt: String = salt.nfkd().collect();
    wipe_string(&mut phrase);
    wipe_string(&mut passphrase);
    wipe_string(&mut salt);

    let mut seed = [0u8; 64];
    unsafe {
        entropylab_wasm::el_pbkdf2_hmac_sha512(
            normalized_phrase.as_ptr(),
            normalized_phrase.len(),
            normalized_salt.as_ptr(),
            normalized_salt.len(),
            2048,
            seed.as_mut_ptr(),
            seed.len(),
        );
    }
    wipe_string(&mut normalized_phrase);
    wipe_string(&mut normalized_salt);
    let result = seed.to_vec();
    wipe_bytes(&mut seed);
    result
}

#[uniffi::export]
pub fn mnemonic_to_master_fingerprint(
    phrase: String,
    passphrase: String,
) -> Result<String, EntropyStudioError> {
    let mut seed = mnemonic_to_seed(phrase, passphrase);
    let result = master_fingerprint_from_seed(&seed);
    wipe_bytes(&mut seed);
    result
}

#[uniffi::export]
pub fn mnemonic_to_master_xprv(
    phrase: String,
    passphrase: String,
) -> Result<String, EntropyStudioError> {
    let mut seed = mnemonic_to_seed(phrase, passphrase);
    let mut master = [0u8; 78];
    let mut encoded = [0u8; 112];
    let master_length = unsafe {
        entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), master.as_mut_ptr())
    };
    wipe_bytes(&mut seed);

    if master_length != 78 {
        wipe_bytes(&mut master);
        wipe_bytes(&mut encoded);
        return Err(EntropyStudioError::InvalidMasterKey);
    }

    let encoded_length = unsafe {
        entropylab_wasm::el_b58check_encode(
            master.as_ptr(),
            master_length as usize,
            encoded.as_mut_ptr(),
            encoded.len(),
        )
    };
    wipe_bytes(&mut master);

    if encoded_length < 0 || encoded_length as usize > encoded.len() {
        wipe_bytes(&mut encoded);
        return Err(EntropyStudioError::InvalidMasterKey);
    }

    let result = std::str::from_utf8(&encoded[..encoded_length as usize])
        .map(str::to_owned)
        .map_err(|_| EntropyStudioError::InvalidMasterKey);
    wipe_bytes(&mut encoded);
    result
}

fn master_fingerprint_from_seed(seed: &[u8]) -> Result<String, EntropyStudioError> {
    let mut master = [0u8; 78];
    let mut child = [0u8; 78];
    let master_length = unsafe {
        entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), master.as_mut_ptr())
    };

    if master_length != 78 {
        wipe_bytes(&mut master);
        wipe_bytes(&mut child);
        return Err(EntropyStudioError::InvalidMasterKey);
    }

    let mut child_index = 0u32;
    loop {
        let child_length = unsafe {
            entropylab_wasm::el_hd_ckd_priv(master.as_ptr(), child_index, child.as_mut_ptr())
        };
        if child_length == 78 {
            let fingerprint = child[5..9]
                .iter()
                .map(|byte| format!("{byte:02x}"))
                .collect();
            wipe_bytes(&mut master);
            wipe_bytes(&mut child);
            return Ok(fingerprint);
        }
        if child_length != 1 {
            wipe_bytes(&mut master);
            wipe_bytes(&mut child);
            return Err(EntropyStudioError::InvalidMasterKey);
        }
        child_index = match child_index.checked_add(1) {
            Some(next_index) => next_index,
            None => {
                wipe_bytes(&mut master);
                wipe_bytes(&mut child);
                return Err(EntropyStudioError::InvalidMasterKey);
            }
        };
    }
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
