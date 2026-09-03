# EntropyStudio

EntropyStudio is a React Native TurboModule scaffold for selected, typed
EntropyLab operations. It uses UniFFI and `uniffi-bindgen-react-native` to
generate the JavaScript, C++, Android, and iOS binding layers.

The Rust wrapper depends on the pinned EntropyLab Git submodule at
`entropylab/entropylab-wasm`. It calls that crate internally while exposing
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

The current public API intentionally stays small:

- `sha256(input: ArrayBuffer): ArrayBuffer`
- `mnemonicToEntropy(normalizedPhrase: string): ArrayBuffer`
- `entropyToMnemonic(entropy: ArrayBuffer): string`
- `diceRollsToEntropy(rolls: string, method: DiceRollMethod, targetWords: number): ArrayBuffer`
- `directDiceState(rolls: string, method: DirectDiceMethod, targetWords: number): DirectDiceState`
- `cardTranscriptToEntropy(transcript: string, method: CardHashMethod, targetWords: number): ArrayBuffer`
- `directCardState(transcript: string, targetWords: number): DirectCardState`
- `privateKeyEntropy(value: string, format: PrivateKeyFormat): ArrayBuffer`

`mnemonicToEntropy` expects an NFKD-normalized English BIP39 phrase. In
TypeScript, call `phrase.normalize("NFKD")` before passing text to it.

## Dice rolls

`diceRollsToEntropy` ports EntropyLab's two SHA-256 dice transcript methods.
It accepts faces `1` through `6` with whitespace, commas, semicolons, or pipes
as separators, and supports `12`, `15`, `18`, `21`, and `24` BIP39 words.

- `DiceRollMethod.Coldcard` hashes the original dice digits, matching the
	COLDCARD and SeedSigner convention.
- `DiceRollMethod.Coleman` maps every `6` to `0` before hashing, matching the
	Keystone-compatible dice convention used by EntropyLab.

Both methods hash every accepted roll, then return the leading 128-256 bits of
the SHA-256 digest for the chosen BIP39 length. EntropyLab recommends 50, 62,
75, 87, or 99 fair six-sided rolls respectively. `entropyToMnemonic` converts
that returned buffer into the checksum-valid English BIP39 phrase.

`directDiceState` supports EntropyLab's direct BitBox diceware and D++
word-selection workflows. It returns the completed words, eligible final
checksum words, validation counts, and the next input step for a native UI.

## Cards

`cardTranscriptToEntropy` ports EntropyLab's hashed card methods. It accepts
rank-and-suit tokens such as `AS`, `10H`, and `TD`, including Unicode suit
symbols, and rejects invalid or repeated cards within a shuffle. It supports
the same `12`, `15`, `18`, `21`, and `24` BIP39 word counts as dice.

- `CardHashMethod.Ascii` hashes the canonical ASCII transcript, such as
	`As 2c Td`.
- `CardHashMethod.Coleman` hashes the equivalent Ian Coleman suit-symbol
	transcript, such as `A♠ 2♣ T♦`.

`directCardState` implements rank-only direct word selection. It accepts
draws from the currently required rank set, produces each completed BIP39
word, and calculates the checksum-valid final-word candidates from the final
rank draw sequence.

## Private keys

`privateKeyEntropy` validates a supported private-key input and returns its
32-byte private-key material. It does not recover or create a BIP39 seed
phrase. The wrapper uses EntropyLab's Base58Check decoder, secp256k1
secret-key validator, and SHA-256 implementation; Studio only owns the
input-format framing and dispatch.

- `PrivateKeyFormat.Wif` accepts checksum-valid Bitcoin mainnet WIF,
  including the required `0x01` compression marker when present.
- `PrivateKeyFormat.Hex` accepts a valid 32-byte secp256k1 scalar as 64
	hexadecimal characters, with optional whitespace and a `0x` prefix.
- `PrivateKeyFormat.MiniKey` accepts 22- or 30-character Casascius mini keys,
	including the published SHA-256 checksum rule.
- `PrivateKeyFormat.BrainWallet` hashes exact, nonempty UTF-8 text with
	SHA-256. Boundary whitespace is significant and brain-wallet phrases are
	generally unsafe for funds.

## Setup

Prerequisites:

- Node.js 20 or newer
- Rust and Cargo
- Git with submodule support
- Android NDK and `cargo-ndk` for Android builds
- macOS, Xcode, and the Rust iOS targets for iOS builds

Initialize the pinned EntropyLab source and install the JavaScript tooling:

```sh
git submodule update --init --recursive
npm install
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

## Local Android debug build

The debug variant loads JavaScript from Metro rather than packaging a bundle.
With the development machine and device connected to Tailscale, configure the
debug APK to use the development machine's Tailscale address when installing it:

```sh
METRO_HOST="$(tailscale ip -4):8081" npm run install:android
```

Then start Metro whenever you want to run or reload the debug app:

```sh
cd example
npm start
```

The device fetches the bundle directly from Metro over Tailscale; it does not
need an ADB connection or `adb reverse` to load JavaScript. Rebuild with a new
`METRO_HOST` only when the development machine's reachable address changes.

APK installation still uses ADB. For a device already paired through Android's
Wireless debugging settings, connect it with the reachable device address and
the wireless-debugging port shown on the device:

```sh
adb connect <device-ip>:<wireless-debugging-port>
```

Confirm that ADB can see the device before installing:

```sh
adb devices -l
```

Keep `METRO_HOST` in any Gradle command that might build or repackage the debug
APK, including a reinstall after deleting the local APK:

```sh
cd example/android
METRO_HOST="$(tailscale ip -4):8081" ./gradlew :app:installDebug
```

If `app-debug.apk` already exists and was built with the correct host, ADB can
install that exact file without invoking Gradle:

```sh
adb install -r example/android/app/build/outputs/apk/debug/app-debug.apk
```

`installDebug` does not rebuild the Rust library or start Metro.

To build an APK without installing it, use:

```sh
./gradlew :app:assembleDebug
```

The APK is written to `example/android/app/build/outputs/apk/debug/app-debug.apk`.

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

The workflow commits a required `Cargo.lock` refresh to the branch that
dispatched it before building and tagging the prerelease. Run it from a branch
whose GitHub Actions token may write contents; a required refresh from a tag or
a protected branch that rejects the push stops the build rather than publishing
an APK from an uncommitted dependency graph.

The current Android project signs its release variant with the debug keystore.
The uploaded artifact is suitable for development installation, not Play Store
distribution.
