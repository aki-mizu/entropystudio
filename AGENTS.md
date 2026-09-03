# AGENTS.md

Guidelines for AI coding agents.

## Architecture

- Rust in `src/` is the single authority for domain behavior: entropy and BIP39
  operations, parsing, normalization, validation, candidate generation, input
  admission, protocol state, progress, readiness, and supported-method
  configuration.
- React Native in `example/src/` is a UI layer. It may own rendering,
  navigation, local view state, selection and text-editing behavior,
  accessibility, localized copy, and display formatting, but must not recreate
  native domain rules or introduce TypeScript fallbacks for them.
- When the UI needs domain information, expose it through a typed Rust/UniFFI
  API or state record.

## Generated Outputs and Dependencies

- UBRN generates `js/generated/`, `cpp/generated/`, `android/generated/`, and
  `ios/generated/`. Regenerate those outputs with `npm run build:android` or
  `npm run build:ios`; do not hand-edit them.
- `npm run build:android` runs `update:entropylab` and can change the checked-out
  EntropyLab commit. Treat that as an intentional dependency update and review
  it separately from unrelated work.
- Rust-dependent npm commands run `prepare:entropylab`, which locally adds
  `rlib` to EntropyLab's `crate-type`. Never commit or push that automated
  submodule change.
- When an intentional EntropyLab update requires a lockfile refresh, run
  `cargo update -p entropylab-wasm` and commit only the resulting `Cargo.lock`
  change. Do not mix unrelated dependency updates into that refresh.

## Testing

- Keep non-UI behavior, protocol vectors, and domain-rule tests in Rust under
  `src/tests/`.
- React Native/Jest tests cover rendering, accessibility, event wiring, and
  native-binding calls. Their native mocks must be static fixtures, never
  TypeScript implementations of domain behavior.
- Run `npm test` before completing Rust or binding changes.