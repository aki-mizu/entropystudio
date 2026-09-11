import {
  hodlHexFormatLabels,
  hodlKeyModeLabels,
  hodlScriptBeginnerTexts,
} from '../../../entropylab/src/js/i18n-labels.js';

/** Exact current-upstream UI text used by Studio. */
export const UPSTREAM_TEXT = {
  action: {
    derive: 'Derive Key',
  },
  beta: {
    understand: 'I understand',
  },
  cards: {
    hashedRequirement24:
      '24 words need 256 bits. One deck is about 225.6 bits, so deal 52 unique cards, shuffle again, then deal 6 more.',
    coleman: 'Match Ian Coleman method',
    directRequirement:
      '{words} words use {partial} complete 11-bit rank selections plus {final} final rank draw(s).',
    direct: {
      desc: 'Ignore suits. Reshuffle and draw A–8, A–8, A–8, then A–4 for each full word. Finish with the shorter rank sequence shown for the checksum-valid final word.',
      title: 'Direct word selection',
    },
    hashed: {
      desc: 'Deal unique rank-and-suit cards without replacement. SHA-256 hashes the complete transcript; {recommended}.',
      recommended24: '58 cards across two shuffles are recommended',
      recommendedN: '{n} cards are recommended',
      title: 'Hashed card transcript',
    },
    hashedRequirement:
      '{words} words need {bits} bits. Deal {first} unique cards from one shuffled deck.',
    how: 'How to turn cards into a {words}-word seed',
    instruct: {
      directFirst: 'Shuffle {set} (any suit) before the first draw.',
      directNext: 'Shuffle {set} (any suit) before the next draw.',
      hashedAgain: 'Shuffle the full 52-card deck again before the next draw.',
      hashedFirst: 'Shuffle a standard 52-card deck before the first draw.',
      hashedNext: 'Deal the next card without replacement from the shuffled deck.',
      hashedSecond: 'Deal the next card without replacement from the second shuffle.',
    },
    meta: {
      directFinal: 'Final word · draw {draw} of {need} from {set} after shuffling',
      directWord: 'Word {word} of {words} · draw {draw} of 4 from {set}',
      directWordShuffle: 'Word {word} of {words} · draw {draw} of 4 from {set} after shuffling',
      hashedEmpty: '0 of {need} recommended cards · 0.0 bits estimated · Hashed card transcript',
      hashedExtra: 'all {n} extra cards are included',
      hashedExtraOne: 'all {n} extra card is included',
      hashedMissing: '{have} of {need} recommended cards · {bits} bits estimated · seed available for testing · {missing} more recommended',
      hashedReady: '{n} cards · {bits} bits estimated · ready to derive',
      hashedReadyOne: '{n} card · {bits} bits estimated · ready to derive',
    },
    transcript: 'Card transcript',
    undo: 'Undo last card',
  },
  calculations: {
    bit: 'Bit',
    bitWeight: 'Bit weight',
    bip39Index: 'BIP39 index',
    bitboxDescription:
      'Each D4 contributes one base-4 value and the final die contributes the coin bit, giving 4⁵ × 2 = 2048 possible indices.',
    bitboxTitle: 'BitBox diceware calculations',
    coinBit: 'Coin bit',
    contribution: 'Contribution',
    conversionArrow: '→',
    d16: 'D16',
    d8: 'D8',
    directDiceNote: '(show how direct word selection produces each BIP39 index)',
    dplusDescription:
      'D8 contributes 8 values and each hexadecimal D16 contributes 16 values, giving 8 × 16 × 16 = 2048 possible indices.',
    dplusTitle: 'D++ calculations',
    numberBaseDescription:
      'Each 11-bit group is interpreted as a big-endian binary integer. Multiply each bit by its bit weight, then sum the contributions to get the zero-based BIP39 index. The corresponding word number is the index plus 1.',
    numberBaseNote: '(show how each BIP39 word number is calculated)',
    show: 'Show calculations',
    wordNumber: 'word number',
  },
  common: {
    cancel: 'Cancel',
    done: 'Done',
  },
  dice: {
    bitbox: {
      coin: 'Word {word} of {partial} · 6th die (interpreted as a coin flip)',
      desc: 'Use five dice showing 1–4, then a coin (or 6th die: 1–3 heads, 4–6 tails). Build {partialWords} lookup-table words, then choose 1 of {candidates} valid final checksum words.',
      die: 'Word {word} of {partial} · die {die} of 5 (faces 1–4)',
      heads: 'Heads',
      headsRange: '1 – 3',
      lastWord: '{n} words · choose the final checksum word',
      tails: 'Tails',
      tailsRange: '4 – 6',
      title: 'BitBox diceware / Direct word selection',
    },
    coldcard: {
      desc: 'SHA-256 of the original dice digit string, matching the method used by COLDCARD and SeedSigner. The first {bits} bits become the selected {words}-word seed; {hashRolls} rolls are recommended, and every entered roll is included.',
      title: 'Base 10 [0-9] / Hashed rolls (recommended)',
    },
    coleman: {
      desc: 'Convert each 6 to 0 and SHA-256 the complete mapped digit string, matching the method used by Keystone. Use the first {bits} bits; {hashRolls} rolls are recommended, and every entered roll is included.',
      title: 'Dice [1-6] / Hashed rolls',
    },
    dplus: {
      aCoinFlip: 'a coin flip',
      coinFlip: 'coin flip',
      coinNote: ' The final D8 is interpreted as a coin flip: 1–4 is Heads, 5–8 is Tails. Or flip a real coin!',
      desc: 'Roll one D8 labeled 1–8 and two hexadecimal D16 dice labeled 0–F for each of the first {partialWords} words, then {final} to select the valid checksum final word.',
      helpOne: 'One final {die} roll selects the checksum word.',
      helpTwo: 'One final {a} roll and one final {b} roll select the checksum word.{coin}',
      helpTwoSame: 'Two final {die} rolls select the checksum word.',
      range: {
        coin: ' (1–4 Heads, 5–8 Tails)',
        d16: ' (0–F)',
        d8: ' (1–8)',
      },
      ready: '{words} of {words} seed words · checksum valid · ready to derive',
      roll: {
        checksumCoin: 'final D8 as a coin flip',
        checksumD16: 'final D16 checksum roll',
        checksumD8: 'final D8 checksum roll',
        d16first: 'first D16 roll',
        d16second: 'second D16 roll',
        d8: 'D8 roll',
      },
      rollAnd: 'roll a final {a} and {b}',
      rollOnceMore: 'roll the {die} once more',
      rollTwice: 'roll a final {die} twice',
      title: 'D++ / Direct word selection',
    },
    help: {
      bitbox: '{partialWords} lookup-table words fill one slot at a time, then choose a confirmed final checksum word. Use 1–4 for the first five rolls (if you get 5 or 6, roll again). The sixth roll is treated as the coin: 1–3 is Heads, 4–6 is Tails. Or flip a real coin!',
      coldcard: 'The original dice digit string is hashed with SHA-256. This Base 10 [0-9] method matches COLDCARD and SeedSigner. Any nonempty count produces a phrase, but use at least {hashRolls} fair rolls before relying on it.',
      coleman: 'Every rolled 6 becomes 0 before the complete digit string is hashed with SHA-256. This Dice [1-6] method matches the method used by Keystone. Any nonempty count produces a phrase, but use at least {hashRolls} fair rolls before relying on it.',
      dplus: 'Enter the D8 face from 1–8, then both hexadecimal D16 faces from 0–F exactly as shown on the dice. For example, 100 selects abandon and 8FF selects zoo. {finalHelp}',
    },
    how: 'How to turn rolls into a {words}-word seed',
    label: {
      bitbox: 'Dice rolls (1–4, then a 6th die interpreted as a coin flip)',
      dplus: 'D++ rolls (D8, D16, D16; then {final})',
      hashed: 'Dice rolls (faces 1–6 only)',
    },
    meta: {
      empty: '0 of {n} recommended rolls · 0.0 bits estimated · {method}',
      extra: ' · all {n} extra roll(s) included',
      extraIgnored: ' · {n} extra input(s) ignored',
      invalid: ' · {n} invalid input(s) highlighted',
      missing: '{have} of {n} recommended rolls · {bits} bits estimated · seed available for testing · {missing} more recommended',
      ready: '{have} roll(s) · {bits} bits estimated · ready to derive',
    },
    method: {
      coldcard: 'Hashed rolls / Base 10 [0-9]',
      coleman: 'Hashed rolls / Dice [1-6]',
    },
  },
  error: {
    diceFaces: 'Dice must be faces 1–6. Ignored characters: {chars}',
    generic: 'Could not calculate',
    priv: {
      brainEmpty: 'Enter the brain-wallet recovery passphrase.',
      brainTrimmedEmpty: 'Trimming boundary whitespace leaves an empty brain-wallet recovery passphrase.',
      enter: 'Enter a private key.',
      hex: 'Enter exactly 64 hexadecimal characters (0–9 and a–f).',
      miniFormat: 'Mini keys must start with S and contain 22 or 30 Bitcoin Base58 characters.',
      miniInvalid: 'Not a valid Casascius mini private key.',
      range: 'Private key is out of the secp256k1 range.',
      wif: 'Enter a valid {network} WIF private key ({hint}).',
    },
  },
  fingerprint: {
    baseSeed: 'Base seed',
    master: 'Master fingerprint',
    withPassphrase: 'With passphrase',
  },
  hex: {
    format: {
      base32: 'Crockford Base32',
      base4: 'Base 4',
      base8: 'Octal (Base 8)',
      bin: 'Binary (Base 2)',
    },
    heading: 'Number base',
    placeholder: 'Exactly {digits} {unit}',
    unit: {
      hex: 'hexadecimal characters',
    },
  },
  key: {
    brain: 'Brain wallet',
    brainDesc: 'Unsafe. SHA-256 of your text, as a single key pair or a 24-word seed.',
    brainWalletTrim: 'Trim leading and trailing whitespace',
    formatHeading: 'Private key format',
    hex: 'Private key hex',
    hexDesc: 'Raw 32-byte private key as 64 hexadecimal characters.',
    inputHelp: 'Enter the value matching the selected format. Brain wallet text is hashed with SHA-256.',
    inputLabel: 'Private key or recovery passphrase',
    mini: 'Mini key',
    miniDesc: 'Casascius-style short key.',
    placeholderBrain: 'Text to hash',
    placeholderHex: '64 hexadecimal characters',
    placeholderMini: 'S… (22 or 30 Base58 characters)',
    placeholderWif: '5… / K… / L…',
    wif: 'WIF',
    wifDesc: 'Bitcoin wallet import format (Base58Check).',
  },
  keys: {
    add: 'Open Key Station to derive another key',
    advancedEntry: 'Advanced entry',
    accountIndexHelp: 'Account index · Hardened · 0 to 2,147,483,647',
    addressEstimate: {
      aboutMinutes: 'about {n} minutes',
      aboutSeconds: 'about {n} seconds',
      measuring: 'Measuring this device…',
      underPointOneSeconds: 'under 0.1 seconds',
    },
    addressBranchRange: 'Address branch range',
    addressBranchRangeHelp: 'Derives Receive branch · Max 2',
    addressRange: 'Address range',
    addressRangeHelp: 'Derives 1 receive address · Max 10,000',
    addressRangeReceiveAndChangeHelp:
      'Derives 5 receive and 5 change addresses · Max 10,000',
    account: 'Account',
    branchLabels: {
      receive: 'Receive',
    },
    coinTypeNetworks: {
      customMainnetAddresses: 'Custom · Mainnet addresses',
      mainnet: 'Mainnet',
      testnet: 'Testnet',
    },
    coinTypeIndexHelp:
      'Coin type index · Mainnet · Hardened · 0 to 2,147,483,647',
    defaultTab: 'Key {n}',
    derivationPath: 'Derivation path',
    derivationPathErrors: {
      index:
        "Each derivation path index must be a whole number from 0 to 2,147,483,647, optionally followed by h or '.",
      missingComponents:
        'Derivation path must include purpose, network, and account plus every address component shown.',
      missingAccount:
        'Derivation path must include purpose, network, and account indexes.',
      root: 'Derivation path must start with m and contain slash-separated BIP32 indexes.',
    },
    derivationPathHelp:
      'Exact BIP32 address path · edit directly to use a custom path',
    delete: 'Delete current key',
    editInput: 'Edit input',
    harden: 'Harden',
    methodLabel: 'Method',
    network: 'Network',
    purpose: 'Purpose',
    purposeIndexHelp: 'Purpose index · Hardened · 0 to 2,147,483,647',
    scriptType: 'Script type',
    scriptTypes: {
      bip44: 'Legacy',
      bip49: 'Nested SegWit',
      bip84: 'Native SegWit',
      bip86: 'Taproot',
    },
    startingAddressBranch: 'Starting address branch',
    startingAddressBranchHelp:
      'First address branch to derive · 0 is Receive · 1 is Change · Unhardened · 0 to 2,147,483,647',
    startingAddressIndex: 'Starting address index',
    startingAddressIndexHelp:
      'First receive index to derive · Unhardened · 0 to 2,147,483,647',
    startingAddressIndexReceiveAndChangeHelp:
      'First receive and change index to derive · Unhardened · 0 to 2,147,483,647',
    addressBranchRangeReceiveAndChangeHelp: 'Derives Receive and Change branches · Max 2',
    station: 'Key Station',
    stationIntroduction: {
      description:
        'Turn entropy you bring — dice rolls, playing cards, a number in any base, a seed phrase, or a private key — into a BIP-39 seed, then derive its master fingerprint, extended public keys, and receive addresses. The dice methods match COLDCARD, SeedSigner, Keystone, and BitBox, so the same rolls reproduce the same seed on those signers. This does not invent entropy — it is a calculator, and nothing leaves this page.',
      heading: 'Create. Derive. Verify.',
      title: 'Your entropy enters the lab',
    },
    tabLabel: 'Keys',
  },
  mode: {
    cards: 'Cards',
    dice: 'Dice rolls',
    hex: 'Number bases',
    key: 'Private key',
    seed: 'Seed phrase',
  },
  numberBases: {
    mixedRemainder:
      ' The final character is mixed-radix: it contributes only {n} bit(s) and must be one of {chars}.',
    remainderBinary:
      ' Enter {fullDigits} complete {shortLabel} characters; the controls and progress message then switch to {n} coin flip(s), using Heads (0) or Tails (1).',
    requirement: '{words} words require exactly {digits} {unit}.',
    setupRemainderBinary:
      ' Enter {fullDigits} complete {shortLabel} characters followed by {n} coin flip(s), using Heads (0) or Tails (1).',
    setupRemainderMixed:
      ' The final character contributes {n} bit(s) and must be one of {chars}.',
  },
  note: {
    bitboxSkippedMany: 'Skipped {n} faces of 5 or 6 on the first five dice of a word (reroll).',
    bitboxSkippedOne: 'Skipped {n} face of 5 or 6 on the first five dice of a word (reroll).',
  },
  passphrase: {
    autocomplete: 'Autocomplete BIP39 words',
    buildFromWords: 'Build passphrase from BIP39 words',
    incompleteOne: '{n} complete BIP39 word · finish the current word',
    incompleteMany: '{n} complete BIP39 words · finish the current word',
    inconsistentOne: '{n} passphrase inconsistency highlighted · use complete lowercase English BIP39 words separated by single spaces',
    inconsistentMany: '{n} passphrase inconsistencies highlighted · use complete lowercase English BIP39 words separated by single spaces',
    label: 'Optional BIP39 passphrase',
    placeholder: 'Enter a BIP39 passphrase, or leave blank for none',
    trailingSeparatorOne: '{n} complete BIP39 word · start the next word or remove the final space',
    trailingSeparatorMany: '{n} complete BIP39 words · start the next word or remove the final space',
    wordsEnteredOne: '{n} lowercase BIP39 passphrase word entered',
    wordsEnteredMany: '{n} lowercase BIP39 passphrase words entered',
    wordsHelp: 'Use complete lowercase English BIP39 words separated by single spaces.',
    wordsNote: '(lowercase words separated by single spaces)',
  },
  result: {
    privateAccountMaterial: 'Private account material',
    privateAccountMaterialIntro:
      'These exports can spend from this account. They are shown only for a seed or extended private-key source.',
    privateAccountMaterialWarningLead:
      'Keep these exports together only in secure offline backups.',
    privateAccountMaterialWarningTail:
      "An account extended public key combined with any non-hardened descendant private key, including a WIF shown in the address tables below, can reconstruct that account's extended private key.",
    genericDescriptorCompatibility: 'Generic {name} for descriptor compatibility',
    multisigCosigner: 'Multisig co-signer {prefix} · {label}',
    addressCheckSearching: 'Not in the {n} shown addresses. Checking further indices',
    addressesWithWif: '{label} with WIF private keys',
    slip132PrefixNote: 'Prefix swap only (same payload, new version bytes and checksum). Script lives in the descriptor, not the prefix. x = legacy, y = nested BIP49, z = native BIP84, Y = nested BIP48 nested-msig, Z = native BIP48 native-msig. Testnet: t / u / v / U / V. No Taproot SLIP prefix.',
    watchOnlyAccountWarningLead: 'Cannot spend:',
    watchOnlyAccountWarningTail:
      'these exports can monitor every address and reveal this account\'s transaction history and balance. Treat them as privacy-sensitive.',
    compactSeedQr: 'CompactSeedQR. Same seed, smaller binary code.',
    compactSeedQrCompatible: 'Compatible with: SeedSigner, Krux, Jade, Passport.',
    entropyHex: 'BIP39 entropy hex',
    hexPrivateKey: 'Hex private key',
    privateKey: 'Private key material',
    privateKeyMaterialSafety:
      'These values can spend the bitcoin held by the addresses below. Reveal them only while this file is running offline on an air-gapped computer.',
    privateRecoveryMaterial: 'Private recovery material',
    privateRecoveryMaterialSafety:
      'These values can recreate or spend from the wallet. Reveal them only while this file is running offline on an air-gapped computer.',
    rootXprv: 'Root {name}',
    watchOnlyWalletData: 'Watch-only wallet data',
    watchOnlyWalletDescriptorImport:
      'Import this output descriptor into Sparrow or another wallet.',
    addressBranchDescriptors: 'Address branch descriptors',
    advancedWatchOnlyExport: 'Advanced watch-only export',
    addresses: 'Addresses',
    addressesVerification:
      'Verify the first selected address on another trusted wallet or signing device before accepting bitcoin.',
    address: 'Address',
    path: 'Path',
    wif: 'WIF',
    watchOnlyWalletDataSafety:
      'These values identify the wallet or enable watch-only use, but do not authorize spending. Treat them as privacy-sensitive because extended public keys and descriptors can reveal wallet addresses, balances, and transaction history.',
    safetyNotes: 'Safety notes',
    seedQr: 'SeedQR',
    seedQrCompatible: 'Compatible with: SeedSigner, Krux, Jade, Passport, Coldcard Q.',
    seedQrNumeric: 'SeedQR. Numeric.',
    seedQrPassphrase: ' This QR is the seed only. Enter the passphrase on the signer after scanning.',
    seedQrScan: 'Scan into a camera signer. This is the seed.',
    seedQrUnsupported: 'SeedQR is defined for 12 and 24 word phrases. Type this {n}-word seed on the signer.',
    safety: {
      cards: {
        countMany: '{n} cards ≈ {bits} bits.',
        countOne: '{n} card ≈ {bits} bits.',
        extra: 'All {n} cards, including extras, are included in the hash.',
        insufficient:
          'Only {have} of {need} recommended cards were entered. The {words}-word phrase is deterministic, but its security cannot exceed the approximately {bits} bits supplied. Use only for testing until the recommendation is met.',
        methodAscii:
          'SHA-256 hashes the ASCII transcript (AS 2C TD), then the first {bits} bits become the selected {words}-word seed. One shuffled deck is about 225.6 bits.',
        methodColeman:
          "SHA-256 hashes Ian Coleman's suit-symbol transcript (A♠ 2♣ T♦), then the first {bits} bits become the selected {words}-word seed. One shuffled deck is about 225.6 bits.",
      },
      dice: {
        count: '{n} rolls of a fair six-sided die ≈ {bits} bits.',
        extra:
          'All {n} rolls, including {extra} beyond the recommendation, are included in the hash.',
        insufficient:
          'Only {have} of {need} recommended fair-die rolls were entered. The {words}-word phrase is deterministic, but its security cannot exceed the approximately {bits} bits supplied. Use only for testing until the recommendation is met.',
        methodColdcard:
          'Hashed rolls / Base 10 [0-9]: SHA-256 hash the complete original dice digit string, then use the first {bits} bits for the selected {words}-word seed. This matches COLDCARD and SeedSigner.',
        methodColeman:
          'Hashed rolls / Dice [1-6]: convert every 6 to 0, SHA-256 hash the complete mapped digit string, then use the first {bits} bits for the selected {words}-word seed. This matches the method used by Keystone.',
      },
      numberBases: {
        entropy: '{digits} {unit} = {bits} bits of {label} entropy.',
        finalLength: 'BIP39 entropy length: {bits} bits → {words}-word seed.',
        mixedRadixMany:
          'The final character is mixed-radix: it contributes the remaining {n} entropy bits and must be one of {chars}.',
        mixedRadixOne:
          'The final character is mixed-radix: it contributes the remaining {n} entropy bit and must be one of {chars}.',
        trailingCoinBits:
          '{full} complete {label} characters are followed by {n} individual coin-flip entropy bits.',
        trailingCoinBit:
          '{full} complete {label} characters are followed by {n} individual coin-flip entropy bit.',
      },
      passphrase:
        'A BIP39 passphrase is in use. It creates a different wallet, is not printed in the recovery sheet, and must be preserved separately to recover this wallet.',
      passphraseInUse:
        'A passphrase is in use. The same words without this passphrase are a different wallet. Do not store the passphrase with the words.',
      privateKey: {
        brainHdEntropyExact:
          'SHA-256 of the exact UTF-8 text is 32 bytes of BIP39 entropy (256 bits → 24 words).',
        brainHdEntropyTrimmed:
          'SHA-256 of the UTF-8 text with boundary whitespace trimmed is 32 bytes of BIP39 entropy (256 bits → 24 words).',
        brainHdMnemonic:
          'A valid mnemonic does not mean it is the same wallet as hashing the text as a Core private key.',
        brainHdNotBackup:
          'This is not a BIP39 passphrase, and it is not a Bitcoin Core hdseed or address-key backup.',
        brainHdStrength:
          'Lab only. Strength is the entropy of this text, not the 24-word count.',
        brainHdUnsalted:
          'SHA-256(text) is unsalted and fast. Anyone who can guess the text recovers the wallet.',
        brainRecoveryExact: 'Brain wallet recovery: SHA-256 used the passphrase exactly as entered.',
        brainRecoveryTrimmed:
          'Brain wallet recovery: SHA-256 used the passphrase after trimming leading and trailing whitespace.',
        brainWarning:
          'Brain wallets are dangerous. Humans pick guessable phrases. Anyone who guesses the phrase takes the coins. Prefer dice or a hardware-verified seed.',
        hex: 'Decoded a 32-byte hex private key.',
        mini: 'Casascius mini private key decoded via SHA-256.',
        wifCompressed: 'Decoded a compressed WIF private key (starts with K or L on mainnet).',
        wifUncompressed: 'Decoded an uncompressed WIF private key (starts with 5 on mainnet).',
      },
    },
    walletData: 'Wallet data',
    walletDataIntro:
      'Review the root material derived from this seed. Private recovery data is grouped first; watch-only data appears below.',
    walletRecoveryDetails: 'Wallet recovery details',
    wifCompressed: 'WIF compressed',
    wifUncompressed: 'WIF uncompressed',
  },
  seed: {
    count: '{entered} of {words} BIP39 words entered',
    finalPrefix: '{progress} · {n} valid checksum word(s) start with "{prefix}".',
    how: 'How to enter a seed phrase',
    lastWordLabel: 'Valid final word ({n} choices)',
    lastWordPlaceholder: 'Choose a confirmed final word',
    meta: {
      checksumInvalid: '{progress} · BIP39 checksum invalid · final word number highlighted',
      chooseFinal: '{progress} · choose the final checksum word · {n} valid choices',
      extra: '{entered} entered · {words} required · {n} extra highlighted · remove to continue',
      extraWords: '{entered} entered · {words} required BIP39 words · {n} extra highlighted · remove to continue',
      invalidNumber: '{progress} · Word {n} number “{token}” is outside {min}–{max} · correct to continue',
      invalidWord: '{progress} · Word {n} (“{word}”) is not on the BIP39 English list · correct to continue',
      numberProgress: '{entered} of {words} BIP39 word numbers entered',
      ready: '{progress} · checksum valid · ready to derive',
      remaining: '{progress} · {remaining} remaining',
      remainingRange: '{progress} · {remaining} remaining · valid range {min}–{max}',
    },
    method: {
      numbers: 'BIP39 word numbers',
      numbersDesc: 'Enter each word\'s position in the standard English list, using 1 through 2048 by default.',
      words: 'Direct word entry',
      wordsDesc: 'Type or paste the English BIP39 words themselves.',
    },
    nextWord: 'Next word',
    noFinalPrefix: '{progress} · No valid checksum word starts with "{prefix}".',
    numbersHelp: 'Enter one {range} number for each word, separated by spaces. The corresponding BIP39 words appear below.',
    numbersLabel: 'Your {words} BIP39 word numbers',
    numbersPlaceholder0: '0 1 2 …',
    numbersPlaceholder1: '1 2 3 …',
    range0: '0 through 2047',
    range1: '1 through 2048',
    requirementNumbers: 'Enter exactly {words} BIP39 word numbers using {range}.',
    requirementWords: 'Enter exactly {words} BIP39 words. Extended keys ignore this selection.',
    zeroIndex: 'Use zero-indexed word numbers',
    zeroIndexNote: '(0–2047 instead of the default 1–2048)',
  },
  seedLength: {
    entropy: '{words} words use {bits} bits of BIP39 entropy.',
    label: 'Seed phrase length',
    words: '{n} words',
  },
  vanity: {
    tabLabel: 'Vanity',
    intro: {
      kicker: 'Same key, same counter, same address',
      title: 'Grind a vanity address',
      description:
        'Pick a Key Station key and turn one of its dials. Passphrase grind extends the key\'s BIP39 passphrase with counter characters (base-62 over a-zA-Z0-9 in odometer order: "aaa…", "aab…"); derivation grind keeps the passphrase and steps through account indexes. Every candidate is derived the standard way — PBKDF2 seed, BIP32 path — in a dedicated WebAssembly module, one Web Worker per CPU core, and its address of the selected type (including BIP-352 Silent Payment codes) is checked against your prefix. This invents no entropy: same key and counter always reproduce the same address, so every result replays by hand, and Update key writes the winning passphrase or account back to the key it came from.',
    },
    warnings: {
      passphrase:
        'A vanity passphrase is a BIP39 passphrase: the seed words alone no longer recover the wallet. After Update key, record the passphrase with the same care as the words.',
      mainnet:
        'Matching is Bitcoin mainnet, at the key\'s first receive address (its own purpose, account, branch, and address index). Update key re-derives the key, so the Keys tab, its exports, and the Journal show the vanity wallet.',
      privacy:
        'Found passphrases remain in this page only and are never intentionally stored or sent. Memory clearing is best-effort because browsers may retain internal copies; close the page before reconnecting the computer.',
    },
    source: {
      heading: 'Bring in a key from Key Station',
      selectedKey: 'Selected key',
      startingPassphrase: 'Starting passphrase',
      placeholder: 'No passphrase — the key uses its seed words alone',
      noKeyYet:
        'Derive a key on the Keys tab first — the grinder searches that key\'s passphrase or account index. A key with seed words supports both methods; a root-xprv key supports the derivation grind only.',
    },
    form: {
      method: 'Method',
      addressType: 'Address type',
      addressPrefix: 'Address prefix',
      passphraseLength: 'Passphrase length',
      startCounter: 'Start counter',
      rangeSize: 'Range size',
      startAccount: 'Start account',
      accountsToTry: 'Accounts to try',
      workers: 'Workers',
      methodOptions: {
        passphrase: 'Passphrase grind',
        derivation: 'Derivation grind',
      },
      scriptOptions: {
        p2pkh: 'Legacy P2PKH · 1…',
        p2shP2wpkh: 'Nested SegWit P2SH-P2WPKH · 3…',
        p2wpkh: 'Native SegWit P2WPKH · bc1q…',
        p2tr: 'Taproot P2TR · bc1p…',
        sp: 'Silent Payments BIP-352 · sp1qq…',
      },
      help: {
        methodPassphrase:
          'Each candidate is the starting passphrase followed by the counter characters, stretched into a seed (2,048 PBKDF2 rounds) and derived at the key\'s path. A match is a new passphrase for this key.',
        prefixP2wpkh:
          'Native SegWit P2WPKH prefix, starts with “bc1q”. Live-filtered to lowercase bech32 characters; each free character multiplies the work by ~32.',
        passphraseLength:
          'Counter characters a-zA-Z0-9 appended after the starting passphrase. 62^10 counters fill the 64-bit counter; longer passphrases grind their low range.',
        startCounter: 'First counter tried. Counter 0 is "aaa…".',
        rangeSize:
          'Candidates to grind. After a run, Start continues where the range ended.',
        startAccount:
          'First BIP32 account index tried (0 to 2,147,483,647). Each match is an account index holding the vanity address.',
        accountsToTry:
          'Account indexes to grind. After a run, Start account continues where the range ended.',
        workers:
          'One per CPU core is fastest; defaults to this device\'s core count.',
      },
    },
    actions: {
      startGrinding: 'Start grinding',
      stop: 'Stop',
      stopOnFirstFind: 'Stop on first find',
      clearResults: 'Clear results',
    },
    result: {
      airGapOnly: '(air-gap only)',
      copied: 'Copied',
      key: 'Key',
    },
    status: {
      idle: 'Idle. No range has been ground this session.',
    },
  },
  sync: {
    description: '(Keeps non-hashed methods synchronized. Hashed inputs update them one way and are never overwritten.)',
    entropyUnknown: 'entropy unknown · only as strong as the text',
    shortfall: '{n} bits of entropy · under {min}',
    status: 'Key synced',
    title: 'Sync entropy across methods',
  },
} as const;

export function formatCopy(
  template: string,
  values: Record<string, number | string>,
): string {
  return Object.entries(values).reduce(
    (copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

/** Semantic branch data from the native Advanced-entry state. */
export type KeyDerivationAdvancedCopyBranch = {
  readonly index: number;
  readonly role: KeyDerivationAdvancedCopyBranchRole;
};

export type KeyDerivationAdvancedCopyBranchRole =
  | 'receive'
  | 'change'
  | 'custom';

export type KeyDerivationAdvancedCopyNetworkKind =
  | 'mainnet'
  | 'testnet'
  | 'custom-mainnet-addresses'
  | 'invalid';

export type KeyDerivationAdvancedCopyPathHelpKind =
  | 'exact'
  | 'multiple-branches'
  | 'multiple-indexes'
  | 'multiple-branches-and-indexes'
  | 'invalid';

export type KeyDerivationAdvancedCopyValidationKind =
  | 'valid'
  | 'account-prefix'
  | 'branch-start'
  | 'branch-range'
  | 'address-start'
  | 'address-range';

function formatKeyDerivationNumber(value: number): string {
  return value.toLocaleString();
}

/** Direct upstream enum label tables used by Studio. */
export const UPSTREAM_UI_LABELS = {
  hexFormat: hodlHexFormatLabels,
  keyMode: hodlKeyModeLabels,
  scriptBeginner: hodlScriptBeginnerTexts,
} as const;

export const UPSTREAM_UI_FALLBACK_COPY = {
  common: {
    back: 'Back',
  },
  calculations: {
    die: (number: number) => `Die ${number}`,
    numberBaseConversion: (shortLabel: string) =>
      `Each ${shortLabel} digit uses the binary value shown below before the 11-bit BIP39 calculations.`,
    numberBaseDigitValues: (shortLabel: string) => `${shortLabel} digit values`,
    numberBaseTitle: (label: string) => `${label} calculations`,
    word: (number: number) => `Word ${number}`,
  },
  cards: {
    colemanNote: '(show and hash A♠ 2♣ instead of As 2c)',
    deal24: 'deal all 52 unique cards, shuffle again, then deal 6 more',
    dealN: (needed: number) => `deal ${needed} unique cards without putting them back`,
    directComplete: (entered: number, needed: number, wordCount: number) =>
      `${entered} of ${needed} rank draws entered · checksum-valid ${wordCount}-word seed ready to derive`,
    directHelp: (partialWords: number) =>
      `For each of the first ${partialWords} words, shuffle and draw from A–8 three times, then A–4 once. Each four-character group selects one word; spaces separate the groups. The shorter final group supplies the remaining entropy bits, and EntropyLab calculates the BIP39 checksum bits.`,
    directProgress: (entered: number, needed: number, step: string) =>
      `${entered} of ${needed} rank draws entered · ${step}`,
    directTranscript: 'Rank-only draw transcript',
    duplicateError: (card: string) =>
      `Do not repeat a card in the same shuffle. Repeated: ${card}.`,
    emptyError: 'Deal at least one card from a shuffled deck.',
    formatError: (ignored: string) =>
      `Cards use rank then suit, like AS, 10H, or TD. Ignored: ${ignored}`,
    hashedInputHelp: (deal: string) =>
      `Each valid card updates a deterministic test seed. For real security, ${deal}. SHA-256 hashes the ASCII transcript (As 2c Td).`,
    invalidRank: (count: number) => `${count} invalid rank highlighted`,
    invalidRanks: (count: number) => `${count} invalid ranks highlighted`,
    extraCard: (count: number) => `${count} extra card highlighted`,
    extraCards: (count: number) => `${count} extra cards highlighted`,
    checksumError: 'The direct card sequence did not produce a valid BIP39 checksum.',
    placeholders: {
      direct: 'A284 37A2 …',
      ianColeman: 'A♠ 2♣ T♥ T♦…',
      standard: 'As 2c Th Td…',
    },
    suits: {
      clubs: 'Clubs',
      diamonds: 'Diamonds',
      hearts: 'Hearts',
      spades: 'Spades',
    },
  },
  dice: {
    d8d16: {
      groups: (completedGroups: number, partialWords: number, activeWord: number) =>
        `Group ${completedGroups} of ${partialWords} · word ${activeWord}`,
      rollsComplete: (partialWords: number) =>
        `${partialWords} of ${partialWords} word rolls complete`,
    },
    errors: {
      empty: 'Enter at least one dice roll (faces 1–6).',
      invalidFaces: (characters: string) =>
        `Dice must be faces 1–6. Ignored characters: ${characters}`,
    },
    placeholders: {
      bitbox: '111111 222224…',
      d8d16: '100 2AF…',
      hashed: '415263415263…',
    },
  },
  keyboard: {
    modeButton: 'aA1',
    spaceButton: 'space',
  },
  keys: {
    scriptTypeKicker: (purpose: string, network: string) => `Purpose ${purpose} · ${network}`,
    advanced: (() => {
      const hardeningLabel = (hardened: boolean) =>
        hardened ? 'Hardened' : 'Unhardened';

      const coinTypeLabel = (
        networkKind: KeyDerivationAdvancedCopyNetworkKind,
      ) => {
        switch (networkKind) {
          case 'mainnet':
            return UPSTREAM_TEXT.keys.coinTypeNetworks.mainnet;
          case 'testnet':
            return UPSTREAM_TEXT.keys.coinTypeNetworks.testnet;
          case 'custom-mainnet-addresses':
            return UPSTREAM_TEXT.keys.coinTypeNetworks.customMainnetAddresses;
          case 'invalid':
            return 'Custom';
        }
      };

      const branchLabel = ({
        index,
        role,
      }: KeyDerivationAdvancedCopyBranch): string => {
        switch (role) {
          case 'receive':
            return UPSTREAM_TEXT.keys.branchLabels.receive;
          case 'change':
            return 'Change';
          case 'custom':
            return `Custom branch ${index}`;
        }
      };

      const branchSummary = (
        branches: readonly KeyDerivationAdvancedCopyBranch[],
      ) => branches.map(branchLabel).join(' and ');

      const addressCopies = (
        branches: readonly KeyDerivationAdvancedCopyBranch[],
        range: number,
      ) =>
        branches
          .map(
            branch =>
              `${formatKeyDerivationNumber(range)} ${branchLabel(
                branch,
              ).toLowerCase()}`,
          )
          .join(' and ');

      return {
        addressRangeHelp: (
          branches: readonly KeyDerivationAdvancedCopyBranch[],
          range: number,
          addressCount: number,
          maximum: number,
        ) =>
          `Derives ${addressCopies(branches, range)} ${
            addressCount === 1 ? 'address' : 'addresses'
          } · Max ${formatKeyDerivationNumber(maximum)}`,
        addressEstimate: (duration: string) =>
          `Estimated derivation time on this device: ${duration}.`,
        formatAddressEstimate: (milliseconds: number): string => {
          if (!Number.isFinite(milliseconds) || milliseconds < 100) {
            return UPSTREAM_TEXT.keys.addressEstimate.underPointOneSeconds;
          }
          if (milliseconds < 10_000) {
            return formatCopy(UPSTREAM_TEXT.keys.addressEstimate.aboutSeconds, {
              n: (milliseconds / 1_000).toFixed(1),
            });
          }
          if (milliseconds < 60_000) {
            return formatCopy(UPSTREAM_TEXT.keys.addressEstimate.aboutSeconds, {
              n: Math.round(milliseconds / 1_000),
            });
          }
          return formatCopy(UPSTREAM_TEXT.keys.addressEstimate.aboutMinutes, {
            n: Math.ceil(milliseconds / 60_000),
          });
        },
        addressStartHelp: (
          branches: readonly KeyDerivationAdvancedCopyBranch[],
          hardened: boolean,
        ) =>
          `First ${branchSummary(
            branches,
          ).toLowerCase()} index to derive · ${hardeningLabel(
            hardened,
          )} · 0 to 2,147,483,647`,
        branchLabel,
        branchRangeHelp: (
          branches: readonly KeyDerivationAdvancedCopyBranch[],
          hardened: boolean,
          maximum: number,
        ) =>
          `Derives ${branchSummary(branches)} ${hardened ? 'hardened ' : ''}${
            branches.length === 1 ? 'branch' : 'branches'
          } · Max ${maximum}`,
        branchStartHelp: (hardened: boolean) =>
          `First address branch to derive · 0 is Receive · 1 is Change · ${hardeningLabel(
            hardened,
          )} · 0 to 2,147,483,647`,
        coinTypeIndexHelp: (
          networkKind: KeyDerivationAdvancedCopyNetworkKind,
          hardened: boolean,
        ) =>
          `Coin type index · ${coinTypeLabel(networkKind)} · ${hardeningLabel(
            hardened,
          )} · 0 to 2,147,483,647`,
        coinTypeLabel,
        derivationPathHelp: (
          kind: KeyDerivationAdvancedCopyPathHelpKind,
        ): string | undefined => {
          switch (kind) {
            case 'exact':
              return UPSTREAM_TEXT.keys.derivationPathHelp;
            case 'multiple-branches':
              return 'Multiple address branches selected · path shown through the account level.';
            case 'multiple-indexes':
              return 'Multiple address indexes selected · path shown through the address branch.';
            case 'multiple-branches-and-indexes':
              return 'Multiple address branches and indexes selected · path shown through the account level.';
            case 'invalid':
              return undefined;
          }
        },
        pathValidationHelp: (
          kind: KeyDerivationAdvancedCopyValidationKind,
          branchMaximum: number,
          addressMaximum: number,
        ): string | undefined => {
          switch (kind) {
            case 'valid':
              return undefined;
            case 'account-prefix':
              return 'Complete the purpose, network, and account indexes.';
            case 'branch-start':
              return 'Starting address branch index must be a whole number from 0 to 2,147,483,647.';
            case 'branch-range':
              return `Address branch range must be a whole number from 1 to ${branchMaximum}.`;
            case 'address-start':
              return 'Starting address index must be a whole number from 0 to 2,147,483,647.';
            case 'address-range':
              return `Address range must be a whole number from 1 to ${formatKeyDerivationNumber(addressMaximum)}.`;
          }
        },
        genericAddressStartHelp: (hardened: boolean) =>
          `First address index to derive · ${hardeningLabel(
            hardened,
          )} · 0 to 2,147,483,647`,
        hardeningLabel,
        invalidAddressRangeHelp: 'Choose a valid address range.',
        invalidBranchRangeHelp: 'Choose one or two valid address branches.',
        accountIndexHelp: (hardened: boolean) =>
          `Account index · ${hardeningLabel(hardened)} · 0 to 2,147,483,647`,
        purposeIndexHelp: (hardened: boolean) =>
          `Purpose index · ${hardeningLabel(hardened)} · 0 to 2,147,483,647`,
      } as const;
    })(),
  },
  numberBases: {
    entropyLabel: (label: string, wordCount: number) =>
      `${label} entropy for a ${wordCount}-word seed`,
    exceptMixed: ' except for a mixed-radix final character when needed',
    finalBits: (bitCount: number) =>
      ` · final ${bitCount} entropy bits must each be 0 or 1`,
    finalCharacter: (bitCount: number, characters: string) =>
      ` · final ${bitCount}-bit character must be one of ${characters}`,
    help: (
      shortLabel: string,
      bitsPerDigit: number,
      except: string,
      digits: number,
      spaces: string,
      remainder: string,
    ) =>
      `Each complete ${shortLabel} character contributes ${bitsPerDigit} bit${bitsPerDigit === 1 ? '' : 's'}${except}. Seed-word cards fill as enough bits arrive; the checksum-derived final word appears when all ${digits} characters are entered.${spaces}${remainder} No generator — enter entropy you already created.`,
    invalid: (count: number) =>
      ` · ${count} invalid character${count === 1 ? '' : 's'} highlighted`,
    progress: (
      entered: number,
      limit: number,
      unit: string,
      filled: number,
      wordCount: number,
    ) => `${entered} of ${limit} ${unit} · ${filled} of ${wordCount} seed words filled`,
    ready: ' · ready to derive',
    spacesBin: ' Spaces are added every 11 bits.',
    coinNext: (digits: number, shortLabel: string, entered: number, total: number) =>
      `${digits} ${shortLabel} characters complete · coin flip ${entered} of ${total} · Heads (0) or Tails (1)`,
    coinReady: (digits: number, shortLabel: string, entered: number, total: number) =>
      `${digits} ${shortLabel} characters complete · ${entered} of ${total} coin flips entered`,
    excess: (count: number) => ` · ${count} extra highlighted · remove to continue`,
  },
  privateKey: {
    progress: {
      brain: {
        boundaryWhitespaceWillBeTrimmed: 'boundary whitespace will be trimmed',
        empty: () => 'No text entered · brain wallets are unsafe',
        entered: (convention: string) => `Text entered · ${convention} · brain wallets are unsafe`,
        exactText: 'exact text will be used',
        exactTextWithBoundaryWhitespace: 'exact text will be used, including boundary whitespace',
        trimEnabledNoBoundaryWhitespace: 'trim enabled; no boundary whitespace present',
        trimmedEmpty: () =>
          'Boundary whitespace trimming leaves an empty passphrase · enter non-whitespace text or turn trimming off',
      },
      hex: {
        excess: (enteredCount: number, requiredCount: number) =>
          `${enteredCount} hexadecimal characters entered · ${requiredCount} required`,
        ready: (enteredCount: number, requiredCount: number) =>
          `${enteredCount} of ${requiredCount} hexadecimal characters entered · valid secp256k1 private key · ready to derive`,
        remaining: (enteredCount: number, requiredCount: number, remainingCount: number) =>
          `${enteredCount} of ${requiredCount} hexadecimal characters entered · ${remainingCount} remaining`,
      },
      mini: {
        excess: (enteredCount: number, maximumCount: number) =>
          `${enteredCount} Mini-key characters entered · ${maximumCount} maximum`,
        prefix: (minimumCount: number, maximumCount: number) =>
          `0 of ${minimumCount} or ${maximumCount} Mini-key characters entered · must start with S`,
        ready: (enteredCount: number, requiredCount: number) =>
          `${enteredCount} of ${requiredCount} Mini-key characters entered · checksum valid · ready to derive`,
        remaining: (enteredCount: number, requiredCount: number, remainingCount: number) =>
          `${enteredCount} of ${requiredCount} Mini-key characters entered · ${remainingCount} remaining`,
      },
      wif: {
        excess: (enteredCount: number, requiredCount: number) =>
          `${enteredCount} WIF characters entered · ${requiredCount} required`,
        prefix: (enteredCount: number, minimumCount: number, maximumCount: number) =>
          `${enteredCount} of ${minimumCount} or ${maximumCount} WIF characters entered · starts with 5, K, or L`,
        ready: (enteredCount: number, requiredCount: number) =>
          `${enteredCount} of ${requiredCount} WIF characters entered · Bitcoin mainnet checksum valid · ready to derive`,
        remaining: (enteredCount: number, requiredCount: number, remainingCount: number) =>
          `${enteredCount} of ${requiredCount} WIF characters entered · ${remainingCount} remaining`,
      },
    },
  },
  result: {
    checkAnAddress: 'Check an address',
    checkAnAddressPlaceholder: 'Paste bc1… or a 1… / 3… address',
    checkAnAddressHelp:
      'Paste an address shown by another wallet. A match means that wallet computed the same selected branch and derivation, even if the index is beyond the table above.',
    nativeSegwitBip48: 'Native SegWit · BIP48',
    bitcoinCore: (label: string) => `Bitcoin Core ${label}`,
    genericDescriptorCompatibility: (label: string) =>
      formatCopy(UPSTREAM_TEXT.result.genericDescriptorCompatibility, { name: label }),
    multisigCosigner: (prefix: string, label: string) =>
      formatCopy(UPSTREAM_TEXT.result.multisigCosigner, { prefix, label }),
    address: (label: string, index: number) => `${label} address #${index}`,
    addressCheckMatch: (
      label: string,
      index: number,
      path: string,
      beyondShown: boolean,
      shownCount: number,
    ) =>
      `${label} address #${index} of this wallet · ${path}${
        beyondShown ? ` (beyond the ${shownCount} shown)` : ''
      }`,
    addressCheckSearching: (shownCount: number) =>
      formatCopy(UPSTREAM_TEXT.result.addressCheckSearching, { n: shownCount }),
    addressCheckMiss: (branchSummary: string, start: number, end: number) =>
      `No match in ${branchSummary.toLowerCase()} indices ${start}–${end} of this derivation.`,
    addressesWithWif: (label: string) =>
      formatCopy(UPSTREAM_TEXT.result.addressesWithWif, { label }),
    watchOnlyWalletDescriptor: 'Watch-only wallet descriptor',
    masterSeedHex: 'Master seed hex',
    seedPhrase: (wordCount: number) => `Your seed phrase · ${wordCount} words`,
    spendingDescriptor: (branch: string) => `Spending ${branch.toLowerCase()} descriptor`,
    watchOnlyDescriptor: (branch: string) => `Watch-only ${branch.toLowerCase()} descriptor`,
    slip132: (label: string) => `SLIP-132 ${label}`,
  },
  seedPhrase: {
    autocomplete: 'Autocomplete BIP39 words',
    placeholder: (wordCount: number) => `Enter exactly ${wordCount} BIP39 words`,
    wordsHelp: (wordCount: number, partialWords: number) =>
      `Enter exactly ${wordCount} English BIP39 words. You can also paste an extended key here; the selected phrase length does not apply to extended keys. With ${partialWords} compatible diceware words, choose the final checksum word below.`,
    wordsLabel: (wordCount: number) => `Your ${wordCount}-word seed phrase`,
  },
  brainWallet: {
    outputs: {
      hd: {
        description:
          'The digest is 256-bit BIP39 entropy for a 24-word seed. Not the same wallet as the single key pair.',
        title: 'HD wallet with seed phrase',
      },
      scalar: {
        description: 'The digest is the private key. One address, the original brain-wallet behaviour.',
        title: 'Single key pair',
      },
    },
    warning: {
      acknowledgementDescription: 'Required once this session, in page memory only.',
      hdLines: [
        'The 24-word count is not the strength; the text is.',
        'A valid mnemonic does not mean it is the same wallet as hashing the text as a private-key scalar.',
      ],
      lines: [
        'SHA-256(text) is unsalted and fast. Guessable phrases are stolen coins.',
        'Strength is the entropy of this text, nothing more.',
        'This is not a BIP39 passphrase.',
        'This is not a Bitcoin Core hdseed or address-key backup of the same wallet.',
      ],
      title: 'Brain wallet warning — read before use',
    },
  },
  vanity: {
    actions: {
      grinding: 'Grinding…',
      stopOnFirstEnabled: 'Stop on first find: on',
      updateKey: 'Update key',
      updating: 'Updating…',
    },
    source: {
      noSelectedKey:
        'Pick the key to grind. Its passphrase and derivation settings come along exactly as set on the Keys tab: a key with seed words supports both methods, a root-xprv key the derivation grind only.',
      seedWords: 'BIP39 seed words',
      rootXprv: 'Root xprv',
      fromKey: (label: string) => `· from key ${label}`,
      kind: (
        hasMnemonic: boolean,
        name: string | undefined,
        label: string,
        derivationPath: string,
      ) =>
        `${hasMnemonic ? 'BIP39 seed words' : 'Root xprv'}${
          name && name !== label ? ` · ${name}` : ''
        } · ${derivationPath}`,
      rootXprvNote: (label: string) =>
        `Key ${label} was imported as a root xprv: it has no seed words, so its passphrase cannot be extended — only the derivation grind is available.`,
      withPassphraseNote: (label: string) =>
        `Copied verbatim from key ${label}'s Optional BIP39 passphrase on the Keys tab. Passphrase grind: candidates are this text followed by the counter characters. Derivation grind: this exact passphrase, with the account index changing.`,
      withoutPassphraseNote: (label: string) =>
        `Key ${label} has no passphrase. Passphrase grind: candidates are the counter characters alone. Derivation grind: no passphrase, with the account index changing.`,
    },
    form: {
      scriptNames: {
        p2pkh: 'Legacy P2PKH',
        p2shP2wpkh: 'Nested SegWit P2SH-P2WPKH',
        p2wpkh: 'Native SegWit P2WPKH',
        p2tr: 'Taproot P2TR',
        sp: 'Silent Payments BIP-352',
      },
      methodDerivationHelp:
        'The passphrase stays as it is; each candidate is the next BIP32 account index at the key\'s path. A match is an account index holding the vanity address — Update key sets it on the key.',
      prefixPlaceholder: (prefix: string) => `${prefix}…`,
      prefixHelp: {
        silentPayment: (
          label: string,
          prefix: string,
          firstFree: readonly string[],
        ) =>
          `${label} code, starts with “${prefix}”; the next character is one of ${firstFree.join(' ')} (the scan key's parity). Live-filtered to lowercase bech32 characters; each further free character multiplies the work by ~32.`,
        bech32: (label: string, prefix: string) =>
          `${label} prefix, starts with “${prefix}”. Live-filtered to lowercase bech32 characters; each free character multiplies the work by ~32.`,
        base58: (label: string, prefix: string) =>
          `${label} prefix, starts with “${prefix}”. Live-filtered to base58 characters; each free character multiplies the work by ~58.`,
      },
    },
    estimate: {
      derivationWithoutRate:
        'Derivation grind: each candidate is a few BIP32 child steps.',
      passphraseWithoutRate:
        'Passphrase grind: each candidate is a full BIP39 seed stretch.',
      formatDuration: (seconds: number): string => {
        if (!Number.isFinite(seconds)) {
          return '';
        }
        if (seconds < 1) {
          return 'under a second';
        }
        if (seconds < 90) {
          const rounded = Math.round(seconds);
          return `${rounded} second${rounded === 1 ? '' : 's'}`;
        }
        const minutes = seconds / 60;
        if (minutes < 90) {
          return `${Math.round(minutes)} minutes`;
        }
        const hours = minutes / 60;
        if (hours < 48) {
          return `${Math.round(hours)} hours`;
        }
        const days = hours / 24;
        if (days < 730) {
          return `${Math.round(days)} days`;
        }
        return `${Math.round(days / 365).toLocaleString('en-US')} years`;
      },
      timing: (
        rate: string | number,
        running: boolean,
        workers: number,
        duration: string,
      ) =>
        `At about ${rate} candidates/s${
          running ? '' : ` on ${workers} worker${workers === 1 ? '' : 's'}`
        }, expect a match roughly every ${duration}.`,
      summary: (
        prefix: string,
        work: string | number,
        scriptLabel: string,
        timing: string,
      ) =>
        `Prefix “${prefix}” matches about 1 in ${work} ${scriptLabel} candidates on average. ${timing}`,
    },
    result: {
      showPassphrases: 'Show passphrases',
      counter: 'Counter',
      passphrase: 'Passphrase (keep it secret)',
      keyAfterUpdate: 'Key after update',
      matchesHeading: (derivation: boolean) =>
        `Matching ${derivation ? 'accounts' : 'passphrases'}`,
      overflow: (listed: number, found: string | number) =>
        `Only the first ${listed} matches are listed; ${found} found in total.`,
      maskedPassphrase: () => '•'.repeat(12),
      silentPaymentWhere: (path: string) =>
        `the BIP-352 Silent Payment code of that account (scan ${path}/1h/0, spend …/0h/0)`,
      addressWhere: (scriptLabel: string, path: string) =>
        `the ${scriptLabel} address at ${path}`,
      derivationDescription: (sourceLabel: string, where: string) =>
        `Each row is a BIP32 account index of key ${sourceLabel} — with its passphrase unchanged, ${where} starts with the prefix. Update key sets that account on the key and re-derives it, so the Keys tab, its exports, and the Journal show this wallet.`,
      passphraseDescription: (sourceLabel: string, where: string) =>
        `Each row is a new BIP39 passphrase for key ${sourceLabel}: the starting passphrase followed by the counter characters. With this key's seed words it derives ${where}. Update key writes the passphrase to the key and re-derives it, so the Keys tab, its exports, and the Journal show this wallet. Anyone holding the words and this passphrase holds the coins.`,
      savedToKey: (label: string) => `Saved to key ${label}`,
    },
    status: {
      stopped: 'Stopped.',
      starting: (derivation: boolean, sourceLabel: string) =>
        derivation
          ? `Starting workers — stepping through account indexes of key ${sourceLabel}…`
          : `Starting workers — extending key ${sourceLabel}'s passphrase with the counter characters…`,
      progress: (
        done: string | number,
        total: string | number,
        rate: string | number,
        found: number,
      ) =>
        `${done} / ${total} candidates · ${rate}/s · ${found} match${
          found === 1 ? '' : 'es'
        }`,
      complete: (
        stopped: boolean,
        stopOnFirst: boolean,
        found: number,
        done: string | number,
        derivation: boolean,
        nextStart: string | number,
      ) =>
        `${
          stopped
            ? stopOnFirst && found > 0
              ? 'Stopped at first match'
              : 'Stopped'
            : 'Range complete'
        }: ${done} candidates, ${found} match${
          found === 1 ? '' : 'es'
        }. Next ${derivation ? 'account' : 'counter'}: ${nextStart}.`,
      saved: (
        savedTo: string,
        accountIndex: number | null,
        sourceLabel: string,
      ) =>
        `Saved to key ${savedTo}: ${
          accountIndex !== null ? `account ${accountIndex}` : 'the new passphrase'
        } is now on the key${
          sourceLabel !== savedTo
            ? ` — its master fingerprint and LifeHash changed from ${sourceLabel} to ${savedTo}`
            : ''
        }. Open the Keys tab to review and export it.`,
    },
    errors: {
      keyRequired:
        'Pick a Key Station key first — the grinder searches that key\'s passphrase or account index.',
      counterLabels: {
        startAccount: 'The start account',
        accountRange: 'The account range',
        startCounter: 'The start counter',
        rangeSize: 'The range size',
      },
      prefixMustStartWith: (scriptLabel: string, prefix: string) =>
        `${scriptLabel} addresses start with “${prefix}”; the prefix must too.`,
      prefixNeedsAdditionalCharacter: (scriptLabel: string, prefix: string) =>
        `Add at least one character after “${prefix}” — “${prefix}” alone matches every ${scriptLabel} address.`,
      prefixTooLong: (scriptLabel: string, maximum: number) =>
        `The prefix is longer than a whole ${scriptLabel} address (${maximum} characters).`,
      bech32Characters:
        'Bech32 addresses use qpzry9x8gf2tvdw0s3jn54khce6mua7l after the separator (no b, i, o, or 1).',
      base58Characters:
        'Base58 addresses use no 0 (zero), O, I, or l characters.',
      silentPaymentParity: (
        scriptLabel: string,
        prefix: string,
        firstFree: readonly string[],
      ) =>
        `The character after “${prefix}” encodes the scan key's parity: every ${scriptLabel} code continues with one of ${firstFree.join(', ')}.`,
      startingPassphraseTooLong: (length: number, maximum: number) =>
        `The starting passphrase is ${length} UTF-8 bytes, over the ${maximum}-byte vanity limit — shorten it on the Keys tab.`,
      mnemonicMissing:
        'The passphrase grind needs the key\'s seed words — this key has no mnemonic.',
      mnemonicTooLong: (length: number, maximum: number) =>
        `The mnemonic is ${length} UTF-8 bytes, over the ${maximum}-byte vanity limit.`,
      passphraseLength: (maximum: number) =>
        `Passphrase length is 1 to ${maximum} characters.`,
      counterRangeMinimum:
        'The start counter is zero or more; the range is at least one candidate.',
      counterStartBeyond: (passphraseLength: number) =>
        `The start counter is beyond the ${passphraseLength}-character counter space.`,
      counterRangePast: (passphraseLength: number, limit: string | number) =>
        `The range runs past the ${passphraseLength}-character space (${limit} counters).`,
      counterRangePast64Bit: 'The range runs past the 64-bit counter.',
      accountRangeMinimum:
        'The start account is zero or more; the range is at least one account.',
      accountStartBeyond:
        'The start account is beyond the BIP32 index range (0 to 2,147,483,647).',
      accountRangePast:
        'The range runs past the last BIP32 account index (2,147,483,647).',
      pathRoot:
        'Derivation path must start with m and contain slash-separated BIP32 indexes.',
      pathIndex:
        "Each derivation path index is a whole number from 0 to 2,147,483,647, optionally followed by h or '.",
      pathTooDeep: (maximum: number) =>
        `Derivation paths are at most ${maximum} components deep for the vanity grind.`,
      workersBlocked: 'Vanity workers are blocked in this context.',
      workerFailed: 'Vanity worker failed.',
      workerFailedToStart: 'Vanity worker failed to start.',
      accountPathNeedsComponents: (label: string) =>
        `Key ${label}'s derivation path needs purpose, coin type, and account components.`,
      mainnetOnly: (label: string, coinType: number) =>
        `Vanity matching is Bitcoin mainnet: key ${label} derives coin type ${coinType}. Pick a mainnet key (coin type 0).`,
      branchAndAddressIndexes: (label: string) =>
        `Key ${label}'s branch and address indexes must be whole numbers from 0 to 2,147,483,647.`,
      noMnemonicForPassphrase: (label: string) =>
        `Key ${label} has no seed words (root xprv), so its passphrase cannot be extended — switch to the derivation grind.`,
      noKeyMaterial: (label: string) =>
        `Key ${label} carries neither seed words nor a root xprv.`,
      watchOnly: (label: string) =>
        `Key ${label} is watch-only; the derivation grind needs private material.`,
      wholeNumber: (label: string) => `${label} is a whole number (digits only).`,
      keyNoLongerInStation: (label: string) =>
        `Key ${label} is no longer in Key Station, so there is nothing to update.`,
      derivationAlreadyRunning:
        'A derivation is already running on the Keys tab — wait for it to finish.',
      updateDerivationFailed: 'Deriving the updated key failed.',
    },
  },
} as const;
