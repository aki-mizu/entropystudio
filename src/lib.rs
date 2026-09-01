use std::error::Error;
use std::fmt;

uniffi::setup_scaffolding!();

#[derive(Debug, uniffi::Error)]
pub enum EntropyStudioError {
    InvalidMnemonic,
}

impl fmt::Display for EntropyStudioError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidMnemonic => formatter.write_str("invalid BIP39 English mnemonic"),
        }
    }
}

impl Error for EntropyStudioError {}

#[uniffi::export]
pub fn sha256(mut input: Vec<u8>) -> Vec<u8> {
    let mut digest = [0u8; 32];
    unsafe {
        entropylab_wasm::el_sha256(input.as_ptr(), input.len(), digest.as_mut_ptr());
    }
    wipe_bytes(&mut input);
    let result = digest.to_vec();
    wipe_bytes(&mut digest);
    result
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

fn wipe_bytes(bytes: &mut [u8]) {
    for byte in bytes {
        unsafe { std::ptr::write_volatile(byte, 0) };
    }
    std::sync::atomic::compiler_fence(std::sync::atomic::Ordering::SeqCst);
}

fn wipe_string(value: &mut String) {
    unsafe { wipe_bytes(value.as_mut_vec()) };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha256_uses_entropylab_implementation() {
        assert_eq!(
            sha256(b"abc".to_vec()),
            vec![
                0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae,
                0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61,
                0xf2, 0x00, 0x15, 0xad,
            ]
        );
    }

    #[test]
    fn mnemonic_to_entropy_returns_bip39_entropy() {
        let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        assert_eq!(mnemonic_to_entropy(phrase.to_owned()).unwrap(), vec![0; 16]);
    }

    #[test]
    fn mnemonic_to_entropy_returns_typed_error() {
        assert!(matches!(
            mnemonic_to_entropy("not a valid mnemonic".to_owned()),
            Err(EntropyStudioError::InvalidMnemonic)
        ));
    }
}
