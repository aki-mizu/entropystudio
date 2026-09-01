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

## Android APK workflow

Run **Build Android APK** from the repository's Actions tab and provide a
SemVer version such as `0.1.0`. The workflow builds the Android UniFFI library,
assembles the example app's release variant, uploads the APK as a workflow
artifact, and creates a GitHub prerelease with the APK attached. The
supplied version becomes Android's `versionName`; the GitHub run number plus
retry attempt supplies a monotonically increasing `versionCode`.

The prerelease is tagged `v<version>` at the workflow's commit and is available
for download from the GitHub Release page. It can be promoted to a formal
release from that page when it is ready.

The workflow checks out EntropyLab as a sibling repository, then applies a
guarded, one-line change to that runner-local checkout so `entropylab-wasm`
exports both `cdylib` and `rlib`. The script accepts only the known
`crate-type` declaration or an already-patched form, and never pushes a change
to EntropyLab.

The current Android project signs its release variant with the debug keystore.
The uploaded artifact is suitable for development installation, not Play Store
distribution.