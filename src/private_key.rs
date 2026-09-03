use crate::error::EntropyStudioError;
use crate::wipe::{wipe_bytes, wipe_string};

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum PrivateKeyFormat {
    Wif,
    Hex,
    MiniKey,
    BrainWallet,
}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum PrivateKeyInputStatus {
    Empty,
    Prefix,
    Incomplete,
    Invalid,
    Excess,
    Ready,
}

#[derive(Debug, uniffi::Record)]
pub struct PrivateKeyInputState {
    pub entered_count: u32,
    pub minimum_count: u32,
    pub maximum_count: u32,
    pub required_count: u32,
    pub remaining_count: u32,
    pub invalid_character_count: u32,
    pub excess_count: u32,
    pub can_derive: bool,
    pub status: PrivateKeyInputStatus,
}

#[uniffi::export]
pub fn private_key_input_state(
    mut value: String,
    format: PrivateKeyFormat,
) -> PrivateKeyInputState {
    let state = match format {
        PrivateKeyFormat::Wif => wif_input_state(&value),
        PrivateKeyFormat::Hex => hex_input_state(&value),
        PrivateKeyFormat::MiniKey => mini_key_input_state(&value),
        PrivateKeyFormat::BrainWallet => brain_wallet_input_state(&value),
    };
    wipe_string(&mut value);
    state
}

#[uniffi::export]
pub fn private_key_entropy(
    mut value: String,
    format: PrivateKeyFormat,
) -> Result<Vec<u8>, EntropyStudioError> {
    let result = private_key_entropy_inner(&value, format);
    wipe_string(&mut value);
    result
}

#[uniffi::export]
pub fn private_key_key_allowed(
    mut value: String,
    selection_start: u32,
    selection_end: u32,
    mut character: String,
    format: PrivateKeyFormat,
) -> bool {
    let allowed = if character.chars().count() != 1 {
        false
    } else {
        let mut candidate = replace_selection(&value, selection_start, selection_end, &character);
        let allowed = match format {
            PrivateKeyFormat::Wif => wif_prefix_allowed(&candidate),
            PrivateKeyFormat::Hex => hex_prefix_allowed(&candidate),
            PrivateKeyFormat::MiniKey => mini_key_prefix_allowed(&candidate),
            PrivateKeyFormat::BrainWallet => true,
        };
        wipe_string(&mut candidate);
        allowed
    };
    wipe_string(&mut value);
    wipe_string(&mut character);
    allowed
}

fn private_key_entropy_inner(
    value: &str,
    format: PrivateKeyFormat,
) -> Result<Vec<u8>, EntropyStudioError> {
    let mut entropy = match format {
        PrivateKeyFormat::Wif => wif_entropy(value)?,
        PrivateKeyFormat::Hex => hex_entropy(value)?,
        PrivateKeyFormat::MiniKey => mini_key_entropy(value)?,
        PrivateKeyFormat::BrainWallet => brain_wallet_entropy(value)?,
    };
    let result = entropy.to_vec();
    wipe_bytes(&mut entropy);
    Ok(result)
}

fn wif_entropy(value: &str) -> Result<[u8; 32], EntropyStudioError> {
    let candidate = value.trim();
    if candidate.is_empty() {
        return Err(EntropyStudioError::EmptyPrivateKey);
    }

    let mut payload = [0u8; 34];
    let length = unsafe {
        entropylab_wasm::el_b58check_decode(
            candidate.as_ptr(),
            candidate.len(),
            payload.as_mut_ptr(),
            payload.len(),
        )
    };
    let result = match length {
        33 if is_mainnet_wif_version(payload[0]) => private_key_from_payload(&payload),
        34 if is_mainnet_wif_version(payload[0]) && payload[33] == 1 => {
            private_key_from_payload(&payload)
        }
        _ => Err(EntropyStudioError::InvalidWifPrivateKey),
    };
    wipe_bytes(&mut payload);
    result
}

fn wif_input_state(value: &str) -> PrivateKeyInputState {
    let candidate = value.trim();
    let entered_count = character_count(candidate);
    let first_character = candidate.chars().next();
    let required_count = match first_character {
        Some('5') => 51,
        Some('K' | 'L') => 52,
        _ => 0,
    };
    let invalid_character_count = candidate
        .chars()
        .filter(|character| !is_base58_input_character(*character))
        .count() as u32
        + u32::from(
            first_character.is_some()
                && required_count == 0
                && first_character.is_some_and(is_base58_input_character),
        );
    let excess_count = if required_count == 0 {
        0
    } else {
        entered_count.saturating_sub(required_count)
    };
    let status = if candidate.is_empty() {
        PrivateKeyInputStatus::Prefix
    } else if invalid_character_count > 0 {
        PrivateKeyInputStatus::Invalid
    } else if excess_count > 0 {
        PrivateKeyInputStatus::Excess
    } else if entered_count == required_count {
        if wif_entropy(value).is_ok() {
            PrivateKeyInputStatus::Ready
        } else {
            PrivateKeyInputStatus::Invalid
        }
    } else {
        PrivateKeyInputStatus::Incomplete
    };
    private_key_input_state_record(
        entered_count,
        51,
        52,
        required_count,
        invalid_character_count,
        excess_count,
        status,
    )
}

fn hex_entropy(value: &str) -> Result<[u8; 32], EntropyStudioError> {
    let mut compact: String = value
        .chars()
        .filter(|character| !character.is_whitespace())
        .collect();
    let result = (|| {
        if compact.is_empty() {
            return Err(EntropyStudioError::EmptyPrivateKey);
        }

        let digits = compact
            .strip_prefix("0x")
            .or_else(|| compact.strip_prefix("0X"))
            .unwrap_or(&compact);
        if digits.len() != 64 || !digits.bytes().all(|byte| byte.is_ascii_hexdigit()) {
            return Err(EntropyStudioError::InvalidHexPrivateKey);
        }

        let mut entropy = [0u8; 32];
        for (index, byte) in digits.bytes().enumerate() {
            let nibble = match byte {
                b'0'..=b'9' => byte - b'0',
                b'a'..=b'f' => byte - b'a' + 10,
                b'A'..=b'F' => byte - b'A' + 10,
                _ => unreachable!("hex digits were validated before decoding"),
            };
            entropy[index / 2] = (entropy[index / 2] << 4) | nibble;
        }
        validate_private_key(entropy)
    })();
    wipe_string(&mut compact);
    result
}

fn hex_input_state(value: &str) -> PrivateKeyInputState {
    let mut compact: String = value
        .chars()
        .filter(|character| !character.is_whitespace())
        .collect();
    let state = {
        let digits = compact
            .strip_prefix("0x")
            .or_else(|| compact.strip_prefix("0X"))
            .unwrap_or(&compact);
        let entered_count = character_count(digits);
        let invalid_character_count = digits
            .chars()
            .filter(|character| !character.is_ascii_hexdigit())
            .count() as u32;
        let excess_count = entered_count.saturating_sub(64);
        let status = if invalid_character_count > 0 {
            PrivateKeyInputStatus::Invalid
        } else if excess_count > 0 {
            PrivateKeyInputStatus::Excess
        } else if entered_count == 64 {
            if hex_entropy(value).is_ok() {
                PrivateKeyInputStatus::Ready
            } else {
                PrivateKeyInputStatus::Invalid
            }
        } else {
            PrivateKeyInputStatus::Incomplete
        };
        private_key_input_state_record(
            entered_count,
            64,
            64,
            64,
            invalid_character_count,
            excess_count,
            status,
        )
    };
    wipe_string(&mut compact);
    state
}

fn mini_key_entropy(value: &str) -> Result<[u8; 32], EntropyStudioError> {
    let candidate = value.trim();
    if candidate.is_empty() {
        return Err(EntropyStudioError::EmptyPrivateKey);
    }
    if !matches!(candidate.len(), 22 | 30)
        || !candidate.starts_with('S')
        || !candidate.bytes().all(is_base58_character)
    {
        return Err(EntropyStudioError::InvalidMiniPrivateKeyFormat);
    }

    let mut checksum_input = String::with_capacity(candidate.len() + 1);
    checksum_input.push_str(candidate);
    checksum_input.push('?');
    let mut checksum = sha256_digest(checksum_input.as_bytes());
    wipe_string(&mut checksum_input);
    let valid_checksum = checksum[0] == 0;
    wipe_bytes(&mut checksum);
    if !valid_checksum {
        return Err(EntropyStudioError::InvalidMiniPrivateKey);
    }

    validate_private_key(sha256_digest(candidate.as_bytes()))
}

fn mini_key_input_state(value: &str) -> PrivateKeyInputState {
    let candidate = value.trim();
    let entered_count = character_count(candidate);
    let required_count = if entered_count <= 22 { 22 } else { 30 };
    let invalid_character_count = candidate
        .chars()
        .enumerate()
        .filter(|(index, character)| {
            (*index == 0 && *character != 'S')
                || (*index > 0 && !is_base58_input_character(*character))
        })
        .count() as u32;
    let excess_count = entered_count.saturating_sub(30);
    let status = if candidate.is_empty() {
        PrivateKeyInputStatus::Prefix
    } else if invalid_character_count > 0 {
        PrivateKeyInputStatus::Invalid
    } else if excess_count > 0 {
        PrivateKeyInputStatus::Excess
    } else if matches!(entered_count, 22 | 30) {
        if mini_key_entropy(value).is_ok() {
            PrivateKeyInputStatus::Ready
        } else {
            PrivateKeyInputStatus::Invalid
        }
    } else {
        PrivateKeyInputStatus::Incomplete
    };
    private_key_input_state_record(
        entered_count,
        22,
        30,
        required_count,
        invalid_character_count,
        excess_count,
        status,
    )
}

fn brain_wallet_entropy(value: &str) -> Result<[u8; 32], EntropyStudioError> {
    if value.is_empty() {
        return Err(EntropyStudioError::EmptyBrainWallet);
    }

    Ok(sha256_digest(value.as_bytes()))
}

fn brain_wallet_input_state(value: &str) -> PrivateKeyInputState {
    let entered_count = character_count(value);
    let status = if value.is_empty() {
        PrivateKeyInputStatus::Empty
    } else {
        PrivateKeyInputStatus::Ready
    };
    private_key_input_state_record(entered_count, 0, 0, 0, 0, 0, status)
}

fn private_key_input_state_record(
    entered_count: u32,
    minimum_count: u32,
    maximum_count: u32,
    required_count: u32,
    invalid_character_count: u32,
    excess_count: u32,
    status: PrivateKeyInputStatus,
) -> PrivateKeyInputState {
    PrivateKeyInputState {
        entered_count,
        minimum_count,
        maximum_count,
        required_count,
        remaining_count: required_count.saturating_sub(entered_count),
        invalid_character_count,
        excess_count,
        can_derive: matches!(status, PrivateKeyInputStatus::Ready),
        status,
    }
}

fn private_key_from_payload(payload: &[u8; 34]) -> Result<[u8; 32], EntropyStudioError> {
    let mut entropy = [0u8; 32];
    entropy.copy_from_slice(&payload[1..33]);
    validate_private_key(entropy)
}

fn is_mainnet_wif_version(version: u8) -> bool {
    version == 0x80
}

fn is_base58_character(byte: u8) -> bool {
    matches!(
        byte,
        b'1'..=b'9'
            | b'A'..=b'H'
            | b'J'..=b'N'
            | b'P'..=b'Z'
            | b'a'..=b'k'
            | b'm'..=b'z'
    )
}

fn is_base58_input_character(character: char) -> bool {
    character.is_ascii() && is_base58_character(character as u8)
}

fn character_count(value: &str) -> u32 {
    value.chars().count() as u32
}

fn wif_prefix_allowed(value: &str) -> bool {
    let Some(first) = value.as_bytes().first() else {
        return false;
    };
    let expected_length = match first {
        b'5' => 51,
        b'K' | b'L' => 52,
        _ => return false,
    };
    if value.len() > expected_length || !value.bytes().all(is_base58_character) {
        return false;
    }
    value.len() < expected_length || wif_entropy(value).is_ok()
}

fn hex_prefix_allowed(value: &str) -> bool {
    let digits = value
        .strip_prefix("0x")
        .or_else(|| value.strip_prefix("0X"))
        .unwrap_or(value);
    if digits.len() > 64 || !digits.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return false;
    }
    digits.len() < 64 || hex_entropy(value).is_ok()
}

fn mini_key_prefix_allowed(value: &str) -> bool {
    if value.len() > 30 || !value.starts_with('S') || !value.bytes().all(is_base58_character) {
        return false;
    }
    value.len() < 30 || mini_key_entropy(value).is_ok()
}

fn replace_selection(
    value: &str,
    selection_start: u32,
    selection_end: u32,
    replacement: &str,
) -> String {
    let (start, end) = selection_bounds(value, selection_start, selection_end);
    format!("{}{}{}", &value[..start], replacement, &value[end..])
}

fn selection_bounds(value: &str, selection_start: u32, selection_end: u32) -> (usize, usize) {
    let mut start = usize::try_from(selection_start)
        .unwrap_or(usize::MAX)
        .min(value.len());
    while start > 0 && !value.is_char_boundary(start) {
        start -= 1;
    }
    let mut end = usize::try_from(selection_end)
        .unwrap_or(usize::MAX)
        .min(value.len())
        .max(start);
    while end > start && !value.is_char_boundary(end) {
        end -= 1;
    }
    (start, end)
}

fn sha256_digest(input: &[u8]) -> [u8; 32] {
    let mut digest = [0u8; 32];
    unsafe {
        entropylab_wasm::el_sha256(input.as_ptr(), input.len(), digest.as_mut_ptr());
    }
    digest
}

fn validate_private_key(mut entropy: [u8; 32]) -> Result<[u8; 32], EntropyStudioError> {
    let valid = unsafe { entropylab_wasm::secp_seckey_valid(entropy.as_ptr()) } == 1;
    if !valid {
        wipe_bytes(&mut entropy);
        return Err(EntropyStudioError::InvalidPrivateKeyRange);
    }
    Ok(entropy)
}
