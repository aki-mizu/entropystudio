use crate::error::EntropyStudioError;
use crate::wipe::{wipe_bytes, wipe_string};
use unicode_normalization::UnicodeNormalization;

#[derive(Debug, uniffi::Record)]
pub struct SeedQrData {
    pub word_count: u8,
    pub numeric: String,
    pub compact: Vec<u8>,
}

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum AccountScriptType { Legacy, NestedSegwit, NativeSegwit, Taproot }

#[derive(Debug, uniffi::Record)]
pub struct AccountPrivateMaterial {
    pub bitcoin_core_xprv: String,
    pub slip132_private: Option<String>,
    pub slip132_private_label: Option<String>,
    pub spending_change_descriptor: String,
}

#[uniffi::export]
pub fn account_private_material(phrase: String, passphrase: String, account_path: String, master_fingerprint: String, script_type: AccountScriptType, branch_hardened: bool, address_hardened: bool) -> Result<AccountPrivateMaterial, EntropyStudioError> {
    let mut components = parse_account_path(&account_path)?;
    let mut seed = mnemonic_to_seed(phrase, passphrase);
    let mut node = [0u8; 78];
    if unsafe { entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), node.as_mut_ptr()) } != 78 {
        wipe_bytes(&mut seed); wipe_bytes(&mut node);
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    wipe_bytes(&mut seed);
    for (index, hardened) in &mut components {
        let mut child = [0u8; 78];
        loop {
            let child_index = *index | if *hardened { 1 << 31 } else { 0 };
            match unsafe { entropylab_wasm::el_hd_ckd_priv(node.as_ptr(), child_index, child.as_mut_ptr()) } {
                78 => break,
                1 => *index = index.checked_add(1).filter(|next| *next < (1 << 31)).ok_or(EntropyStudioError::InvalidMasterKey)?,
                _ => { wipe_bytes(&mut node); wipe_bytes(&mut child); return Err(EntropyStudioError::InvalidMasterKey); }
            }
        }
        wipe_bytes(&mut node); node = child;
    }
    let testnet = components.get(1).is_some_and(|(index, _)| *index == 1);
    node[..4].copy_from_slice(if testnet { &[0x04, 0x35, 0x83, 0x94] } else { &[0x04, 0x88, 0xad, 0xe4] });
    let bitcoin_core_xprv = base58check_node(&node)?;
    // Upstream only assigns the y/z SLIP-132 family if both the selected
    // policy and the retained account purpose agree. Result policy selection
    // intentionally does not rewrite a custom purpose.
    let slip132_config = match (script_type, components.first()) {
        (AccountScriptType::NestedSegwit, Some((49, _))) => Some(([0x04, 0x4a, 0x4e, 0x28], [0x04, 0x9d, 0x78, 0x78], if testnet { "uprv" } else { "yprv" })),
        (AccountScriptType::NativeSegwit, Some((84, _))) => Some(([0x04, 0x5f, 0x18, 0xbc], [0x04, 0xb2, 0x43, 0x0c], if testnet { "vprv" } else { "zprv" })),
        (AccountScriptType::Legacy | AccountScriptType::Taproot, _) => None,
        _ => None,
    };
    let slip132_private = slip132_config.map(|(testnet_version, mainnet_version, _)| {
        node[..4].copy_from_slice(if testnet { &testnet_version } else { &mainnet_version });
        base58check_node(&node)
    }).transpose()?;
    let origin_path = components.iter().map(|(index, hardened)| format!("{index}{}", if *hardened { "h" } else { "" })).collect::<Vec<_>>().join("/");
    let branch_step = if branch_hardened { "1h" } else { "1" };
    let wildcard = if address_hardened { "*'" } else { "*" };
    let key = format!("[{master_fingerprint}/{origin_path}]{bitcoin_core_xprv}/{branch_step}/{wildcard}");
    let body = match script_type {
        AccountScriptType::Legacy => format!("pkh({key})"),
        AccountScriptType::NestedSegwit => format!("sh(wpkh({key}))"),
        AccountScriptType::NativeSegwit => format!("wpkh({key})"),
        AccountScriptType::Taproot => format!("tr({key})"),
    };
    wipe_bytes(&mut node);
    Ok(AccountPrivateMaterial {
        bitcoin_core_xprv,
        slip132_private,
        slip132_private_label: slip132_config.map(|(_, _, label)| label.to_owned()),
        spending_change_descriptor: format!("{body}#{}", descriptor_checksum(&body)?),
    })
}

fn parse_account_path(path: &str) -> Result<Vec<(u32, bool)>, EntropyStudioError> {
    let mut parts = path.split('/');
    if parts.next() != Some("m") { return Err(EntropyStudioError::InvalidMasterKey); }
    parts.map(|part| {
        let hardened = part.ends_with(['\'', 'h', 'H']);
        let digits = if hardened { &part[..part.len() - 1] } else { part };
        digits.parse::<u32>().ok().filter(|index| *index < (1 << 31)).map(|index| (index, hardened))
    }).collect::<Option<Vec<_>>>().filter(|parts| !parts.is_empty()).ok_or(EntropyStudioError::InvalidMasterKey)
}

fn base58check_node(node: &[u8; 78]) -> Result<String, EntropyStudioError> {
    let mut encoded = [0u8; 112];
    let length = unsafe { entropylab_wasm::el_b58check_encode(node.as_ptr(), node.len(), encoded.as_mut_ptr(), encoded.len()) };
    let result = if length >= 0 && length as usize <= encoded.len() { std::str::from_utf8(&encoded[..length as usize]).map(str::to_owned).map_err(|_| EntropyStudioError::InvalidMasterKey) } else { Err(EntropyStudioError::InvalidMasterKey) };
    wipe_bytes(&mut encoded); result
}

fn descriptor_checksum(descriptor: &str) -> Result<String, EntropyStudioError> {
    const INPUT: &str = "0123456789()[],'/*abcdefgh@:$%{}IJKLMNOPQRSTUVWXYZ&+-.;<=>?!^_|~ijklmnopqrstuvwxyzABCDEFGH`JKLMNOPQRSTUVWXYZ";
    const OUTPUT: &[u8] = b"qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    const GEN: [u64; 5] = [0xf5dee51989, 0xa9fdca3312, 0x1bab10e32d, 0x3706b1677a, 0x644d626ffd];
    let mut symbols = Vec::new(); let mut classes = Vec::new();
    for character in descriptor.chars() {
        let value = INPUT.find(character).ok_or(EntropyStudioError::InvalidMasterKey)? as u8;
        classes.push(value >> 5); symbols.push(value & 31);
        if classes.len() == 3 { symbols.push(classes[0] * 9 + classes[1] * 3 + classes[2]); classes.clear(); }
    }
    if classes.len() == 1 { symbols.push(classes[0]); } else if classes.len() == 2 { symbols.push(classes[0] * 3 + classes[1]); }
    symbols.extend([0; 8]); let mut polymod = 1u64;
    for value in symbols { let top = polymod >> 35; polymod = ((polymod & 0x7ffffffff) << 5) ^ u64::from(value); for (bit, generator) in GEN.iter().enumerate() { if ((top >> bit) & 1) != 0 { polymod ^= generator; } } }
    polymod ^= 1;
    Ok((0..8).map(|offset| OUTPUT[((polymod >> (5 * (7 - offset))) & 31) as usize] as char).collect())
}

#[uniffi::export]
pub fn bip39_entropy_bits(target_words: u8) -> Result<u16, EntropyStudioError> {
    Ok((bip39_entropy_bytes(target_words)? * 8) as u16)
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

/// Returns the two SeedQR payloads defined for a validated 12- or 24-word
/// BIP39 mnemonic. The numeric payload contains four zero-padded BIP39 word
/// indices per word; the compact payload is the underlying BIP39 entropy.
#[uniffi::export]
pub fn seed_qr_data(mnemonic: String) -> Result<SeedQrData, EntropyStudioError> {
    let mut compact = mnemonic_to_entropy(mnemonic)?;
    let mut canonical_mnemonic = entropy_to_mnemonic(compact.clone())?;
    let word_count = canonical_mnemonic.split_whitespace().count() as u8;

    if word_count != 12 && word_count != 24 {
        wipe_string(&mut canonical_mnemonic);
        wipe_bytes(&mut compact);
        return Ok(SeedQrData {
            word_count,
            numeric: String::new(),
            compact: Vec::new(),
        });
    }

    let words: Vec<String> = canonical_mnemonic
        .split_whitespace()
        .map(str::to_owned)
        .collect();
    let mut numeric = String::with_capacity(usize::from(word_count) * 4);
    for word in words {
        let Some(index) =
            (0..2048).find(|index| bip39_word(*index).is_ok_and(|candidate| candidate == word))
        else {
            wipe_string(&mut canonical_mnemonic);
            wipe_bytes(&mut compact);
            return Err(EntropyStudioError::InvalidMnemonic);
        };
        use std::fmt::Write;
        write!(&mut numeric, "{index:04}").expect("writing to String cannot fail");
    }
    wipe_string(&mut canonical_mnemonic);

    Ok(SeedQrData {
        word_count,
        numeric,
        compact,
    })
}

#[uniffi::export]
pub fn mnemonic_to_seed(mut phrase: String, mut passphrase: String) -> Vec<u8> {
    let mut normalized_phrase: String = phrase.nfkd().collect();
    let mut salt = String::from("mnemonic");
    salt.push_str(&passphrase);
    let mut normalized_salt: String = salt.nfkd().collect();
    wipe_string(&mut phrase);
    wipe_string(&mut passphrase);
    wipe_string(&mut salt);

    let mut seed = [0u8; 64];
    unsafe {
        entropylab_wasm::el_pbkdf2_hmac_sha512(
            normalized_phrase.as_ptr(),
            normalized_phrase.len(),
            normalized_salt.as_ptr(),
            normalized_salt.len(),
            2048,
            seed.as_mut_ptr(),
            seed.len(),
        );
    }
    wipe_string(&mut normalized_phrase);
    wipe_string(&mut normalized_salt);
    let result = seed.to_vec();
    wipe_bytes(&mut seed);
    result
}

#[uniffi::export]
pub fn mnemonic_to_master_fingerprint(
    phrase: String,
    passphrase: String,
) -> Result<String, EntropyStudioError> {
    let mut seed = mnemonic_to_seed(phrase, passphrase);
    let result = master_fingerprint_from_seed(&seed);
    wipe_bytes(&mut seed);
    result
}

#[uniffi::export]
pub fn mnemonic_to_master_xprv(
    phrase: String,
    passphrase: String,
) -> Result<String, EntropyStudioError> {
    let mut seed = mnemonic_to_seed(phrase, passphrase);
    let mut master = [0u8; 78];
    let mut encoded = [0u8; 112];
    let master_length = unsafe {
        entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), master.as_mut_ptr())
    };
    wipe_bytes(&mut seed);

    if master_length != 78 {
        wipe_bytes(&mut master);
        wipe_bytes(&mut encoded);
        return Err(EntropyStudioError::InvalidMasterKey);
    }

    let encoded_length = unsafe {
        entropylab_wasm::el_b58check_encode(
            master.as_ptr(),
            master_length as usize,
            encoded.as_mut_ptr(),
            encoded.len(),
        )
    };
    wipe_bytes(&mut master);

    if encoded_length < 0 || encoded_length as usize > encoded.len() {
        wipe_bytes(&mut encoded);
        return Err(EntropyStudioError::InvalidMasterKey);
    }

    let result = std::str::from_utf8(&encoded[..encoded_length as usize])
        .map(str::to_owned)
        .map_err(|_| EntropyStudioError::InvalidMasterKey);
    wipe_bytes(&mut encoded);
    result
}

#[uniffi::export]
pub fn mnemonic_to_master_xpub(
    phrase: String,
    passphrase: String,
) -> Result<String, EntropyStudioError> {
    let mut seed = mnemonic_to_seed(phrase, passphrase);
    let mut master = [0u8; 78];
    let mut public_key = [0u8; 65];
    let mut xpub = [0u8; 78];
    let mut encoded = [0u8; 112];
    let master_length = unsafe {
        entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), master.as_mut_ptr())
    };
    wipe_bytes(&mut seed);
    if master_length != 78 {
        wipe_bytes(&mut master);
        wipe_bytes(&mut public_key);
        wipe_bytes(&mut xpub);
        wipe_bytes(&mut encoded);
        return Err(EntropyStudioError::InvalidMasterKey);
    }

    let public_key_status = unsafe {
        entropylab_wasm::secp_pubkey_create(master[46..].as_ptr(), public_key.as_mut_ptr(), 1)
    };
    // `secp_pubkey_create` returns the number of serialized bytes, rather
    // than a boolean. We request compressed SEC encoding for BIP32 xpubs.
    if public_key_status != 33 {
        wipe_bytes(&mut master);
        wipe_bytes(&mut public_key);
        wipe_bytes(&mut xpub);
        wipe_bytes(&mut encoded);
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    xpub[..4].copy_from_slice(&[0x04, 0x88, 0xb2, 0x1e]);
    xpub[4..45].copy_from_slice(&master[4..45]);
    xpub[45..].copy_from_slice(&public_key[..33]);
    wipe_bytes(&mut master);
    wipe_bytes(&mut public_key);

    let encoded_length = unsafe {
        entropylab_wasm::el_b58check_encode(
            xpub.as_ptr(),
            xpub.len(),
            encoded.as_mut_ptr(),
            encoded.len(),
        )
    };
    wipe_bytes(&mut xpub);
    if encoded_length < 0 || encoded_length as usize > encoded.len() {
        wipe_bytes(&mut encoded);
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    let result = std::str::from_utf8(&encoded[..encoded_length as usize])
        .map(str::to_owned)
        .map_err(|_| EntropyStudioError::InvalidMasterKey);
    wipe_bytes(&mut encoded);
    result
}

fn master_fingerprint_from_seed(seed: &[u8]) -> Result<String, EntropyStudioError> {
    let mut master = [0u8; 78];
    let mut child = [0u8; 78];
    let master_length = unsafe {
        entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), master.as_mut_ptr())
    };

    if master_length != 78 {
        wipe_bytes(&mut master);
        wipe_bytes(&mut child);
        return Err(EntropyStudioError::InvalidMasterKey);
    }

    let mut child_index = 0u32;
    loop {
        let child_length = unsafe {
            entropylab_wasm::el_hd_ckd_priv(master.as_ptr(), child_index, child.as_mut_ptr())
        };
        if child_length == 78 {
            let fingerprint = child[5..9]
                .iter()
                .map(|byte| format!("{byte:02x}"))
                .collect();
            wipe_bytes(&mut master);
            wipe_bytes(&mut child);
            return Ok(fingerprint);
        }
        if child_length != 1 {
            wipe_bytes(&mut master);
            wipe_bytes(&mut child);
            return Err(EntropyStudioError::InvalidMasterKey);
        }
        child_index = match child_index.checked_add(1) {
            Some(next_index) => next_index,
            None => {
                wipe_bytes(&mut master);
                wipe_bytes(&mut child);
                return Err(EntropyStudioError::InvalidMasterKey);
            }
        };
    }
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

pub(crate) fn bip39_entropy_bytes(target_words: u8) -> Result<usize, EntropyStudioError> {
    match target_words {
        12 => Ok(16),
        15 => Ok(20),
        18 => Ok(24),
        21 => Ok(28),
        24 => Ok(32),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

pub(crate) fn bip39_word(index: usize) -> Result<String, EntropyStudioError> {
    let mut bytes = [0u8; 16];
    let length =
        unsafe { entropylab_wasm::el_bip39_word_at(index as u32, bytes.as_mut_ptr(), bytes.len()) };
    if length < 0 {
        wipe_bytes(&mut bytes);
        return Err(EntropyStudioError::InvalidEntropy);
    }
    let result = std::str::from_utf8(&bytes[..length as usize])
        .map(str::to_owned)
        .map_err(|_| EntropyStudioError::InvalidEntropy);
    wipe_bytes(&mut bytes);
    result
}
