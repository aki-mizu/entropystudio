use super::*;

mod bip39;
mod cards;
mod dice;
mod entropy_sync;
mod number_bases;
mod private_key;
mod seed_phrase;

fn expected_words(words: &[&str]) -> Vec<String> {
    words.iter().map(|word| (*word).to_owned()).collect()
}
