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
      title: 'Hashed rolls / Base 10 [0-9] (recommended)',
    },
    coleman: {
      desc: 'Convert each 6 to 0 and SHA-256 the complete mapped digit string, matching the method used by Keystone. Use the first {bits} bits; {hashRolls} rolls are recommended, and every entered roll is included.',
      title: 'Hashed rolls / Dice [1-6]',
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
    bitcoinCore: (label: string) => `Bitcoin Core ${label}`,
    genericDescriptorCompatibility: (label: string) =>
      `Generic ${label} for descriptor compatibility`,
    masterSeedHex: 'Master seed hex',
    seedPhrase: (wordCount: number) => `Your seed phrase · ${wordCount} words`,
    spendingDescriptor: (branch: string) => `Spending ${branch.toLowerCase()} descriptor`,
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
} as const;
