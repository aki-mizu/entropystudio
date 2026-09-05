use std::sync::OnceLock;

use crate::bip39::{bip39_entropy_bytes, bip39_word, mnemonic_to_entropy};
use crate::error::EntropyStudioError;
use crate::hash::sha256;
use crate::wipe::{wipe_bytes, wipe_string};

const BIP39_WORD_COUNT: usize = 2048;

static BIP39_WORDS: OnceLock<Vec<String>> = OnceLock::new();

#[derive(Debug, uniffi::Record)]
pub struct Bip39PassphraseState {
    pub can_derive: bool,
    pub complete_words: u32,
    pub incomplete: bool,
    pub invalid_count: u32,
    pub trailing_separator: bool,
}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum SeedPhraseInputMethod {
    Words,
    Numbers,
}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum SeedPhraseStatus {
    Remaining,
    Extra,
    ChooseFinal,
    Ready,
    FinalPrefix,
    NoFinalPrefix,
    InvalidWord,
    InvalidNumber,
    ChecksumInvalid,
}

#[derive(Debug, uniffi::Record)]
pub struct SeedPhraseState {
    pub normalized_input: String,
    pub words: Vec<String>,
    pub phrase: String,
    pub final_candidates: Vec<String>,
    pub status: SeedPhraseStatus,
    pub can_derive: bool,
    pub entered_count: u32,
    pub extra_count: u32,
    pub invalid_position: u32,
    pub invalid_token: String,
    pub matching_final_candidates: u32,
    pub minimum_number: u16,
    pub maximum_number: u16,
    pub remaining_count: u32,
}

#[derive(Debug, uniffi::Record)]
pub struct SeedPhraseAutocompleteResult {
    pub cursor: u32,
    pub value: String,
}

#[uniffi::export]
pub fn bip39_passphrase_state(
    mut value: String,
    active_caret: Option<u32>,
) -> Bip39PassphraseState {
    let result = analyze_bip39_passphrase(&value, active_caret);
    wipe_string(&mut value);
    result
}

#[uniffi::export]
pub fn bip39_passphrase_key_allowed(
    mut value: String,
    selection_start: u32,
    selection_end: u32,
    mut character: String,
) -> bool {
    let result = if character.len() != 1 || !character.as_bytes()[0].is_ascii_lowercase() {
        false
    } else {
        let (start, end) = selection_bounds(&value, selection_start, selection_end);
        let mut candidate = replace_selection(&value, start, end, &character);
        let allowed = analyze_bip39_passphrase(&candidate, Some((start + character.len()) as u32))
            .invalid_count
            == 0;
        wipe_string(&mut candidate);
        allowed
    };
    wipe_string(&mut value);
    wipe_string(&mut character);
    result
}

#[uniffi::export]
pub fn bip39_passphrase_space_allowed(
    mut value: String,
    selection_start: u32,
    selection_end: u32,
) -> bool {
    let (start, end) = selection_bounds(&value, selection_start, selection_end);
    let mut candidate = replace_selection(&value, start, end, " ");
    let state = analyze_bip39_passphrase(&candidate, None);
    let allowed = state.invalid_count == 0
        && state.complete_words > 0
        && state.complete_words == passphrase_tokens(&candidate).len() as u32;
    wipe_string(&mut candidate);
    wipe_string(&mut value);
    allowed
}

#[uniffi::export]
pub fn bip39_passphrase_autocomplete(
    mut value: String,
    cursor: u32,
    enabled: bool,
) -> SeedPhraseAutocompleteResult {
    let result = autocomplete_bip39_passphrase(&value, cursor, enabled);
    wipe_string(&mut value);
    result
}

struct ParsedNumber {
    index: Option<usize>,
    token: String,
}

#[uniffi::export]
pub fn seed_phrase_state(
    value: String,
    method: SeedPhraseInputMethod,
    target_words: u8,
    zero_indexed: bool,
) -> Result<SeedPhraseState, EntropyStudioError> {
    match method {
        SeedPhraseInputMethod::Words => analyze_words(&value, target_words),
        SeedPhraseInputMethod::Numbers => analyze_numbers(&value, target_words, zero_indexed),
    }
}

#[uniffi::export]
pub fn seed_phrase_key_allowed(
    mut value: String,
    selection_start: u32,
    selection_end: u32,
    mut character: String,
    method: SeedPhraseInputMethod,
    target_words: u8,
    zero_indexed: bool,
) -> Result<bool, EntropyStudioError> {
    let result = match method {
        SeedPhraseInputMethod::Words => word_key_allowed(
            &value,
            selection_start,
            selection_end,
            &character,
            target_words,
        ),
        SeedPhraseInputMethod::Numbers => number_key_allowed(
            &value,
            selection_start,
            selection_end,
            &character,
            target_words,
            zero_indexed,
        ),
    };
    wipe_string(&mut value);
    wipe_string(&mut character);
    result
}

#[uniffi::export]
pub fn seed_phrase_space_allowed(
    mut value: String,
    selection_start: u32,
    selection_end: u32,
    method: SeedPhraseInputMethod,
    target_words: u8,
    zero_indexed: bool,
) -> Result<bool, EntropyStudioError> {
    let result = match method {
        SeedPhraseInputMethod::Words => {
            validate_target_words(target_words)?;
            let normalized = normalize_word_input(&value);
            let (start, end) = selection_bounds(&normalized, selection_start, selection_end);
            Ok(start == end
                && end == normalized.len()
                && end > 0
                && !normalized.ends_with(' ')
                && input_words(&normalized).len() < usize::from(target_words)
                && input_words(&normalized)
                    .iter()
                    .all(|word| word_index(word).is_some()))
        }
        SeedPhraseInputMethod::Numbers => {
            let state = analyze_numbers(&value, target_words, zero_indexed)?;
            Ok(!state.normalized_input.is_empty()
                && !state.normalized_input.ends_with(' ')
                && state.entered_count < u32::from(target_words)
                && state.invalid_position == 0)
        }
    };
    wipe_string(&mut value);
    result
}

#[uniffi::export]
pub fn seed_phrase_autocomplete(
    mut value: String,
    cursor: u32,
    target_words: u8,
    enabled: bool,
) -> Result<SeedPhraseAutocompleteResult, EntropyStudioError> {
    let result = autocomplete_word_input(&value, cursor, target_words, enabled);
    wipe_string(&mut value);
    result
}

#[uniffi::export]
pub fn seed_phrase_words_to_numbers(mut value: String, zero_indexed: bool) -> String {
    let mut normalized = normalize_word_input(&value);
    let mut words = input_words(&normalized);
    let result = if words.is_empty() {
        String::new()
    } else {
        words
            .iter()
            .map(|word| word_index(word).map(|index| index + if zero_indexed { 0 } else { 1 }))
            .collect::<Option<Vec<_>>>()
            .map(|indices| {
                indices
                    .into_iter()
                    .map(|index| index.to_string())
                    .collect::<Vec<_>>()
                    .join(" ")
            })
            .unwrap_or_default()
    };
    wipe_strings(&mut words);
    wipe_string(&mut normalized);
    wipe_string(&mut value);
    result
}

#[uniffi::export]
pub fn seed_phrase_numbers_to_words(
    mut value: String,
    target_words: u8,
    zero_indexed: bool,
) -> Result<String, EntropyStudioError> {
    let result = analyze_numbers(&value, target_words, zero_indexed).map(|state| {
        if state.invalid_position == 0 && state.extra_count == 0 && state.entered_count > 0 {
            state.words.join(" ")
        } else {
            String::new()
        }
    });
    wipe_string(&mut value);
    result
}

#[uniffi::export]
pub fn translate_seed_number_indices(
    mut value: String,
    from_zero_indexed: bool,
    to_zero_indexed: bool,
) -> String {
    let mut translated = String::with_capacity(value.len());
    let mut token = String::new();
    for character in value.chars() {
        if character.is_ascii_digit() {
            token.push(character);
            continue;
        }
        translate_number_token(&mut translated, &token, from_zero_indexed, to_zero_indexed);
        token.clear();
        translated.push(character);
    }
    translate_number_token(&mut translated, &token, from_zero_indexed, to_zero_indexed);
    wipe_string(&mut token);
    wipe_string(&mut value);
    translated
}

fn analyze_words(value: &str, target_words: u8) -> Result<SeedPhraseState, EntropyStudioError> {
    validate_target_words(target_words)?;
    let normalized_input = normalize_word_input(value);
    let words = input_words(&normalized_input);
    let target = usize::from(target_words);
    let entered_count = words.len() as u32;
    let extra_count = words.len().saturating_sub(target) as u32;
    let first_invalid = words
        .iter()
        .enumerate()
        .find(|(_, word)| word_index(word).is_none())
        .map(|(position, word)| (position, word.clone()));
    let prefix_indices = words
        .iter()
        .take(target.saturating_sub(1))
        .map(|word| word_index(word))
        .collect::<Option<Vec<_>>>()
        .filter(|indices| indices.len() == target.saturating_sub(1));
    let final_candidates = match prefix_indices.as_deref() {
        Some(indices) => final_word_candidates(indices, target_words)?,
        None => Vec::new(),
    };
    let phrase = if words.len() == target && first_invalid.is_none() {
        words.join(" ")
    } else {
        String::new()
    };
    let can_derive = !phrase.is_empty() && valid_mnemonic(&phrase);
    let final_word = words
        .get(target.saturating_sub(1))
        .map(String::as_str)
        .unwrap_or_default();
    let matching_final_candidates = if final_word.is_empty() {
        0
    } else {
        final_candidates
            .iter()
            .filter(|candidate| candidate.starts_with(final_word))
            .count() as u32
    };
    let status = word_status(
        &normalized_input,
        &words,
        target,
        extra_count,
        first_invalid.as_ref(),
        prefix_indices.is_some(),
        final_word,
        matching_final_candidates,
        can_derive,
    );
    let (invalid_position, invalid_token) = first_invalid
        .map(|(position, word)| (position as u32 + 1, word))
        .unwrap_or((0, String::new()));

    Ok(SeedPhraseState {
        normalized_input,
        words: words.into_iter().take(target).collect(),
        phrase,
        final_candidates,
        status,
        can_derive,
        entered_count,
        extra_count,
        invalid_position,
        invalid_token,
        matching_final_candidates,
        minimum_number: 1,
        maximum_number: BIP39_WORD_COUNT as u16,
        remaining_count: target.saturating_sub(entered_count as usize) as u32,
    })
}

fn analyze_numbers(
    value: &str,
    target_words: u8,
    zero_indexed: bool,
) -> Result<SeedPhraseState, EntropyStudioError> {
    validate_target_words(target_words)?;
    let normalized_input = normalize_number_input(value);
    let entries = input_words(&normalized_input)
        .into_iter()
        .map(|token| ParsedNumber {
            index: parse_number_index(&token, zero_indexed),
            token,
        })
        .collect::<Vec<_>>();
    let target = usize::from(target_words);
    let entered_count = entries.len() as u32;
    let extra_count = entries.len().saturating_sub(target) as u32;
    let first_invalid = entries
        .iter()
        .enumerate()
        .find(|(_, entry)| entry.index.is_none())
        .map(|(position, entry)| (position, entry.token.clone()));
    let words = entries
        .iter()
        .take(target)
        .map(|entry| entry.index.and_then(word_at).unwrap_or_default())
        .collect::<Vec<_>>();
    let phrase = if entries.len() == target && first_invalid.is_none() {
        words.join(" ")
    } else {
        String::new()
    };
    let can_derive = !phrase.is_empty() && valid_mnemonic(&phrase);
    let status = if extra_count > 0 {
        SeedPhraseStatus::Extra
    } else if first_invalid.is_some() {
        SeedPhraseStatus::InvalidNumber
    } else if !phrase.is_empty() && !can_derive {
        SeedPhraseStatus::ChecksumInvalid
    } else if can_derive {
        SeedPhraseStatus::Ready
    } else {
        SeedPhraseStatus::Remaining
    };
    let (invalid_position, invalid_token) = first_invalid
        .map(|(position, token)| (position as u32 + 1, token))
        .unwrap_or((0, String::new()));

    Ok(SeedPhraseState {
        normalized_input,
        words,
        phrase,
        final_candidates: Vec::new(),
        status,
        can_derive,
        entered_count,
        extra_count,
        invalid_position,
        invalid_token,
        matching_final_candidates: 0,
        minimum_number: if zero_indexed { 0 } else { 1 },
        maximum_number: if zero_indexed {
            (BIP39_WORD_COUNT - 1) as u16
        } else {
            BIP39_WORD_COUNT as u16
        },
        remaining_count: target.saturating_sub(entered_count as usize) as u32,
    })
}

fn word_status(
    value: &str,
    words: &[String],
    target: usize,
    extra_count: u32,
    first_invalid: Option<&(usize, String)>,
    has_valid_final_prefix: bool,
    final_word: &str,
    matching_final_candidates: u32,
    can_derive: bool,
) -> SeedPhraseStatus {
    if extra_count > 0 {
        return SeedPhraseStatus::Extra;
    }
    if has_valid_final_prefix {
        if words.len() == target.saturating_sub(1) && value.ends_with(' ') {
            return SeedPhraseStatus::ChooseFinal;
        }
        if !final_word.is_empty() {
            if can_derive {
                return SeedPhraseStatus::Ready;
            }
            return if matching_final_candidates > 0 {
                SeedPhraseStatus::FinalPrefix
            } else {
                SeedPhraseStatus::NoFinalPrefix
            };
        }
    }
    if let Some((position, word)) = first_invalid {
        let active_position = (!value.ends_with(' ')).then(|| words.len().saturating_sub(1));
        if active_position == Some(*position) && word_has_prefix(word) {
            return SeedPhraseStatus::Remaining;
        }
        return SeedPhraseStatus::InvalidWord;
    }
    if can_derive {
        SeedPhraseStatus::Ready
    } else {
        SeedPhraseStatus::Remaining
    }
}

fn word_key_allowed(
    value: &str,
    selection_start: u32,
    selection_end: u32,
    character: &str,
    target_words: u8,
) -> Result<bool, EntropyStudioError> {
    validate_target_words(target_words)?;
    if character.len() != 1 || !character.as_bytes()[0].is_ascii_lowercase() {
        return Ok(false);
    }
    let normalized = normalize_word_input(value);
    let (start, end) = selection_bounds(&normalized, selection_start, selection_end);
    let mut candidate = replace_selection(&normalized, start, end, character);
    let caret = start + character.len();
    let tokens = word_tokens(&candidate);
    let target = usize::from(target_words);
    let allowed = if tokens.len() > target {
        false
    } else if let Some(token_index) = tokens
        .iter()
        .position(|token| token.start < caret && caret <= token.end)
    {
        if token_index >= target || tokens[..token_index].iter().any(|token| word_index(token.word).is_none()) {
            false
        } else if token_index == target.saturating_sub(1) {
            let prefix_indices = tokens[..token_index]
                .iter()
                .map(|token| word_index(token.word))
                .collect::<Option<Vec<_>>>();
            match prefix_indices {
                Some(indices) => final_word_candidates(&indices, target_words)?
                    .iter()
                    .any(|word| word.starts_with(tokens[token_index].word)),
                None => false,
            }
        } else {
            word_has_prefix(tokens[token_index].word)
        }
    } else {
        false
    };
    wipe_string(&mut candidate);
    Ok(allowed)
}

fn number_key_allowed(
    value: &str,
    selection_start: u32,
    selection_end: u32,
    character: &str,
    target_words: u8,
    zero_indexed: bool,
) -> Result<bool, EntropyStudioError> {
    if character.len() != 1 || !character.as_bytes()[0].is_ascii_digit() {
        return Ok(false);
    }
    let normalized = normalize_number_input(value);
    let (start, end) = selection_bounds(&normalized, selection_start, selection_end);
    let mut candidate = replace_selection(&normalized, start, end, character);
    let state = analyze_numbers(&candidate, target_words, zero_indexed)?;
    let allowed = state.invalid_position == 0 && state.extra_count == 0;
    wipe_string(&mut candidate);
    Ok(allowed)
}

fn autocomplete_word_input(
    value: &str,
    cursor: u32,
    target_words: u8,
    enabled: bool,
) -> Result<SeedPhraseAutocompleteResult, EntropyStudioError> {
    validate_target_words(target_words)?;
    let normalized = normalize_word_input(value);
    let (cursor, _) = selection_bounds(&normalized, cursor, cursor);
    if !enabled {
        return Ok(autocomplete_bip39_words(
            &normalized,
            cursor,
            false,
            2,
            bip39_words(),
        ));
    }
    let tokens = word_tokens(&normalized);
    let Some(token_index) = tokens
        .iter()
        .position(|token| token.start < cursor && cursor <= token.end)
    else {
        return Ok(unchanged_autocomplete(&normalized, cursor));
    };
    let target = usize::from(target_words);
    if token_index >= target || tokens[..token_index].iter().any(|token| word_index(token.word).is_none()) {
        return Ok(unchanged_autocomplete(&normalized, cursor));
    }
    let (minimum_prefix_length, final_candidates) = if token_index == target.saturating_sub(1) {
        let prefix_indices = tokens[..token_index]
            .iter()
            .map(|token| word_index(token.word))
            .collect::<Option<Vec<_>>>();
        let candidates = prefix_indices
            .map(|indices| final_word_candidates(&indices, target_words))
            .transpose()?
            .unwrap_or_default();
        (1, Some(candidates))
    } else {
        (2, None)
    };
    let result = if let Some(candidates) = final_candidates.as_deref() {
        autocomplete_bip39_words(
            &normalized,
            cursor,
            true,
            minimum_prefix_length,
            candidates,
        )
    } else {
        autocomplete_bip39_words(
            &normalized,
            cursor,
            true,
            minimum_prefix_length,
            bip39_words(),
        )
    };
    Ok(result)
}

fn analyze_bip39_passphrase(value: &str, active_caret: Option<u32>) -> Bip39PassphraseState {
    let tokens = passphrase_tokens(value);
    let active_caret = active_caret.map(|caret| selection_bounds(value, caret, caret).0);
    let mut complete_words = 0u32;
    let mut incomplete = false;
    let mut invalid_count = 0u32;

    for (index, token) in tokens.iter().enumerate() {
        let listed = word_index(token.word).is_some();
        let active = active_caret
            .map(|caret| token.start < caret && caret <= token.end)
            .unwrap_or(false);
        let prefix = active
            && token
                .word
                .bytes()
                .all(|character| character.is_ascii_lowercase())
            && word_has_prefix(token.word);
        if listed {
            complete_words += 1;
        } else if prefix {
            incomplete = true;
        } else {
            invalid_count += 1;
        }

        let gap_start = if index == 0 { 0 } else { tokens[index - 1].end };
        let gap = &value[gap_start..token.start];
        if !gap.is_empty() && (index == 0 || gap != " ") {
            invalid_count += 1;
        }
    }

    let suffix_start = tokens.last().map(|token| token.end).unwrap_or(0);
    let suffix = &value[suffix_start..];
    let trailing_separator = suffix == " ";
    if !suffix.is_empty()
        && !(tokens.len() > 0 && suffix == " " && complete_words == tokens.len() as u32)
    {
        invalid_count += 1;
    }

    Bip39PassphraseState {
        can_derive: invalid_count == 0 && !incomplete && !trailing_separator,
        complete_words,
        incomplete,
        invalid_count,
        trailing_separator,
    }
}

fn autocomplete_bip39_passphrase(
    value: &str,
    cursor: u32,
    enabled: bool,
) -> SeedPhraseAutocompleteResult {
    let (cursor, _) = selection_bounds(value, cursor, cursor);
    autocomplete_bip39_words(value, cursor, enabled, 2, bip39_words())
}

fn autocomplete_bip39_words(
    value: &str,
    cursor: usize,
    enabled: bool,
    minimum_prefix_length: usize,
    candidates: &[String],
) -> SeedPhraseAutocompleteResult {
    if !enabled {
        return unchanged_autocomplete(value, cursor);
    }
    let suffix = &value[cursor..];
    if !suffix.is_empty() && !suffix.chars().next().is_some_and(char::is_whitespace) {
        return unchanged_autocomplete(value, cursor);
    }
    let before_cursor = &value[..cursor];
    let prefix_start = before_cursor
        .char_indices()
        .rev()
        .find(|(_, character)| !character.is_ascii_alphabetic())
        .map(|(index, character)| index + character.len_utf8())
        .unwrap_or(0);
    if prefix_start == cursor {
        return unchanged_autocomplete(value, cursor);
    }
    let prefix = before_cursor[prefix_start..].to_ascii_lowercase();
    if prefix.len() < minimum_prefix_length {
        return unchanged_autocomplete(value, cursor);
    }
    let mut matching_words = candidates.iter().filter(|word| word.starts_with(&prefix));
    let Some(word) = matching_words.next() else {
        return unchanged_autocomplete(value, cursor);
    };
    if matching_words.next().is_some() {
        return unchanged_autocomplete(value, cursor);
    }
    let replacement = format!("{}{}", word, if suffix.is_empty() { " " } else { "" });
    let value = format!("{}{}{}", &value[..prefix_start], replacement, suffix);
    SeedPhraseAutocompleteResult {
        cursor: (prefix_start + replacement.len()) as u32,
        value,
    }
}

fn unchanged_autocomplete(value: &str, cursor: usize) -> SeedPhraseAutocompleteResult {
    SeedPhraseAutocompleteResult {
        cursor: cursor as u32,
        value: value.to_owned(),
    }
}

fn final_word_candidates(
    prefix_indices: &[usize],
    target_words: u8,
) -> Result<Vec<String>, EntropyStudioError> {
    let entropy_bits = bip39_entropy_bytes(target_words)? * 8;
    let checksum_bits = entropy_bits / 32;
    let suffix_bits = entropy_bits.saturating_sub(prefix_indices.len() * 11);
    let mut candidates = Vec::with_capacity(1usize << suffix_bits);

    for suffix in 0..(1usize << suffix_bits) {
        let entropy = entropy_from_prefix(prefix_indices, suffix, suffix_bits, entropy_bits);
        let mut digest = sha256(entropy);
        let checksum = digest
            .iter()
            .flat_map(|byte| (0..8).rev().map(move |shift| usize::from((byte >> shift) & 1)))
            .take(checksum_bits)
            .fold(0usize, |value, bit| (value << 1) | bit);
        wipe_bytes(&mut digest);
        candidates.push(bip39_word((suffix << checksum_bits) | checksum)?);
    }
    Ok(candidates)
}

fn entropy_from_prefix(
    prefix_indices: &[usize],
    suffix: usize,
    suffix_bits: usize,
    entropy_bits: usize,
) -> Vec<u8> {
    let mut entropy = vec![0u8; entropy_bits / 8];
    let mut offset = 0;
    for index in prefix_indices {
        append_bits(&mut entropy, &mut offset, *index, 11);
    }
    append_bits(&mut entropy, &mut offset, suffix, suffix_bits);
    entropy
}

fn append_bits(bytes: &mut [u8], offset: &mut usize, value: usize, width: usize) {
    for shift in (0..width).rev() {
        if value & (1usize << shift) != 0 {
            bytes[*offset / 8] |= 1 << (7 - *offset % 8);
        }
        *offset += 1;
    }
}

fn valid_mnemonic(phrase: &str) -> bool {
    match mnemonic_to_entropy(phrase.to_owned()) {
        Ok(mut entropy) => {
            wipe_bytes(&mut entropy);
            true
        }
        Err(_) => false,
    }
}

fn normalize_word_input(value: &str) -> String {
    normalize_input(value, |character| character.is_ascii_alphabetic(), |character| {
        character.to_ascii_lowercase()
    })
}

fn normalize_number_input(value: &str) -> String {
    normalize_input(value, |character| character.is_ascii_digit(), |character| character)
}

fn normalize_input(
    value: &str,
    is_content: impl Fn(char) -> bool,
    normalize_content: impl Fn(char) -> char,
) -> String {
    let mut normalized = String::with_capacity(value.len());
    let mut previous_was_space = false;
    for character in value.chars() {
        if is_content(character) {
            normalized.push(normalize_content(character));
            previous_was_space = false;
        } else if character.is_whitespace() && !previous_was_space {
            normalized.push(' ');
            previous_was_space = true;
        }
    }
    normalized
}

fn input_words(value: &str) -> Vec<String> {
    value.split_whitespace().map(str::to_owned).collect()
}

struct SeedWordToken<'a> {
    end: usize,
    start: usize,
    word: &'a str,
}

fn passphrase_tokens(value: &str) -> Vec<SeedWordToken<'_>> {
    let mut tokens = Vec::new();
    let mut start = None;
    for (index, character) in value.char_indices() {
        if !character.is_whitespace() {
            start.get_or_insert(index);
        } else if let Some(token_start) = start.take() {
            tokens.push(SeedWordToken {
                end: index,
                start: token_start,
                word: &value[token_start..index],
            });
        }
    }
    if let Some(token_start) = start {
        tokens.push(SeedWordToken {
            end: value.len(),
            start: token_start,
            word: &value[token_start..],
        });
    }
    tokens
}

fn word_tokens(value: &str) -> Vec<SeedWordToken<'_>> {
    let mut tokens = Vec::new();
    let mut start = None;
    for (index, character) in value.char_indices() {
        if character.is_ascii_lowercase() {
            start.get_or_insert(index);
        } else if let Some(token_start) = start.take() {
            tokens.push(SeedWordToken {
                end: index,
                start: token_start,
                word: &value[token_start..index],
            });
        }
    }
    if let Some(token_start) = start {
        tokens.push(SeedWordToken {
            end: value.len(),
            start: token_start,
            word: &value[token_start..],
        });
    }
    tokens
}

fn selection_bounds(value: &str, selection_start: u32, selection_end: u32) -> (usize, usize) {
    let mut start = usize::try_from(selection_start).unwrap_or(usize::MAX).min(value.len());
    while start > 0 && !value.is_char_boundary(start) {
        start -= 1;
    }
    let mut end = usize::try_from(selection_end).unwrap_or(usize::MAX).min(value.len()).max(start);
    while end > start && !value.is_char_boundary(end) {
        end -= 1;
    }
    (start, end)
}

fn replace_selection(value: &str, start: usize, end: usize, inserted: &str) -> String {
    format!("{}{}{}", &value[..start], inserted, &value[end..])
}

fn word_at(index: usize) -> Option<String> {
    bip39_words().get(index).cloned()
}

fn word_index(word: &str) -> Option<usize> {
    bip39_words().iter().position(|candidate| candidate == word)
}

fn word_has_prefix(prefix: &str) -> bool {
    bip39_words().iter().any(|word| word.starts_with(prefix))
}

fn bip39_words() -> &'static [String] {
    BIP39_WORDS
        .get_or_init(|| {
            (0..BIP39_WORD_COUNT)
                .map(|index| bip39_word(index).expect("BIP39 word index is in range"))
                .collect()
        })
        .as_slice()
}

fn parse_number_index(token: &str, zero_indexed: bool) -> Option<usize> {
    if (token.len() > 1 && token.starts_with('0')) || token.is_empty() {
        return None;
    }
    let number = token.parse::<u64>().ok()?;
    let index = if zero_indexed {
        number
    } else {
        number.checked_sub(1)?
    };
    (index < BIP39_WORD_COUNT as u64).then_some(index as usize)
}

fn translate_number_token(
    translated: &mut String,
    token: &str,
    from_zero_indexed: bool,
    to_zero_indexed: bool,
) {
    let replacement = parse_number_index(token, from_zero_indexed)
        .map(|index| (index + if to_zero_indexed { 0 } else { 1 }).to_string())
        .unwrap_or_else(|| token.to_owned());
    translated.push_str(&replacement);
}

fn wipe_strings(strings: &mut [String]) {
    for value in strings {
        wipe_string(value);
    }
}

fn validate_target_words(target_words: u8) -> Result<(), EntropyStudioError> {
    bip39_entropy_bytes(target_words).map(|_| ())
}