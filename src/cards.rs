use crate::error::EntropyStudioError;
use crate::hash::sha256;
use crate::hashed_dice::dice_entropy_length;
use crate::wipe::{wipe_bytes, wipe_string};

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum CardHashMethod {
    Ascii,
    Coleman,
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

fn card_transcript_to_entropy_inner(
    transcript: &str,
    method: CardHashMethod,
    target_words: u8,
) -> Result<Vec<u8>, EntropyStudioError> {
    let entropy_length = dice_entropy_length(target_words)?;
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
        let Some(card) = normalize_card_token(token) else {
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

pub(crate) fn card_counts_needed(target_words: u8) -> Result<(usize, usize), EntropyStudioError> {
    let target_bits = dice_entropy_length(target_words)? * 8;

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

fn normalize_card_token(token: &str) -> Option<String> {
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