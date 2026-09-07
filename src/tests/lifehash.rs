use base64::{engine::general_purpose::STANDARD, Engine as _};

use super::*;

const VECTORS: [(&str, &str); 4] = [
    (
        "73c5da0a",
        "09da10ffd57a4f58616a5eda313d3f0c861e79b93e1b609a012f9c3530b427b5",
    ),
    (
        "00000000",
        "9003d9fd366ec3aa06f54d6797485114ec00c61bf85c0efafa91bd2e40176d5b",
    ),
    (
        "ffffffff",
        "e856f1b33dfd8eef83151de7407c3d4861581ce09f11f11f2dfc6b0219a1e51b",
    ),
    (
        "b8688df1",
        "d44ba038c1389003c955a6f17accfb87c98fce4e8c98c9e2a44c71067b6521fe",
    ),
];

#[test]
fn lifehash_matches_upstream_rgb_vectors() {
    for (fingerprint, expected_hash) in VECTORS {
        let rgb = crate::lifehash::render_fingerprint_rgb(fingerprint).unwrap();
        assert_eq!(rgb.len(), 32 * 32 * 3);
        assert_eq!(hex(&crate::sha256(rgb)), expected_hash, "{fingerprint}");
    }
}

#[test]
fn lifehash_returns_a_png_data_url() {
    let image = lifehash_from_fingerprint("73c5da0a".to_owned()).unwrap();
    let png = STANDARD
        .decode(image.strip_prefix("data:image/png;base64,").unwrap())
        .unwrap();

    assert_eq!(&png[..8], b"\x89PNG\r\n\x1a\n");
    assert_eq!(&png[16..20], &96u32.to_be_bytes());
    assert_eq!(&png[20..24], &96u32.to_be_bytes());
}

#[test]
fn lifehash_rejects_invalid_fingerprints() {
    assert!(matches!(
        lifehash_from_fingerprint("73c5da0".to_owned()),
        Err(EntropyStudioError::InvalidLifeHashFingerprint)
    ));
    assert!(matches!(
        lifehash_from_fingerprint("73c5da0g".to_owned()),
        Err(EntropyStudioError::InvalidLifeHashFingerprint)
    ));
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}
