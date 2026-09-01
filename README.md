# EntropyStudio

EntropyStudio is a React Native TurboModule scaffold for selected, typed
EntropyLab operations. It uses UniFFI and `uniffi-bindgen-react-native` to
generate the JavaScript, C++, Android, and iOS binding layers.

The Rust wrapper depends on the sibling EntropyLab checkout at
`../entropylab/entropylab-wasm`. It calls that crate internally while exposing
safe, typed UniFFI functions to React Native.

## Layout

```text
src/lib.rs          UniFFI-facing Rust API
js/                 Generated TypeScript entrypoint and bindings
cpp/                Generated JSI bindings
android/            Generated Android TurboModule integration
ios/                Generated iOS TurboModule integration
ubrn.config.yaml    UBRN build and generation configuration
```

The initial public API intentionally stays small:

- `sha256(input: ArrayBuffer): ArrayBuffer`
- `mnemonicToEntropy(normalizedPhrase: string): ArrayBuffer`

`mnemonicToEntropy` expects an NFKD-normalized English BIP39 phrase. In
TypeScript, call `phrase.normalize("NFKD")` before passing text to it.

## Setup

Prerequisites:

- Node.js 20 or newer
- Rust and Cargo
- A sibling clone of EntropyLab at `../entropylab`
- Android NDK and `cargo-ndk` for Android builds
- macOS, Xcode, and the Rust iOS targets for iOS builds

Install the JavaScript tooling and generate host bindings:

```sh
npm install
npm run generate
```

Run the Rust contract tests:

```sh
npm test
```

Build native artifacts and regenerate bindings for a mobile platform:

```sh
npm run build:android
npm run build:ios
```

The generated native bridge uses static linking (`staticlib`) for Android and
iOS, following the UBRN configuration used by Nostr SDK's React Native package.
The existing EntropyLab web build remains a separate `cdylib`/WASM consumer of
the same underlying crate.