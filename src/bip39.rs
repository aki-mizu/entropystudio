use crate::error::EntropyStudioError;
use crate::wipe::{wipe_bytes, wipe_string};
use miniscript::descriptor::checksum::Engine as DescriptorChecksumEngine;
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
pub struct AccountWatchOnlyBranchDescriptor {
    pub branch: u32,
    pub descriptor: String,
}

#[derive(Debug, Clone, uniffi::Record)]
pub struct AccountWatchOnlyAddress {
    pub branch: u32,
    pub index: u32,
    pub address: String,
    pub path: String,
    pub wif: String,
}

#[derive(Debug, uniffi::Record)]
pub struct AccountPrivateMaterial {
    pub bitcoin_core_xprv: String,
    pub bitcoin_core_xpub: String,
    pub slip132_private: Option<String>,
    pub slip132_private_label: Option<String>,
    pub slip132_public: Option<String>,
    pub slip132_public_label: Option<String>,
    pub spending_change_descriptor: String,
    pub watch_only_change_descriptor: String,
    pub watch_only_branch_descriptors: Vec<AccountWatchOnlyBranchDescriptor>,
    pub first_watch_only_address: Option<AccountWatchOnlyAddress>,
    pub watch_only_addresses: Vec<AccountWatchOnlyAddress>,
    pub advanced_watch_only_export: Option<String>,
    pub multisig_cosigner_xpub: Option<String>,
}

#[derive(Debug, uniffi::Record)]
pub struct AccountAddressCheck {
    pub is_empty: bool, pub is_match: bool, pub branch: Option<u32>, pub index: Option<u32>, pub path: Option<String>, pub beyond_shown: bool, pub shown_count: u32, pub searched_to: u32,
}

#[uniffi::export]
pub fn account_address_check(phrase: String, passphrase: String, account_path: String, script_type: AccountScriptType, branches: Vec<u32>, address_index: u32, address_count: u32, branch_hardened: bool, address_hardened: bool, address: String) -> Result<AccountAddressCheck, EntropyStudioError> {
    let address = normalize_address_check(address);
    if address.is_empty() { return Ok(AccountAddressCheck { is_empty: true, is_match: false, branch: None, index: None, path: None, beyond_shown: false, shown_count: 0, searched_to: address_index }); }
    let mut components = parse_account_path(&account_path)?;
    let display_account_path = components.iter().map(|(index, hardened)| format!("{index}{}", if *hardened { "'" } else { "" })).collect::<Vec<_>>().join("/");
    let mut seed = mnemonic_to_seed(phrase, passphrase);
    let mut node = [0u8; 78];
    if unsafe { entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), node.as_mut_ptr()) } != 78 { wipe_bytes(&mut seed); wipe_bytes(&mut node); return Err(EntropyStudioError::InvalidMasterKey); }
    wipe_bytes(&mut seed);
    let testnet = components.get(1).is_some_and(|(index, _)| *index == 1);
    let mut account_node = derive_private_path(node, &mut components)?;
    wipe_bytes(&mut node);
    let shown_end = address_index.checked_add(address_count).filter(|index| *index < (1 << 31)).ok_or(EntropyStudioError::InvalidMasterKey)?;
    let search_end = shown_end.saturating_add(1000).min(1 << 31);
    for index in address_index..search_end {
        for branch in &branches {
            let mut derived = derive_account_address(account_node, *branch, index, script_type, testnet, branch_hardened, address_hardened, &display_account_path)?;
            let matches = addresses_equal(&address, &derived.address);
            wipe_string(&mut derived.wif);
            if matches { wipe_bytes(&mut account_node); return Ok(AccountAddressCheck { is_empty: false, is_match: true, branch: Some(*branch), index: Some(index), path: Some(derived.path), beyond_shown: index >= shown_end, shown_count: address_count, searched_to: index }); }
        }
    }
    wipe_bytes(&mut account_node);
    Ok(AccountAddressCheck { is_empty: false, is_match: false, branch: None, index: None, path: None, beyond_shown: false, shown_count: address_count, searched_to: search_end.saturating_sub(1) })
}

fn normalize_address_check(value: String) -> String {
    let mut text = value.trim().to_owned();
    if text.is_empty() { return text; }
    if text.get(..8).is_some_and(|prefix| prefix.eq_ignore_ascii_case("bitcoin:")) { text = text[8..].to_owned(); }
    if let Some(query) = text.find('?') { text.truncate(query); }
    text = text.trim().to_owned();
    if is_bech32_address(&text) && !(text.bytes().any(|byte| byte.is_ascii_lowercase()) && text.bytes().any(|byte| byte.is_ascii_uppercase())) { text.make_ascii_lowercase(); }
    text
}

fn addresses_equal(left: &str, right: &str) -> bool { if is_bech32_address(left) || is_bech32_address(right) { left.eq_ignore_ascii_case(right) } else { left == right } }
fn is_bech32_address(value: &str) -> bool { value.get(..3).is_some_and(|prefix| prefix.eq_ignore_ascii_case("bc1") || prefix.eq_ignore_ascii_case("tb1")) || value.get(..5).is_some_and(|prefix| prefix.eq_ignore_ascii_case("bcrt1")) }

#[uniffi::export]
pub fn account_private_material(phrase: String, passphrase: String, account_path: String, master_fingerprint: String, script_type: AccountScriptType, branches: Vec<u32>, address_index: u32, address_count: u32, branch_hardened: bool, address_hardened: bool) -> Result<AccountPrivateMaterial, EntropyStudioError> {
    let mut components = parse_account_path(&account_path)?;
    let mut seed = mnemonic_to_seed(phrase, passphrase);
    let mut node = [0u8; 78];
    if unsafe { entropylab_wasm::el_hd_master(seed.as_ptr(), seed.len(), node.as_mut_ptr()) } != 78 {
        wipe_bytes(&mut seed); wipe_bytes(&mut node);
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    wipe_bytes(&mut seed);
    let testnet = components.get(1).is_some_and(|(index, _)| *index == 1);
    let root = node;
    node = derive_private_path(node, &mut components)?;
    let mut account_node = node;
    let multisig_cosigner_xpub = if let (AccountScriptType::NativeSegwit, Some((coin, _)), Some((account, _))) = (script_type, components.get(1), components.get(2)) {
        let mut bip48 = [(48, true), (*coin, true), (*account, true), (2, true)];
        let cosigner = derive_private_path(root, &mut bip48)?;
        let mut cosigner_public = public_node(&cosigner)?;
        cosigner_public[..4].copy_from_slice(if testnet { &[0x04, 0x35, 0x87, 0xcf] } else { &[0x04, 0x88, 0xb2, 0x1e] });
        let output = base58check_node(&cosigner_public)?;
        wipe_bytes(&mut cosigner_public);
        Some(output)
    } else { None };
    let mut account_public_node = public_node(&node)?;
    account_public_node[..4].copy_from_slice(if testnet { &[0x04, 0x35, 0x87, 0xcf] } else { &[0x04, 0x88, 0xb2, 0x1e] });
    let bitcoin_core_xpub = base58check_node(&account_public_node)?;
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
    let slip132_public = slip132_config.map(|(_, _, label)| {
        let (testnet_version, mainnet_version) = match label {
            "uprv" | "yprv" => ([0x04, 0x4a, 0x52, 0x62], [0x04, 0x9d, 0x7c, 0xb2]),
            "vprv" | "zprv" => ([0x04, 0x5f, 0x1c, 0xf6], [0x04, 0xb2, 0x47, 0x46]),
            _ => unreachable!("only supported SLIP-132 families are configured"),
        };
        account_public_node[..4].copy_from_slice(if testnet { &testnet_version } else { &mainnet_version });
        base58check_node(&account_public_node)
    }).transpose()?;
    let origin_path = components.iter().map(|(index, hardened)| format!("{index}{}", if *hardened { "h" } else { "" })).collect::<Vec<_>>().join("/");
    let display_account_path = components.iter().map(|(index, hardened)| format!("{index}{}", if *hardened { "'" } else { "" })).collect::<Vec<_>>().join("/");
    let branch_step = descriptor_branch_step(&branches, branch_hardened)?;
    let wildcard = if address_hardened { "*'" } else { "*" };
    let key = format!("[{master_fingerprint}/{origin_path}]{bitcoin_core_xprv}/{branch_step}/{wildcard}");
    let body = script_descriptor(script_type, &key);
    let watch_only_body = body.replace(&bitcoin_core_xprv, &bitcoin_core_xpub);
    let watch_only_branch_descriptors = if address_hardened {
        Vec::new()
    } else if branch_hardened {
        branches.iter().map(|branch| {
            let mut component = [(*branch, true)];
            let mut child = derive_private_path(account_node, &mut component)?;
            let mut child_public = public_node(&child)?;
            child_public[..4].copy_from_slice(if testnet { &[0x04, 0x35, 0x87, 0xcf] } else { &[0x04, 0x88, 0xb2, 0x1e] });
            let child_xpub = base58check_node(&child_public)?;
            wipe_bytes(&mut child);
            wipe_bytes(&mut child_public);
            let branch = component[0].0;
            let key = format!("[{master_fingerprint}/{origin_path}/{branch}h]{child_xpub}/*");
            let body = script_descriptor(script_type, &key);
            Ok(AccountWatchOnlyBranchDescriptor {
                branch,
                descriptor: format!("{body}#{}", descriptor_checksum(&body)?),
            })
        }).collect::<Result<Vec<_>, EntropyStudioError>>()?
    } else {
        branches.iter().map(|branch| {
            let key = format!("[{master_fingerprint}/{origin_path}]{bitcoin_core_xpub}/{branch}/*");
            let body = script_descriptor(script_type, &key);
            Ok(AccountWatchOnlyBranchDescriptor {
                branch: *branch,
                descriptor: format!("{body}#{}", descriptor_checksum(&body)?),
            })
        }).collect::<Result<Vec<_>, EntropyStudioError>>()?
    };
    let advanced_watch_only_export = slip132_config.map(|_| bitcoin_core_xpub.clone());
    let mut watch_only_addresses = Vec::new();
    for branch in &branches {
        for offset in 0..address_count {
            let index = address_index.checked_add(offset).filter(|index| *index < (1 << 31)).ok_or(EntropyStudioError::InvalidMasterKey)?;
            watch_only_addresses.push(derive_account_address(
                account_node,
                *branch,
                index,
                script_type,
                testnet,
                branch_hardened,
                address_hardened,
                &display_account_path,
            )?);
        }
    }
    let first_watch_only_address = watch_only_addresses.first().cloned();
    wipe_bytes(&mut node);
    wipe_bytes(&mut account_node);
    wipe_bytes(&mut account_public_node);
    Ok(AccountPrivateMaterial {
        bitcoin_core_xprv,
        bitcoin_core_xpub,
        slip132_private,
        slip132_private_label: slip132_config.map(|(_, _, label)| label.to_owned()),
        slip132_public,
        slip132_public_label: slip132_config.map(|(_, _, label)| match label { "uprv" => "upub", "yprv" => "ypub", "vprv" => "vpub", "zprv" => "zpub", _ => unreachable!() }.to_owned()),
        spending_change_descriptor: format!("{body}#{}", descriptor_checksum(&body)?),
        watch_only_change_descriptor: format!("{watch_only_body}#{}", descriptor_checksum(&watch_only_body)?),
        watch_only_branch_descriptors,
        first_watch_only_address,
        watch_only_addresses,
        advanced_watch_only_export,
        multisig_cosigner_xpub,
    })
}

fn derive_account_address(
    account_node: [u8; 78],
    branch: u32,
    index: u32,
    script_type: AccountScriptType,
    testnet: bool,
    branch_hardened: bool,
    address_hardened: bool,
    display_account_path: &str,
) -> Result<AccountWatchOnlyAddress, EntropyStudioError> {
    let mut steps = [(branch, branch_hardened), (index, address_hardened)];
    let mut child = derive_private_path(account_node, &mut steps)?;
    let mut public_key = [0u8; 65];
    if unsafe { entropylab_wasm::secp_pubkey_create(child[46..].as_ptr(), public_key.as_mut_ptr(), 1) } != 33 {
        wipe_bytes(&mut child);
        wipe_bytes(&mut public_key);
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    let mut script = [0u8; 64];
    let script_length = unsafe {
        match script_type {
            AccountScriptType::Legacy => entropylab_wasm::el_spk_p2pkh(public_key.as_ptr(), 33, script.as_mut_ptr(), script.len()),
            AccountScriptType::NestedSegwit => entropylab_wasm::el_spk_p2sh_p2wpkh(public_key.as_ptr(), 33, script.as_mut_ptr(), script.len()),
            AccountScriptType::NativeSegwit => entropylab_wasm::el_spk_p2wpkh(public_key.as_ptr(), 33, script.as_mut_ptr(), script.len()),
            AccountScriptType::Taproot => entropylab_wasm::el_spk_p2tr_key(public_key[1..].as_ptr(), script.as_mut_ptr(), script.len()),
        }
    };
    let mut output = [0u8; 128];
    let wif = encode_derived_wif(&child[46..], testnet)?;
    let address_length = if script_length > 0 {
        unsafe { entropylab_wasm::el_addr_from_script(script.as_ptr(), script_length as usize, if testnet { 1 } else { 0 }, output.as_mut_ptr(), output.len()) }
    } else {
        -1
    };
    let result = if address_length > 0 && (address_length as usize) <= output.len() {
        std::str::from_utf8(&output[..address_length as usize]).map(str::to_owned).map_err(|_| EntropyStudioError::InvalidMasterKey)
    } else {
        Err(EntropyStudioError::InvalidMasterKey)
    };
    wipe_bytes(&mut child);
    wipe_bytes(&mut public_key);
    wipe_bytes(&mut script);
    wipe_bytes(&mut output);
    result.map(|address| AccountWatchOnlyAddress {
        branch: steps[0].0,
        index: steps[1].0,
        address,
        path: format!("m/{display_account_path}/{}{}/{}{}", steps[0].0, if steps[0].1 { "'" } else { "" }, steps[1].0, if steps[1].1 { "'" } else { "" }),
        wif,
    })
}

fn encode_derived_wif(private_key: &[u8], testnet: bool) -> Result<String, EntropyStudioError> {
    if private_key.len() != 32 || unsafe { entropylab_wasm::secp_seckey_valid(private_key.as_ptr()) } != 1 {
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    let mut payload = [0u8; 34];
    payload[0] = if testnet { 0xef } else { 0x80 };
    payload[1..33].copy_from_slice(private_key);
    payload[33] = 1;
    let mut encoded = [0u8; 64];
    let length = unsafe { entropylab_wasm::el_b58check_encode(payload.as_ptr(), payload.len(), encoded.as_mut_ptr(), encoded.len()) };
    let result = if length > 0 && (length as usize) <= encoded.len() {
        std::str::from_utf8(&encoded[..length as usize]).map(str::to_owned).map_err(|_| EntropyStudioError::InvalidMasterKey)
    } else {
        Err(EntropyStudioError::InvalidMasterKey)
    };
    wipe_bytes(&mut payload);
    wipe_bytes(&mut encoded);
    result
}

fn script_descriptor(script_type: AccountScriptType, key: &str) -> String {
    match script_type {
        AccountScriptType::Legacy => format!("pkh({key})"),
        AccountScriptType::NestedSegwit => format!("sh(wpkh({key}))"),
        AccountScriptType::NativeSegwit => format!("wpkh({key})"),
        AccountScriptType::Taproot => format!("tr({key})"),
    }
}

/// Formats precisely the currently selected upstream address-branch window:
/// a lone branch is emitted directly, while a two-branch window uses the
/// standard descriptor multipath syntax.
fn descriptor_branch_step(branches: &[u32], hardened: bool) -> Result<String, EntropyStudioError> {
    match branches {
        [branch] if *branch < (1 << 31) => Ok(format!("{branch}{}", if hardened { "h" } else { "" })),
        [first, second] if *first < (1 << 31) && *second < (1 << 31) && !hardened => Ok(format!("<{first};{second}>")),
        _ => Err(EntropyStudioError::InvalidMasterKey),
    }
}

fn derive_private_path(mut node: [u8; 78], components: &mut [(u32, bool)]) -> Result<[u8; 78], EntropyStudioError> {
    for (index, hardened) in components {
        let mut child = [0u8; 78];
        loop {
            match unsafe { entropylab_wasm::el_hd_ckd_priv(node.as_ptr(), *index | if *hardened { 1 << 31 } else { 0 }, child.as_mut_ptr()) } {
                78 => break,
                1 => *index = index.checked_add(1).filter(|next| *next < (1 << 31)).ok_or(EntropyStudioError::InvalidMasterKey)?,
                _ => { wipe_bytes(&mut node); wipe_bytes(&mut child); return Err(EntropyStudioError::InvalidMasterKey); }
            }
        }
        wipe_bytes(&mut node); node = child;
    }
    Ok(node)
}

fn public_node(private_node: &[u8; 78]) -> Result<[u8; 78], EntropyStudioError> {
    let mut public_key = [0u8; 65];
    if unsafe { entropylab_wasm::secp_pubkey_create(private_node[46..].as_ptr(), public_key.as_mut_ptr(), 1) } != 33 {
        wipe_bytes(&mut public_key);
        return Err(EntropyStudioError::InvalidMasterKey);
    }
    let mut node = [0u8; 78];
    node[4..45].copy_from_slice(&private_node[4..45]);
    node[45..].copy_from_slice(&public_key[..33]);
    wipe_bytes(&mut public_key);
    Ok(node)
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
    let mut engine = DescriptorChecksumEngine::new();
    engine.input(descriptor).map_err(|_| EntropyStudioError::InvalidMasterKey)?;
    Ok(engine.checksum())
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
