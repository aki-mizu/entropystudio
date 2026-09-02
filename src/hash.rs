use crate::wipe::wipe_bytes;

#[uniffi::export]
pub fn sha256(mut input: Vec<u8>) -> Vec<u8> {
    let mut digest = [0u8; 32];
    unsafe {
        entropylab_wasm::el_sha256(input.as_ptr(), input.len(), digest.as_mut_ptr());
    }
    wipe_bytes(&mut input);
    let result = digest.to_vec();
    wipe_bytes(&mut digest);
    result
}
