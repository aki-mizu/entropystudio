use crate::bip39::{bip39_word, entropy_to_mnemonic, mnemonic_to_entropy};
use crate::cards::{
    card_transcript_to_entropy, hashed_card_state, is_card_separator, CardHashMethod,
};
use crate::direct_dice::{direct_dice_input_state, DirectDiceMethod};
use crate::error::EntropyStudioError;
use crate::hashed_dice::{
    dice_entropy_length, dice_rolls_to_entropy, hashed_dice_state, is_dice_separator,
    DiceRollMethod,
};
use crate::number_bases::{number_base_bits, number_base_value_from_bits, NumberBaseFormat};
use crate::private_key::{private_key_entropy, PrivateKeyFormat};
use crate::seed_phrase::{seed_phrase_state, seed_phrase_words_to_numbers, SeedPhraseInputMethod};
use crate::wipe::{wipe_bytes, wipe_string};

const MINIMUM_ENTROPY_BITS: u16 = 128;

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum EntropySyncSource {
    DiceColdcard,
    DiceColeman,
    DiceBitbox,
    DiceD8D16,
    CardsHashedAscii,
    CardsHashedColeman,
    CardsDirect,
    NumberBaseBin,
    NumberBaseBase4,
    NumberBaseBase8,
    NumberBaseHex,
    NumberBaseBase32,
    NumberBaseBase64,
    SeedWords,
    SeedNumbers,
    PrivateKeyWif,
    PrivateKeyHex,
    PrivateKeyMiniKey,
    PrivateKeyBrainWallet,
}

#[derive(Debug, uniffi::Record)]
pub struct EntropySyncSnapshot {
    pub bit_count: u16,
    pub effective_entropy_bits: u16,
    pub entropy_strength_unknown: bool,
    pub entropy_below_minimum: bool,
    pub minimum_entropy_bits: u16,
    pub bin: String,
    pub base4: String,
    pub base8: String,
    pub hex: String,
    pub base32: String,
    pub base64: String,
    pub seed_words: String,
    pub seed_numbers_zero_indexed: String,
    pub seed_numbers_one_indexed: String,
    pub bitbox_dice: String,
    pub d8_d16_dice: String,
    pub direct_cards: String,
    pub hex_private_key: String,
    pub wif_private_key: String,
}

#[uniffi::export]
pub fn synchronize_entropy(
    mut value: String,
    source: EntropySyncSource,
    target_words: u8,
    zero_indexed: bool,
    mut selected_final_word: String,
) -> Result<EntropySyncSnapshot, EntropyStudioError> {
    let mut bits = String::new();
    let result = (|| {
        bits = source_bits(
            &value,
            source,
            target_words,
            zero_indexed,
            &selected_final_word,
        )?;
        let mut snapshot = snapshot_from_bits(&bits, target_words)?;
        let (effective_entropy_bits, entropy_strength_unknown) = effective_entropy_strength(
            &value,
            source,
            target_words,
            usize::from(snapshot.bit_count),
        )?;
        snapshot.effective_entropy_bits = effective_entropy_bits;
        snapshot.entropy_strength_unknown = entropy_strength_unknown;
        snapshot.entropy_below_minimum =
            !entropy_strength_unknown && effective_entropy_bits < MINIMUM_ENTROPY_BITS;
        preserve_source_value(&mut snapshot, source, &value, zero_indexed);
        Ok(snapshot)
    })();
    wipe_string(&mut bits);
    wipe_string(&mut value);
    wipe_string(&mut selected_final_word);
    result
}

fn effective_entropy_strength(
    value: &str,
    source: EntropySyncSource,
    target_words: u8,
    bit_count: usize,
) -> Result<(u16, bool), EntropyStudioError> {
    let source_bits = match source {
        EntropySyncSource::DiceColdcard | EntropySyncSource::DiceColeman => {
            hashed_dice_state(value.to_owned(), target_words)?
                .estimated_entropy_bits
                .floor() as usize
        }
        EntropySyncSource::CardsHashedAscii | EntropySyncSource::CardsHashedColeman => {
            hashed_card_state(value.to_owned(), target_words)?
                .entropy_bits
                .floor() as usize
        }
        EntropySyncSource::PrivateKeyMiniKey => {
            (value.trim().len().saturating_sub(1) as f64 * 58_f64.log2()).floor() as usize
        }
        EntropySyncSource::PrivateKeyBrainWallet => {
            return Ok((bit_count as u16, true));
        }
        EntropySyncSource::DiceBitbox
        | EntropySyncSource::DiceD8D16
        | EntropySyncSource::CardsDirect
        | EntropySyncSource::NumberBaseBin
        | EntropySyncSource::NumberBaseBase4
        | EntropySyncSource::NumberBaseBase8
        | EntropySyncSource::NumberBaseHex
        | EntropySyncSource::NumberBaseBase32
        | EntropySyncSource::NumberBaseBase64
        | EntropySyncSource::SeedWords
        | EntropySyncSource::SeedNumbers
        | EntropySyncSource::PrivateKeyWif
        | EntropySyncSource::PrivateKeyHex => bit_count,
    };

    Ok((source_bits.min(bit_count) as u16, false))
}

fn source_bits(
    value: &str,
    source: EntropySyncSource,
    target_words: u8,
    zero_indexed: bool,
    selected_final_word: &str,
) -> Result<String, EntropyStudioError> {
    if value.is_empty() {
        return if source_is_hashed(source) {
            Err(EntropyStudioError::InvalidEntropy)
        } else {
            Ok(String::new())
        };
    }

    match source {
        EntropySyncSource::DiceColdcard => {
            hashed_dice_bits(value, DiceRollMethod::Coldcard, target_words)
        }
        EntropySyncSource::DiceColeman => {
            hashed_dice_bits(value, DiceRollMethod::Coleman, target_words)
        }
        EntropySyncSource::DiceBitbox => bitbox_bits(value, target_words, selected_final_word),
        EntropySyncSource::DiceD8D16 => d8_d16_bits(value, target_words),
        EntropySyncSource::CardsHashedAscii => {
            hashed_card_bits(value, CardHashMethod::Ascii, target_words)
        }
        EntropySyncSource::CardsHashedColeman => {
            hashed_card_bits(value, CardHashMethod::Coleman, target_words)
        }
        EntropySyncSource::CardsDirect => direct_card_bits(value, target_words),
        EntropySyncSource::NumberBaseBin => {
            number_base_bits(value, NumberBaseFormat::Bin, target_words)
        }
        EntropySyncSource::NumberBaseBase4 => {
            number_base_bits(value, NumberBaseFormat::Base4, target_words)
        }
        EntropySyncSource::NumberBaseBase8 => {
            number_base_bits(value, NumberBaseFormat::Base8, target_words)
        }
        EntropySyncSource::NumberBaseHex => {
            number_base_bits(value, NumberBaseFormat::Hex, target_words)
        }
        EntropySyncSource::NumberBaseBase32 => {
            number_base_bits(value, NumberBaseFormat::Base32, target_words)
        }
        EntropySyncSource::NumberBaseBase64 => {
            number_base_bits(value, NumberBaseFormat::Base64, target_words)
        }
        EntropySyncSource::SeedWords => seed_bits(
            value,
            SeedPhraseInputMethod::Words,
            target_words,
            zero_indexed,
        ),
        EntropySyncSource::SeedNumbers => seed_bits(
            value,
            SeedPhraseInputMethod::Numbers,
            target_words,
            zero_indexed,
        ),
        EntropySyncSource::PrivateKeyWif => private_key_bits(value, PrivateKeyFormat::Wif),
        EntropySyncSource::PrivateKeyHex => private_key_hex_bits(value),
        EntropySyncSource::PrivateKeyMiniKey => private_key_bits(value, PrivateKeyFormat::MiniKey),
        EntropySyncSource::PrivateKeyBrainWallet => {
            private_key_bits(value, PrivateKeyFormat::BrainWallet)
        }
    }
}

fn source_is_hashed(source: EntropySyncSource) -> bool {
    matches!(
        source,
        EntropySyncSource::DiceColdcard
            | EntropySyncSource::DiceColeman
            | EntropySyncSource::CardsHashedAscii
            | EntropySyncSource::CardsHashedColeman
            | EntropySyncSource::PrivateKeyMiniKey
            | EntropySyncSource::PrivateKeyBrainWallet
    )
}

fn hashed_dice_bits(
    value: &str,
    method: DiceRollMethod,
    target_words: u8,
) -> Result<String, EntropyStudioError> {
    let mut entropy = dice_rolls_to_entropy(value.to_owned(), method, target_words)?;
    let bits = bytes_to_bits(&entropy);
    wipe_bytes(&mut entropy);
    Ok(bits)
}

fn hashed_card_bits(
    value: &str,
    method: CardHashMethod,
    target_words: u8,
) -> Result<String, EntropyStudioError> {
    let mut entropy = card_transcript_to_entropy(value.to_owned(), method, target_words)?;
    let bits = bytes_to_bits(&entropy);
    wipe_bytes(&mut entropy);
    Ok(bits)
}

fn bitbox_bits(
    value: &str,
    target_words: u8,
    selected_final_word: &str,
) -> Result<String, EntropyStudioError> {
    let state = direct_dice_input_state(
        value.to_owned(),
        DirectDiceMethod::Bitbox,
        target_words,
        selected_final_word.to_owned(),
    )?;
    if state.can_derive {
        let mut entropy = mnemonic_to_entropy(state.mnemonic)?;
        let bits = bytes_to_bits(&entropy);
        wipe_bytes(&mut entropy);
        return Ok(bits);
    }

    let partial_words = usize::from(target_words - 1);
    let mut bits = String::new();
    let mut position = 0;
    let mut words = 0;

    for character in value.chars() {
        if is_dice_separator(character) {
            continue;
        }
        if !matches!(character, '1'..='6') || words >= partial_words {
            break;
        }

        let face = character as u8 - b'0';
        if position < 5 {
            if face > 4 {
                continue;
            }
            push_bits(&mut bits, usize::from(face - 1), 2);
            position += 1;
        } else {
            bits.push(if face <= 3 { '0' } else { '1' });
            position = 0;
            words += 1;
        }
    }

    Ok(bits)
}

#[derive(Clone, Copy)]
enum D8D16Step {
    D8,
    D16,
    Coin,
}

fn d8_d16_bits(value: &str, target_words: u8) -> Result<String, EntropyStudioError> {
    let steps = d8_d16_steps(target_words)?;
    let mut bits = String::new();

    for (index, character) in value
        .chars()
        .filter(|character| !is_dice_separator(*character))
        .map(|character| character.to_ascii_uppercase())
        .take(steps.len())
        .enumerate()
    {
        let step = steps[index];
        let Some(value) = d8_d16_value(step, character) else {
            break;
        };
        push_bits(&mut bits, value, d8_d16_width(step));
    }

    Ok(bits)
}

fn d8_d16_steps(target_words: u8) -> Result<Vec<D8D16Step>, EntropyStudioError> {
    let entropy_bits = target_entropy_bits(target_words)?;
    let mut steps = Vec::with_capacity(entropy_bits / 3);
    for _ in 0..target_words - 1 {
        steps.extend([D8D16Step::D8, D8D16Step::D16, D8D16Step::D16]);
    }
    steps.extend(match target_words {
        12 => [D8D16Step::D8, D8D16Step::D16].as_slice(),
        15 => [D8D16Step::D8, D8D16Step::D8].as_slice(),
        18 => [D8D16Step::D16, D8D16Step::Coin].as_slice(),
        21 => [D8D16Step::D16].as_slice(),
        24 => [D8D16Step::D8].as_slice(),
        _ => return Err(EntropyStudioError::UnsupportedDiceWordCount),
    });
    Ok(steps)
}

fn d8_d16_value(step: D8D16Step, face: char) -> Option<usize> {
    match step {
        D8D16Step::D8 => matches!(face, '1'..='8').then(|| face as usize - '1' as usize),
        D8D16Step::D16 => match face {
            '0'..='9' => Some(face as usize - '0' as usize),
            'A'..='F' => Some(face as usize - 'A' as usize + 10),
            _ => None,
        },
        D8D16Step::Coin => match face {
            '1'..='4' => Some(0),
            '5'..='8' => Some(1),
            _ => None,
        },
    }
}

fn d8_d16_width(step: D8D16Step) -> usize {
    match step {
        D8D16Step::D8 => 3,
        D8D16Step::D16 => 4,
        D8D16Step::Coin => 1,
    }
}

fn direct_card_bits(value: &str, target_words: u8) -> Result<String, EntropyStudioError> {
    target_entropy_bits(target_words)?;
    let partial_words = usize::from(target_words - 1);
    let final_radices = direct_card_final_radices(target_words)?;
    let full_word_draws = partial_words * 4;
    let mut bits = String::new();

    for (position, rank) in value
        .chars()
        .filter(|character| !is_card_separator(*character))
        .map(|character| character.to_ascii_uppercase())
        .take(full_word_draws + final_radices.len())
        .enumerate()
    {
        let radix = if position < full_word_draws {
            if position % 4 == 3 {
                4
            } else {
                8
            }
        } else {
            usize::from(final_radices[position - full_word_draws])
        };
        let value = match rank {
            'A' => 0,
            '2'..='8' => rank as usize - '2' as usize + 1,
            _ => break,
        };
        if value >= radix {
            break;
        }
        push_bits(&mut bits, value, radix.ilog2() as usize);
    }

    Ok(bits)
}

fn direct_card_final_radices(target_words: u8) -> Result<&'static [u8], EntropyStudioError> {
    match target_words {
        12 => Ok(&[8, 8, 2]),
        15 => Ok(&[8, 8]),
        18 => Ok(&[8, 4]),
        21 => Ok(&[8, 2]),
        24 => Ok(&[8]),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

fn seed_bits(
    value: &str,
    method: SeedPhraseInputMethod,
    target_words: u8,
    zero_indexed: bool,
) -> Result<String, EntropyStudioError> {
    let state = seed_phrase_state(value.to_owned(), method, target_words, zero_indexed)?;
    if state.invalid_position > 0 || state.extra_count > 0 {
        return Err(EntropyStudioError::InvalidMnemonic);
    }
    if state.can_derive {
        let mut entropy = mnemonic_to_entropy(state.phrase)?;
        let bits = bytes_to_bits(&entropy);
        wipe_bytes(&mut entropy);
        return Ok(bits);
    }
    if state.entered_count == u32::from(target_words) {
        return Err(EntropyStudioError::InvalidMnemonic);
    }

    words_to_bits(&state.words)
}

fn words_to_bits(words: &[String]) -> Result<String, EntropyStudioError> {
    if words.is_empty() {
        return Ok(String::new());
    }

    let mut values = seed_phrase_words_to_numbers(words.join(" "), true);
    let result = values
        .split_whitespace()
        .try_fold(String::new(), |mut bits, value| {
            let index = value
                .parse::<usize>()
                .map_err(|_| EntropyStudioError::InvalidMnemonic)?;
            push_bits(&mut bits, index, 11);
            Ok(bits)
        });
    wipe_string(&mut values);
    result
}

fn private_key_bits(value: &str, format: PrivateKeyFormat) -> Result<String, EntropyStudioError> {
    let mut entropy = private_key_entropy(value.to_owned(), format)?;
    let bits = bytes_to_bits(&entropy);
    wipe_bytes(&mut entropy);
    Ok(bits)
}

fn private_key_hex_bits(value: &str) -> Result<String, EntropyStudioError> {
    let mut compact: String = value
        .chars()
        .filter(|character| !character.is_whitespace())
        .collect();
    let digits = compact
        .strip_prefix("0x")
        .or_else(|| compact.strip_prefix("0X"))
        .unwrap_or(&compact);
    let mut bits = String::new();

    for character in digits.chars().take(64) {
        let Some(value) = character.to_digit(16) else {
            break;
        };
        push_bits(&mut bits, value as usize, 4);
    }

    wipe_string(&mut compact);
    Ok(bits)
}

fn snapshot_from_bits(
    bits: &str,
    target_words: u8,
) -> Result<EntropySyncSnapshot, EntropyStudioError> {
    let entropy_bits = target_entropy_bits(target_words)?;
    if !bits.bytes().all(|bit| matches!(bit, b'0' | b'1')) {
        return Err(EntropyStudioError::InvalidEntropy);
    }
    let source = &bits[..bits.len().min(entropy_bits)];
    let (seed_words, seed_numbers_zero_indexed, seed_numbers_one_indexed) =
        seed_values(source, target_words, entropy_bits)?;

    Ok(EntropySyncSnapshot {
        bit_count: source.len() as u16,
        effective_entropy_bits: source.len() as u16,
        entropy_strength_unknown: false,
        entropy_below_minimum: false,
        minimum_entropy_bits: MINIMUM_ENTROPY_BITS,
        bin: number_base_value_from_bits(source, NumberBaseFormat::Bin, target_words)?,
        base4: number_base_value_from_bits(source, NumberBaseFormat::Base4, target_words)?,
        base8: number_base_value_from_bits(source, NumberBaseFormat::Base8, target_words)?,
        hex: number_base_value_from_bits(source, NumberBaseFormat::Hex, target_words)?,
        base32: number_base_value_from_bits(source, NumberBaseFormat::Base32, target_words)?,
        base64: number_base_value_from_bits(source, NumberBaseFormat::Base64, target_words)?,
        seed_words,
        seed_numbers_zero_indexed,
        seed_numbers_one_indexed,
        bitbox_dice: bitbox_value(source, target_words)?,
        d8_d16_dice: d8_d16_value_string(source, target_words)?,
        direct_cards: direct_card_value(source, target_words)?,
        hex_private_key: hex_private_key_value(source),
        wif_private_key: wif_private_key_value(source),
    })
}

fn target_entropy_bits(target_words: u8) -> Result<usize, EntropyStudioError> {
    Ok(dice_entropy_length(target_words)? * 8)
}

fn seed_values(
    bits: &str,
    target_words: u8,
    entropy_bits: usize,
) -> Result<(String, String, String), EntropyStudioError> {
    if bits.len() == entropy_bits {
        let entropy = bits_to_bytes(bits);
        let phrase = entropy_to_mnemonic(entropy)?;
        let zero_indexed = seed_phrase_words_to_numbers(phrase.clone(), true);
        let one_indexed = zero_indexed
            .split_whitespace()
            .map(|value| {
                value
                    .parse::<usize>()
                    .map(|index| (index + 1).to_string())
                    .map_err(|_| EntropyStudioError::InvalidEntropy)
            })
            .collect::<Result<Vec<_>, _>>()?
            .join(" ");
        return Ok((phrase, zero_indexed, one_indexed));
    }

    let mut words = Vec::new();
    let mut zero_indices = Vec::new();
    for chunk in bits
        .as_bytes()
        .chunks_exact(11)
        .take(usize::from(target_words - 1))
    {
        let index = bits_value(chunk);
        words.push(bip39_word(index)?);
        zero_indices.push(index);
    }
    let zero_indexed = zero_indices
        .iter()
        .map(usize::to_string)
        .collect::<Vec<_>>()
        .join(" ");
    let one_indexed = zero_indices
        .iter()
        .map(|index| (index + 1).to_string())
        .collect::<Vec<_>>()
        .join(" ");

    Ok((words.join(" "), zero_indexed, one_indexed))
}

fn bitbox_value(bits: &str, target_words: u8) -> Result<String, EntropyStudioError> {
    target_entropy_bits(target_words)?;
    let mut tokens = Vec::new();
    let mut offset = 0;

    for _ in 0..target_words - 1 {
        for position in 0..6 {
            let width = if position < 5 { 2 } else { 1 };
            if offset + width > bits.len() {
                return Ok(group_bitbox_tokens(&tokens));
            }
            let value = bits_value(&bits.as_bytes()[offset..offset + width]);
            tokens.push(if position < 5 {
                (value + 1).to_string()
            } else if value == 0 {
                "1".to_owned()
            } else {
                "4".to_owned()
            });
            offset += width;
        }
    }

    Ok(group_bitbox_tokens(&tokens))
}

fn group_bitbox_tokens(tokens: &[String]) -> String {
    tokens
        .iter()
        .enumerate()
        .map(|(index, token)| {
            if index > 0 && index % 6 == 0 {
                format!(" {token}")
            } else {
                token.clone()
            }
        })
        .collect()
}

fn d8_d16_value_string(bits: &str, target_words: u8) -> Result<String, EntropyStudioError> {
    let steps = d8_d16_steps(target_words)?;
    let partial_tokens = usize::from(target_words - 1) * 3;
    let mut value = String::new();
    let mut offset = 0;

    for (index, step) in steps.into_iter().enumerate() {
        let width = d8_d16_width(step);
        if offset + width > bits.len() {
            break;
        }
        if index > 0 && (index == partial_tokens || (index < partial_tokens && index % 3 == 0)) {
            value.push(' ');
        }
        let step_value = bits_value(&bits.as_bytes()[offset..offset + width]);
        value.push_str(&match step {
            D8D16Step::D8 => (step_value + 1).to_string(),
            D8D16Step::D16 => ("0123456789ABCDEF".as_bytes()[step_value] as char).to_string(),
            D8D16Step::Coin => {
                if step_value == 0 {
                    "1".to_owned()
                } else {
                    "5".to_owned()
                }
            }
        });
        offset += width;
    }

    Ok(value)
}

fn direct_card_value(bits: &str, target_words: u8) -> Result<String, EntropyStudioError> {
    target_entropy_bits(target_words)?;
    let partial_words = usize::from(target_words - 1);
    let final_radices = direct_card_final_radices(target_words)?;
    let full_word_draws = partial_words * 4;
    let mut value = String::new();
    let mut offset = 0;

    for position in 0..full_word_draws + final_radices.len() {
        let radix = if position < full_word_draws {
            if position % 4 == 3 {
                4
            } else {
                8
            }
        } else {
            usize::from(final_radices[position - full_word_draws])
        };
        let width = radix.ilog2() as usize;
        if offset + width > bits.len() {
            break;
        }
        if position > 0
            && ((position < full_word_draws && position % 4 == 0) || position == full_word_draws)
        {
            value.push(' ');
        }
        let rank = b"A2345678"[bits_value(&bits.as_bytes()[offset..offset + width])] as char;
        value.push(rank);
        offset += width;
    }

    Ok(value)
}

fn hex_private_key_value(bits: &str) -> String {
    bits.as_bytes()
        .chunks_exact(4)
        .map(|chunk| char::from_digit(bits_value(chunk) as u32, 16).expect("valid hex value"))
        .collect()
}

fn wif_private_key_value(bits: &str) -> String {
    if bits.len() < 256 {
        return String::new();
    }

    let mut entropy = bits_to_bytes(&bits[..256]);
    if entropy.len() != 32 || unsafe { entropylab_wasm::secp_seckey_valid(entropy.as_ptr()) } != 1 {
        wipe_bytes(&mut entropy);
        return String::new();
    }

    let mut payload = [0u8; 34];
    payload[0] = 0x80;
    payload[1..33].copy_from_slice(&entropy);
    payload[33] = 1;
    let mut encoded = [0u8; 64];
    let length = unsafe {
        entropylab_wasm::el_b58check_encode(
            payload.as_ptr(),
            payload.len(),
            encoded.as_mut_ptr(),
            encoded.len(),
        )
    };
    let result = usize::try_from(length)
        .ok()
        .filter(|length| *length <= encoded.len())
        .and_then(|length| std::str::from_utf8(&encoded[..length]).ok())
        .map(str::to_owned)
        .unwrap_or_default();
    wipe_bytes(&mut entropy);
    wipe_bytes(&mut payload);
    wipe_bytes(&mut encoded);
    result
}

fn preserve_source_value(
    snapshot: &mut EntropySyncSnapshot,
    source: EntropySyncSource,
    value: &str,
    zero_indexed: bool,
) {
    match source {
        EntropySyncSource::DiceBitbox => snapshot.bitbox_dice = value.to_owned(),
        EntropySyncSource::DiceD8D16 => snapshot.d8_d16_dice = value.to_owned(),
        EntropySyncSource::CardsDirect => snapshot.direct_cards = value.to_owned(),
        EntropySyncSource::NumberBaseBin => snapshot.bin = value.to_owned(),
        EntropySyncSource::NumberBaseBase4 => snapshot.base4 = value.to_owned(),
        EntropySyncSource::NumberBaseBase8 => snapshot.base8 = value.to_owned(),
        EntropySyncSource::NumberBaseHex => snapshot.hex = value.to_owned(),
        EntropySyncSource::NumberBaseBase32 => snapshot.base32 = value.to_owned(),
        EntropySyncSource::NumberBaseBase64 => snapshot.base64 = value.to_owned(),
        EntropySyncSource::SeedWords => snapshot.seed_words = value.to_owned(),
        EntropySyncSource::SeedNumbers if zero_indexed => {
            snapshot.seed_numbers_zero_indexed = value.to_owned()
        }
        EntropySyncSource::SeedNumbers => snapshot.seed_numbers_one_indexed = value.to_owned(),
        EntropySyncSource::PrivateKeyWif => snapshot.wif_private_key = value.to_owned(),
        EntropySyncSource::PrivateKeyHex => snapshot.hex_private_key = value.to_owned(),
        EntropySyncSource::DiceColdcard
        | EntropySyncSource::DiceColeman
        | EntropySyncSource::CardsHashedAscii
        | EntropySyncSource::CardsHashedColeman
        | EntropySyncSource::PrivateKeyMiniKey
        | EntropySyncSource::PrivateKeyBrainWallet => {}
    }
}

fn bytes_to_bits(bytes: &[u8]) -> String {
    let mut bits = String::with_capacity(bytes.len() * 8);
    for byte in bytes {
        push_bits(&mut bits, usize::from(*byte), 8);
    }
    bits
}

fn bits_to_bytes(bits: &str) -> Vec<u8> {
    bits.as_bytes()
        .chunks_exact(8)
        .map(bits_value)
        .map(|value| value as u8)
        .collect()
}

fn bits_value(bits: &[u8]) -> usize {
    bits.iter().fold(0usize, |value, bit| {
        (value << 1) + usize::from(*bit == b'1')
    })
}

fn push_bits(bits: &mut String, value: usize, width: usize) {
    for shift in (0..width).rev() {
        bits.push(if value & (1 << shift) == 0 { '0' } else { '1' });
    }
}
