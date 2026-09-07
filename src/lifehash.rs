// LifeHash rendering is provided by bc-lifehash, the first-party Blockchain
// Commons Rust implementation licensed under BSD-2-Clause-Patent.

use base64::{engine::general_purpose::STANDARD, Engine as _};
use png::{BitDepth, ColorType, Encoder};

use crate::error::EntropyStudioError;

const MODULE_SIZE: usize = 3;

fn render_image(fingerprint: &str, module_size: usize) -> Result<bc_lifehash::Image, ()> {
    let fingerprint_bytes = hex::decode(fingerprint).map_err(|_| ())?;
    Ok(bc_lifehash::make_from_data(
        &fingerprint_bytes,
        bc_lifehash::Version::Version2,
        module_size,
        false,
    ))
}

#[cfg(test)]
pub(crate) fn render_fingerprint_rgb(fingerprint: &str) -> Result<Vec<u8>, ()> {
    Ok(render_image(fingerprint, 1)?.colors)
}

fn encode_png(image: &bc_lifehash::Image) -> Vec<u8> {
    let mut png_data = Vec::new();
    {
        let mut encoder = Encoder::new(&mut png_data, image.width as u32, image.height as u32);
        encoder.set_color(ColorType::Rgb);
        encoder.set_depth(BitDepth::Eight);
        let mut writer = encoder
            .write_header()
            .expect("bc-lifehash output must have PNG-compatible dimensions");
        writer
            .write_image_data(&image.colors)
            .expect("bc-lifehash output must contain valid RGB data");
    }
    png_data
}

#[uniffi::export]
pub fn lifehash_from_fingerprint(fingerprint: String) -> Result<String, EntropyStudioError> {
    let image = render_image(&fingerprint, MODULE_SIZE)
        .map_err(|_| EntropyStudioError::InvalidLifeHashFingerprint)?;
    Ok(format!(
        "data:image/png;base64,{}",
        STANDARD.encode(encode_png(&image))
    ))
}
