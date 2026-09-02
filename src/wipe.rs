pub(crate) fn wipe_bytes(bytes: &mut [u8]) {
    for byte in bytes {
        unsafe { std::ptr::write_volatile(byte, 0) };
    }
    std::sync::atomic::compiler_fence(std::sync::atomic::Ordering::SeqCst);
}

pub(crate) fn wipe_string(value: &mut String) {
    unsafe { wipe_bytes(value.as_mut_vec()) };
}
