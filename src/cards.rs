use crate::bip39::bip39_entropy_bytes;
use crate::error::EntropyStudioError;
use crate::hash::sha256;
use crate::wipe::{wipe_bytes, wipe_string};

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum CardHashMethod {
    Ascii,
    Coleman,
}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum CardInputMethod {
    Hashed,
    Direct,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, uniffi::Enum)]
pub enum HashedCardInstruction {
    Empty,
    FirstShuffle,
    ShuffleAgain,
    SecondShuffle,
    Complete,
}

#[derive(Debug, uniffi::Record)]
pub struct HashedCardState {
    pub available_cards: Vec<String>,
    pub card_count: u32,
    pub can_derive: bool,
    pub entropy_bits: f64,
    pub first_duplicate_card: String,
    pub first_shuffle_cards: u8,
    pub has_input: bool,
    pub instruction: HashedCardInstruction,
    pub invalid_tokens: Vec<String>,
    pub progress: f64,
    pub required_cards: u8,
}

#[uniffi::export]
pub fn card_transcript_to_entropy(
    mut transcript: String,
    method: CardHashMethod,
    target_words: u8,
) -> Result<Vec<u8>, EntropyStudioError> {
    let result = card_transcript_to_entropy_inner(&transcript, method, target_words);
    wipe_string(&mut transcript);
    result
}

#[uniffi::export]
pub fn hashed_card_state(
    mut transcript: String,
    target_words: u8,
) -> Result<HashedCardState, EntropyStudioError> {
    let result = hashed_card_state_inner(&transcript, target_words);
    wipe_string(&mut transcript);
    result
}

#[uniffi::export]
pub fn normalize_card_token(mut token: String) -> String {
    let normalized = normalize_card_token_inner(&token).unwrap_or_default();
    wipe_string(&mut token);
    normalized
}

#[uniffi::export]
pub fn normalize_direct_card_transcript(mut transcript: String) -> String {
    let normalized = transcript
        .chars()
        .filter(|character| !is_card_separator(*character))
        .collect();
    wipe_string(&mut transcript);
    normalized
}

#[uniffi::export]
pub fn card_key_allowed(mut key: String, method: CardInputMethod, active_max: u8) -> bool {
    let allowed = if matches!(key.as_str(), "Backspace" | "Delete" | "Enter" | "Tab")
        || key.starts_with("Arrow")
    {
        true
    } else if matches!(method, CardInputMethod::Hashed) {
        key.chars().count() == 1
            && key.chars().next().is_some_and(|character| {
                matches!(
                    character,
                    'A' | 'a' | '1'..='9' | 'T' | 't' | 'J' | 'j' | 'Q' | 'q' | 'K' | 'k'
                        | 'C' | 'c' | 'D' | 'd' | 'H' | 'h' | 'S' | 's' | '0' | '\u{2660}'
                        | '\u{2663}' | '\u{2665}' | '\u{2666}'
                ) || is_card_separator(character)
            })
    } else if key.chars().count() == 1 && key.chars().next().is_some_and(is_card_separator) {
        true
    } else {
        match key.to_ascii_uppercase().as_str() {
            "A" => active_max > 0,
            "2" | "3" | "4" | "5" | "6" | "7" | "8" => key
                .parse::<u8>()
                .is_ok_and(|rank| rank <= active_max),
            _ => false,
        }
    };
    wipe_string(&mut key);
    allowed
}

fn card_transcript_to_entropy_inner(
    transcript: &str,
    method: CardHashMethod,
    target_words: u8,
) -> Result<Vec<u8>, EntropyStudioError> {
    let entropy_length = bip39_entropy_bytes(target_words)?;
    let mut cards = parse_card_transcript(transcript, target_words)?;

    if cards.is_empty() {
        return Err(EntropyStudioError::NoCards);
    }

    let mut hash_input = cards_hash_input(&cards, method);
    let mut digest = sha256(hash_input.as_bytes().to_vec());
    let result = digest[..entropy_length].to_vec();

    wipe_string(&mut hash_input);
    wipe_bytes(&mut digest);
    wipe_cards(&mut cards);
    Ok(result)
}

pub(crate) fn parse_card_transcript(
    transcript: &str,
    target_words: u8,
) -> Result<Vec<String>, EntropyStudioError> {
    let (first_shuffle_cards, _) = card_counts_needed(target_words)?;
    let mut cards = Vec::new();

    for token in transcript.split(is_card_separator).filter(|token| !token.is_empty()) {
        let Some(card) = normalize_card_token_inner(token) else {
            wipe_cards(&mut cards);
            return Err(EntropyStudioError::InvalidCardTranscript);
        };
        let shuffle_start = if cards.len() < first_shuffle_cards {
            0
        } else {
            first_shuffle_cards
        };
        if cards[shuffle_start..].iter().any(|dealt| dealt == &card) {
            wipe_cards(&mut cards);
            return Err(EntropyStudioError::DuplicateCard);
        }
        cards.push(card);
    }

    Ok(cards)
}

fn hashed_card_state_inner(
    transcript: &str,
    target_words: u8,
) -> Result<HashedCardState, EntropyStudioError> {
    let (first_shuffle_cards, extra_shuffle_cards) = card_counts_needed(target_words)?;
    let required_cards = first_shuffle_cards + extra_shuffle_cards;
    let has_input = transcript.chars().any(|character| !is_card_separator(character));
    let mut cards = Vec::new();
    let mut invalid_tokens = Vec::new();

    for token in transcript.split(is_card_separator).filter(|token| !token.is_empty()) {
        if let Some(card) = normalize_card_token_inner(token) {
            cards.push(card);
        } else {
            invalid_tokens.push(token.to_owned());
        }
    }

    let card_count = cards.len();
    let first_duplicate_card = first_duplicate_card(&cards, first_shuffle_cards);
    let current_shuffle = if card_count < first_shuffle_cards {
        &cards[..]
    } else {
        &cards[first_shuffle_cards..]
    };
    let mut available_cards = Vec::with_capacity(52);
    for suit in ['S', 'H', 'C', 'D'] {
        for rank in ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'] {
            let card = format!("{rank}{suit}");
            if !current_shuffle.iter().any(|dealt| dealt == &card) {
                available_cards.push(card);
            }
        }
    }
    let entropy_bits = cards_without_replacement_bits(card_count.min(first_shuffle_cards))
        + cards_without_replacement_bits(card_count.saturating_sub(first_shuffle_cards));
    let instruction = if card_count >= required_cards {
        HashedCardInstruction::Complete
    } else if card_count == 0 {
        HashedCardInstruction::Empty
    } else if first_shuffle_cards < required_cards && card_count == first_shuffle_cards {
        HashedCardInstruction::ShuffleAgain
    } else if first_shuffle_cards < required_cards && card_count > first_shuffle_cards {
        HashedCardInstruction::SecondShuffle
    } else {
        HashedCardInstruction::FirstShuffle
    };
    let progress = (card_count as f64 / required_cards as f64).min(1.0);
    wipe_cards(&mut cards);

    Ok(HashedCardState {
        available_cards,
        card_count: card_count as u32,
        can_derive: has_input,
        entropy_bits,
        first_duplicate_card,
        first_shuffle_cards: first_shuffle_cards as u8,
        has_input,
        instruction,
        invalid_tokens,
        progress,
        required_cards: required_cards as u8,
    })
}

pub(crate) fn card_counts_needed(target_words: u8) -> Result<(usize, usize), EntropyStudioError> {
    let target_bits = bip39_entropy_bytes(target_words)? * 8;

    for first in 1..=52 {
        if cards_without_replacement_bits(first) >= target_bits as f64 {
            return Ok((first, 0));
        }
    }
    for extra in 1..=52 {
        if cards_without_replacement_bits(52) + cards_without_replacement_bits(extra)
            >= target_bits as f64
        {
            return Ok((52, extra));
        }
    }

    Ok((52, 52))
}

fn cards_without_replacement_bits(count: usize) -> f64 {
    (0..count.min(52))
        .map(|index| (52 - index) as f64)
        .map(f64::log2)
        .sum()
}

fn normalize_card_token_inner(token: &str) -> Option<String> {
    let mut value = token
        .trim()
        .replace('\u{2660}', "S")
        .replace('\u{2665}', "H")
        .replace('\u{2666}', "D")
        .replace('\u{2663}', "C");
    value.make_ascii_uppercase();
    if let Some(suffix) = value.strip_prefix("10") {
        value = format!("T{suffix}");
    }

    let mut characters = value.chars();
    let (Some(rank), Some(suit), None) = (characters.next(), characters.next(), characters.next()) else {
        return None;
    };
    if !matches!(rank, 'A' | '2'..='9' | 'T' | 'J' | 'Q' | 'K')
        || !matches!(suit, 'C' | 'D' | 'H' | 'S')
    {
        return None;
    }

    Some(format!("{rank}{suit}"))
}

fn first_duplicate_card(cards: &[String], first_shuffle_cards: usize) -> String {
    let mut seen = Vec::new();
    for (index, card) in cards.iter().enumerate() {
        if index == first_shuffle_cards {
            wipe_cards(&mut seen);
        }
        if seen.iter().any(|dealt| dealt == card) {
            wipe_cards(&mut seen);
            return card.clone();
        }
        seen.push(card.clone());
    }
    wipe_cards(&mut seen);
    String::new()
}

fn cards_hash_input(cards: &[String], method: CardHashMethod) -> String {
    let mut transcript = String::new();
    for (index, card) in cards.iter().enumerate() {
        if index > 0 {
            transcript.push(' ');
        }
        transcript.push(card.as_bytes()[0] as char);
        let suit = card.as_bytes()[1] as char;
        match method {
            CardHashMethod::Ascii => transcript.push(suit.to_ascii_lowercase()),
            CardHashMethod::Coleman => transcript.push(match suit {
                'C' => '\u{2663}',
                'D' => '\u{2666}',
                'H' => '\u{2665}',
                'S' => '\u{2660}',
                _ => unreachable!("normalized card suit"),
            }),
        }
    }
    transcript
}

pub(crate) fn is_card_separator(character: char) -> bool {
    character.is_whitespace() || matches!(character, ',' | '.' | ';' | ':' | '_' | '|' | '/' | '-')
}

fn wipe_cards(cards: &mut Vec<String>) {
    for card in cards.iter_mut() {
        wipe_string(card);
    }
    cards.clear();
}