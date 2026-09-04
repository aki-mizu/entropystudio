use crate::bip39::{bip39_entropy_bytes, bip39_word};
use crate::error::EntropyStudioError;
use crate::wipe::wipe_string;

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum NumberBaseFormat {
    Bin,
    Base4,
    Base8,
    Hex,
    Base32,
    Base64,
}

#[derive(Debug, uniffi::Record)]
pub struct NumberBaseAnalysis {
    pub alphabet: String,
    pub binary_remainder: bool,
    pub bits_per_digit: u8,
    pub entropy_bits: u16,
    pub entropy_bytes: u8,
    pub digits: u16,
    pub final_characters: String,
    pub full_digits: u16,
    pub remainder_bits: u8,
    pub digit_count: u32,
    pub excess_digit_count: u32,
    pub final_invalid: bool,
    pub invalid_character_count: u32,
    pub is_ready: bool,
    pub preview_words: Vec<String>,
}

struct NumberBaseConfig {
    alphabet: &'static str,
    binary_remainder: bool,
    bits_per_digit: u8,
    entropy_bits: usize,
    entropy_bytes: usize,
    digits: usize,
    final_characters: String,
    full_digits: usize,
    remainder_bits: u8,
}

struct ParsedNumberBaseInput {
    analysis: NumberBaseAnalysis,
    bits: String,
}

#[uniffi::export]
pub fn analyze_number_base_input(
    mut value: String,
    format: NumberBaseFormat,
    target_words: u8,
) -> Result<NumberBaseAnalysis, EntropyStudioError> {
    let mut parsed = parse_number_base_input(&value, format, target_words)?;
    wipe_string(&mut value);
    wipe_string(&mut parsed.bits);
    Ok(parsed.analysis)
}

#[uniffi::export]
pub fn number_base_entropy(
    mut value: String,
    format: NumberBaseFormat,
    target_words: u8,
) -> Result<Vec<u8>, EntropyStudioError> {
    let mut parsed = parse_number_base_input(&value, format, target_words)?;
    wipe_string(&mut value);

    if !parsed.analysis.is_ready {
        wipe_string(&mut parsed.bits);
        return Err(EntropyStudioError::InvalidNumberBaseInput);
    }

    let entropy = bits_to_bytes(&parsed.bits);
    wipe_string(&mut parsed.bits);
    Ok(entropy)
}

pub(crate) fn number_base_bits(
    value: &str,
    format: NumberBaseFormat,
    target_words: u8,
) -> Result<String, EntropyStudioError> {
    let mut parsed = parse_number_base_input(value, format, target_words)?;
    let valid = parsed.analysis.invalid_character_count == 0
        && parsed.analysis.excess_digit_count == 0
        && !parsed.analysis.final_invalid;

    if !valid {
        wipe_string(&mut parsed.bits);
        return Err(EntropyStudioError::InvalidNumberBaseInput);
    }

    Ok(parsed.bits)
}

pub(crate) fn number_base_value_from_bits(
    bits: &str,
    format: NumberBaseFormat,
    target_words: u8,
) -> Result<String, EntropyStudioError> {
    let config = number_base_config(format, target_words)?;
    let source = &bits[..bits.len().min(config.entropy_bits)];
    let mut value = String::with_capacity(config.digits);
    let mut offset = 0;

    while offset + usize::from(config.bits_per_digit) <= source.len()
        && value.len() < config.full_digits
    {
        let digit = bits_value(&source.as_bytes()[offset..offset + usize::from(config.bits_per_digit)]);
        value.push(config.alphabet.as_bytes()[digit] as char);
        offset += usize::from(config.bits_per_digit);
    }

    if value.len() == config.full_digits
        && config.remainder_bits > 0
        && source.len() - offset >= usize::from(config.remainder_bits)
    {
        let final_bits = &source.as_bytes()[offset..offset + usize::from(config.remainder_bits)];
        if config.binary_remainder {
            value.push_str(std::str::from_utf8(final_bits).expect("validated binary entropy bits"));
        } else {
            value.push(config.alphabet.as_bytes()[bits_value(final_bits)] as char);
        }
    }

    if matches!(format, NumberBaseFormat::Bin) {
        let mut grouped = String::with_capacity(value.len() + value.len() / 11);
        for (index, bit) in value.chars().enumerate() {
            if index > 0 && index % 11 == 0 {
                grouped.push(' ');
            }
            grouped.push(bit);
        }
        return Ok(grouped);
    }

    Ok(value)
}

fn parse_number_base_input(
    value: &str,
    format: NumberBaseFormat,
    target_words: u8,
) -> Result<ParsedNumberBaseInput, EntropyStudioError> {
    let config = number_base_config(format, target_words)?;
    let mut digits = Vec::new();
    let mut invalid_character_count = 0;

    for character in value.chars() {
        if character.is_whitespace() {
            continue;
        }

        let normalized = normalize_character(character, format);
        if config.alphabet.contains(normalized) {
            digits.push(normalized);
        } else {
            invalid_character_count += 1;
        }
    }

    let final_digits = if config.binary_remainder {
        digits
            .get(config.full_digits..config.digits.min(digits.len()))
            .unwrap_or_default()
    } else {
        digits
            .get(config.digits.saturating_sub(1)..config.digits.min(digits.len()))
            .unwrap_or_default()
    };
    let final_invalid = config.remainder_bits > 0
        && final_digits
            .iter()
            .any(|digit| !config.final_characters.contains(*digit));
    let excess_digit_count = digits.len().saturating_sub(config.digits) as u32;
    let is_ready = digits.len() == config.digits
        && invalid_character_count == 0
        && excess_digit_count == 0
        && !final_invalid;
    let bits = digits_to_bits(&digits, &config);
    let preview_words = if digits.is_empty() || invalid_character_count > 0 || final_invalid {
        Vec::new()
    } else {
        preview_words(&bits, target_words)?
    };
    digits.fill('\0');

    Ok(ParsedNumberBaseInput {
        analysis: NumberBaseAnalysis {
            alphabet: config.alphabet.to_owned(),
            binary_remainder: config.binary_remainder,
            bits_per_digit: config.bits_per_digit,
            entropy_bits: config.entropy_bits as u16,
            entropy_bytes: config.entropy_bytes as u8,
            digits: config.digits as u16,
            final_characters: config.final_characters,
            full_digits: config.full_digits as u16,
            remainder_bits: config.remainder_bits,
            digit_count: digits.len() as u32,
            excess_digit_count,
            final_invalid,
            invalid_character_count,
            is_ready,
            preview_words,
        },
        bits,
    })
}

fn number_base_config(
    format: NumberBaseFormat,
    target_words: u8,
) -> Result<NumberBaseConfig, EntropyStudioError> {
    let (alphabet, binary_remainder, bits_per_digit) = match format {
        NumberBaseFormat::Bin => ("01", false, 1),
        NumberBaseFormat::Base4 => ("0123", false, 2),
        NumberBaseFormat::Base8 => ("01234567", false, 3),
        NumberBaseFormat::Hex => ("0123456789ABCDEF", false, 4),
        NumberBaseFormat::Base32 => ("0123456789ABCDEFGHJKMNPQRSTVWXYZ", true, 5),
        NumberBaseFormat::Base64 => (
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            true,
            6,
        ),
    };
    let entropy_bytes = bip39_entropy_bytes(target_words)?;
    let entropy_bits = entropy_bytes * 8;
    let full_digits = entropy_bits / usize::from(bits_per_digit);
    let remainder_bits = (entropy_bits % usize::from(bits_per_digit)) as u8;
    let digits = full_digits
        + if remainder_bits == 0 {
            0
        } else if binary_remainder {
            usize::from(remainder_bits)
        } else {
            1
        };
    let final_characters = if remainder_bits == 0 {
        alphabet.to_owned()
    } else if binary_remainder {
        "01".to_owned()
    } else {
        alphabet
            .chars()
            .take(1usize << remainder_bits)
            .collect()
    };

    Ok(NumberBaseConfig {
        alphabet,
        binary_remainder,
        bits_per_digit,
        entropy_bits,
        entropy_bytes,
        digits,
        final_characters,
        full_digits,
        remainder_bits,
    })
}

fn normalize_character(character: char, format: NumberBaseFormat) -> char {
    if matches!(format, NumberBaseFormat::Base64) {
        return character;
    }

    let normalized = character.to_ascii_uppercase();
    if matches!(format, NumberBaseFormat::Base32) {
        match normalized {
            'O' => '0',
            'I' | 'L' => '1',
            _ => normalized,
        }
    } else {
        normalized
    }
}

fn digits_to_bits(digits: &[char], config: &NumberBaseConfig) -> String {
    let mut bits = String::with_capacity(config.entropy_bits);

    for (index, digit) in digits.iter().take(config.digits).enumerate() {
        if config.binary_remainder && index >= config.full_digits {
            bits.push(*digit);
            continue;
        }

        let value = config
            .alphabet
            .chars()
            .position(|character| character == *digit)
            .expect("validated number-base digit");
        let width = if config.remainder_bits > 0 && index == config.digits - 1 {
            usize::from(config.remainder_bits)
        } else {
            usize::from(config.bits_per_digit)
        };
        bits.push_str(&format!("{value:0width$b}"));
    }
    bits.truncate(config.entropy_bits);
    bits
}

fn bits_value(bits: &[u8]) -> usize {
    bits.iter().fold(0usize, |value, bit| {
        (value << 1) + usize::from(*bit == b'1')
    })
}

fn preview_words(bits: &str, target_words: u8) -> Result<Vec<String>, EntropyStudioError> {
    let complete_word_count = (bits.len() / 11).min(usize::from(target_words.saturating_sub(1)));
    let mut words = Vec::with_capacity(complete_word_count);

    for chunk in bits.as_bytes().chunks(11).take(complete_word_count) {
        let index = chunk.iter().fold(0usize, |value, bit| {
            (value << 1) + usize::from(*bit == b'1')
        });
        words.push(bip39_word(index)?);
    }

    Ok(words)
}

fn bits_to_bytes(bits: &str) -> Vec<u8> {
    bits.as_bytes()
        .chunks_exact(8)
        .map(|chunk| {
            chunk.iter().fold(0u8, |value, bit| {
                (value << 1) + u8::from(*bit == b'1')
            })
        })
        .collect()
}