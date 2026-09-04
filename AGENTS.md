# AGENTS.md

Guidelines for AI coding agents.

## Architecture

- Rust in `src/` is the single authority for domain behavior: entropy and BIP39
  operations, parsing, normalization, validation, candidate generation, input
  admission, protocol state, progress, readiness, and supported-method
  configuration.
- Before implementing domain behavior in the wrapper, check
  `entropylab/entropylab-wasm` for a compatible upstream Rust implementation.
  Prefer a typed upstream Rust API when one exists; add wrapper logic only when
  upstream has no equivalent native implementation. Do not substitute upstream
  web or TypeScript code for native behavior.
- Treat `entropylab/` as read-only upstream. Never edit its source, locales,
  tests, documentation, lockfiles, or submodule revision. Reuse upstream code
  or text only when it already exists in the pinned upstream revision.
- React Native in `example/src/` is a UI layer. It may own rendering,
  navigation, local view state, selection and text-editing behavior,
  accessibility, localized copy, and display formatting, but must not recreate
  native domain rules or introduce TypeScript fallbacks for them.
- When the UI needs domain information, expose it through a typed Rust/UniFFI
  API or state record.

## Copy and Localization

- All visible and accessibility copy in `example/src/` must first be verified
  as text rendered by the pinned upstream UI. EntropyLab uses content-keyed
  localization: English source text is the key, and upstream has no `en.json`.
- `example/src/features/upstreamUiCopy.ts` is Studio's sole source of upstream
  UI copy. `UPSTREAM_TEXT` provides static semantic aliases,
  `UPSTREAM_UI_LABELS` owns direct `i18n-labels.js` imports, and
  `UPSTREAM_UI_FALLBACK_COPY` holds direct `app.js`-derived values and
  formatters. Elsewhere, import those exports instead of using literal source
  text or importing upstream labels directly. Do not introduce Studio-authored
  visible copy.
- Its synchronization check validates this central module against the current
  pinned upstream source; its provenance test rejects bypasses and verifies
  every static alias, label value, fallback value, and dynamic formatter.
- Never import `entropylab/src/js/i18n.js` or a non-English upstream locale into
  React Native. The former is browser-specific and imports all locale catalogs;
  neither is Studio's English source contract.
- `npm run update:entropylab` automatically runs
  `npm run check:upstream-ui-copy` when it changes the checked-out EntropyLab
  revision. After manually changing the submodule gitlink, run the check
  yourself. It statically validates Studio's aliases and label-table values
  against the pinned upstream source and runs Studio's downstream provenance
  test. Studio does not execute upstream synchronization scripts, rewrite the
  submodule, or import Spanish values. Never add or alter upstream locale
  entries.
- UI tests must derive expected copy from the same direct upstream source or
  downstream fallback function used by production code, rather than repeat a
  separate string literal.

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