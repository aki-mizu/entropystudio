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
  API or state record. Do not hand-edit generated bindings in `js/generated/`.

## Testing

- Keep non-UI behavior, protocol vectors, and domain-rule tests in Rust under
  `src/tests/`.
- React Native/Jest tests cover rendering, accessibility, event wiring, and
  native-binding calls. Their native mocks must be static fixtures, never
  TypeScript implementations of domain behavior.