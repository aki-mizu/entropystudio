use std::error::Error;
use std::fmt;

uniffi::setup_scaffolding!();

#[derive(Debug, uniffi::Error)]
pub enum EntropyStudioError {
    InvalidMnemonic,
    InvalidEntropy,
    InvalidDiceRolls,
    NoDiceRolls,
    UnsupportedDiceWordCount,
}

impl fmt::Display for EntropyStudioError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{self:?}")
    }
}

impl Error for EntropyStudioError {}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum DiceRollMethod {
    Coldcard,
    Coleman,
}

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

fn dice_entropy_length(target_words: u8) -> Result<usize, EntropyStudioError> {
    match target_words {
        12 => Ok(16),
        15 => Ok(20),
        18 => Ok(24),
        21 => Ok(28),
        24 => Ok(32),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

fn is_dice_separator(character: char) -> bool {
    character.is_whitespace() || matches!(character, ',' | ';' | '|')
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

    #[test]
    fn entropy_to_mnemonic_returns_bip39_phrase() {
        assert_eq!(
            entropy_to_mnemonic(vec![0; 16]).unwrap(),
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
        );
    }

    #[test]
    fn entropy_to_mnemonic_returns_typed_error() {
        assert!(matches!(
            entropy_to_mnemonic(vec![0; 17]),
            Err(EntropyStudioError::InvalidEntropy)
        ));
    }

    #[test]
    fn dice_rolls_match_entropylabs_hashed_dice_methods() {
        let mut coldcard_digest = sha256(b"123456".to_vec());
        let coldcard_expected = coldcard_digest[..16].to_vec();
        wipe_bytes(&mut coldcard_digest);
        assert_eq!(
            dice_rolls_to_entropy(
                "1 2,3;4|5\n6".to_owned(),
                DiceRollMethod::Coldcard,
                12,
            )
            .unwrap(),
            coldcard_expected
        );

        let mut coleman_digest = sha256(b"123450".to_vec());
        let coleman_expected = coleman_digest[..16].to_vec();
        wipe_bytes(&mut coleman_digest);
        assert_eq!(
            dice_rolls_to_entropy("123456".to_owned(), DiceRollMethod::Coleman, 12).unwrap(),
            coleman_expected
        );
    }

    #[test]
    fn dice_rolls_support_each_bip39_entropy_size() {
        for (words, expected_bytes) in [(12, 16), (15, 20), (18, 24), (21, 28), (24, 32)] {
            assert_eq!(
                dice_rolls_to_entropy("1".repeat(99), DiceRollMethod::Coldcard, words)
                    .unwrap()
                    .len(),
                expected_bytes
            );
        }
    }

    #[test]
    fn dice_rolls_return_typed_validation_errors() {
        assert!(matches!(
            dice_rolls_to_entropy("123x".to_owned(), DiceRollMethod::Coldcard, 24),
            Err(EntropyStudioError::InvalidDiceRolls)
        ));
        assert!(matches!(
            dice_rolls_to_entropy(" ,;|\n".to_owned(), DiceRollMethod::Coldcard, 24),
            Err(EntropyStudioError::NoDiceRolls)
        ));
        assert!(matches!(
            dice_rolls_to_entropy("123456".to_owned(), DiceRollMethod::Coldcard, 13),
            Err(EntropyStudioError::UnsupportedDiceWordCount)
        ));
    }
}
