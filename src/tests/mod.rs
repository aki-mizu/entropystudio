use super::*;

mod bip39;
mod cards;
mod dice;
mod number_bases;
mod seed_phrase;

fn expected_words(words: &[&str]) -> Vec<String> {
    words.iter().map(|word| (*word).to_owned()).collect()
}
