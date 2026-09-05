import {
  hodlHexFormatLabels,
  hodlKeyModeLabels,
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
    coleman: 'Match Ian Coleman method',
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
  dice: {
    bitbox: {
      coin: 'Word {word} of {partial} · 6th die (interpreted as a coin flip)',
      desc: 'Use five dice showing 1–4, then a coin (or 6th die: 1–3 heads, 4–6 tails). Build {partialWords} lookup-table words, then choose 1 of {candidates} valid final checksum words.',
      die: 'Word {word} of {partial} · die {die} of 5 (faces 1–4)',
      lastWord: '{n} words · choose the final checksum word',
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
      enter: 'Enter a private key.',
      hex: 'Enter exactly 64 hexadecimal characters (0–9 and a–f).',
      miniFormat: 'Mini keys must start with S and contain 22 or 30 Bitcoin Base58 characters.',
      miniInvalid: 'Not a valid Casascius mini private key.',
      range: 'Private key is out of the secp256k1 range.',
      wif: 'Enter a valid {network} WIF private key ({hint}).',
    },
  },
  hex: {
    enterDigit: 'Enter {shortLabel} {character}',
    format: {
      base32: 'Crockford Base32',
      base4: 'Base 4',
      base8: 'Octal (Base 8)',
      bin: 'Binary (Base 2)',
    },
    heading: 'Number base',
    keypadAria: '{label} keypad',
    placeholder: 'Exactly {digits} {unit}',
    unit: {
      hex: 'hexadecimal characters',
    },
  },
  key: {
    brain: 'Brain wallet',
    brainDesc: 'Unsafe. SHA-256 of your text, as a single key pair or a 24-word seed.',
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
    methodLabel: 'Method',
  },
  mode: {
    cards: 'Cards',
    dice: 'Dice rolls',
    hex: 'Number bases',
    key: 'Private key',
    seed: 'Seed phrase',
  },
  note: {
    bitboxSkippedMany: 'Skipped {n} faces of 5 or 6 on the first five dice of a word (reroll).',
    bitboxSkippedOne: 'Skipped {n} face of 5 or 6 on the first five dice of a word (reroll).',
  },
  passphrase: {
    label: 'Optional BIP39 passphrase',
    placeholder: 'Enter a BIP39 passphrase, or leave blank for none',
  },
  result: {
    entropyHex: 'BIP39 entropy hex',
    privateKey: 'Private key material',
  },
  seed: {
    count: '{entered} of {words} BIP39 words entered',
    enterDigit: 'Enter {n}',
    how: 'How to enter a seed phrase',
    lastWordAria: 'Valid final word for {n}-word seed',
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
    numberKeypadAria: 'BIP39 word number keypad',
    numbersHelp: 'Enter one {range} number for each word, separated by spaces. The corresponding BIP39 words appear below.',
    numbersLabel: 'Your {words} BIP39 word numbers',
    numbersPlaceholder0: '0 1 2 …',
    numbersPlaceholder1: '1 2 3 …',
    range0: '0 through 2047',
    range1: '1 through 2048',
    wordSlotsAria: '{n} seed-word slots',
    zeroIndex: 'Use zero-indexed word numbers',
    zeroIndexNote: '(0–2047 instead of the default 1–2048)',
  },
  seedLength: {
    label: 'Seed phrase length',
    words: '{n} words',
  },
  sync: {
    description: '(Keeps non-hashed methods synchronized. Hashed inputs update them one way and are never overwritten.)',
    entropyUnknown: 'entropy unknown · only as strong as the text',
    status: 'Key synced',
    title: 'Sync entropy across methods',
  },
} as const;

/** Direct upstream enum label tables used by Studio. */
export const UPSTREAM_UI_LABELS = {
  hexFormat: hodlHexFormatLabels,
  keyMode: hodlKeyModeLabels,
} as const;

export const UPSTREAM_UI_FALLBACK_COPY = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
    seedLengthWords: (wordCount: number) => `${wordCount} words`,
    seedLengthEntropy: (wordCount: number, bitCount: number) =>
      `${wordCount} words use ${bitCount} bits of BIP39 entropy.`,
  },
  cards: {
    colemanNote: '(show and hash A♠ 2♣ instead of As 2c)',
    deal24: 'deal all 52 unique cards, shuffle again, then deal 6 more',
    dealN: (needed: number) => `deal ${needed} unique cards without putting them back`,
    directComplete: (entered: number, needed: number, wordCount: number) =>
      `${entered} of ${needed} rank draws entered · checksum-valid ${wordCount}-word seed ready to derive`,
    directHelp: (partialWords: number) =>
      `For each of the first ${partialWords} words, shuffle and draw from A–8 three times, then A–4 once. Each four-character group selects one word; spaces separate the groups. The shorter final group supplies the remaining entropy bits, and EntropyLab calculates the BIP39 checksum bits.`,
    directRequirement: (wordCount: number, partialWords: number, finalDraws: number) =>
      `${wordCount} words use ${partialWords} complete 11-bit rank selections plus ${finalDraws} final rank draw(s).`,
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
    hashedRequirement: (wordCount: number, bitCount: number, firstShuffleCards: number) =>
      `${wordCount} words need ${bitCount} bits. Deal ${firstShuffleCards} unique cards from one shuffled deck.`,
    hashedRequirement24:
      '24 words need 256 bits. One deck is about 225.6 bits, so deal 52 unique cards, shuffle again, then deal 6 more.',
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
    base64Entropy: (mode: string) => `On-screen ${mode} Base64 entropy keyboard`,
    base64EntropyChangeMode: () => 'Change Base64 entropy character mode',
    characterModeUnavailable: 'Character mode switching is available for the passphrase',
    deletePreviousCharacter: 'Delete previous character',
    enterCharacter: (character: string) => `Enter ${character}`,
    enterSpace: 'Enter space',
    modeButton: 'aA1',
    privateKey: (mode: string) => `On-screen ${mode} private key keyboard`,
    privateKeyChangeMode: () => 'Change private key character mode',
    privateKeyHex: 'On-screen hexadecimal private key keyboard',
    privateKeyInitial: (format: 'mini' | 'wif') =>
      `Choose the first ${format === 'wif' ? 'WIF' : 'Mini key'} character`,
    seedPhrase: 'On-screen lowercase seed phrase keyboard',
    spaceButton: 'space',
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
    mixedRemainder: (bitCount: number, characters: string) =>
      ` The final character is mixed-radix: it contributes only ${bitCount} bit(s) and must be one of ${characters}.`,
    progress: (
      entered: number,
      limit: number,
      unit: string,
      filled: number,
      wordCount: number,
    ) => `${entered} of ${limit} ${unit} · ${filled} of ${wordCount} seed words filled`,
    requirement: (wordCount: number, digits: number, unit: string) =>
      `${wordCount} words require exactly ${digits} ${unit}.`,
    ready: ' · ready to derive',
    setupRemainderBinary: (fullDigits: number, shortLabel: string, bitCount: number) =>
      ` Enter ${fullDigits} complete ${shortLabel} characters followed by ${bitCount} coin flip(s), using Heads (0) or Tails (1).`,
    setupRemainderMixed: (bitCount: number, characters: string) =>
      ` The final character contributes ${bitCount} bit(s) and must be one of ${characters}.`,
    remainderBinary: (fullDigits: number, shortLabel: string, bitCount: number) =>
      ` Enter ${fullDigits} complete ${shortLabel} characters; the controls and progress message then switch to ${bitCount} coin flip(s), using Heads (0) or Tails (1).`,
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
        empty: () => 'No text entered · brain wallets are unsafe',
        entered: () => 'Text entered · exact text will be used · brain wallets are unsafe',
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
    masterSeedHex: 'Master seed hex',
  },
  sync: {
    shortfall: (entropyBits: number, minimumEntropyBits: number) =>
      `${entropyBits} bits of entropy · under ${minimumEntropyBits}`,
  },
  seedPhrase: {
    autocomplete: 'Autocomplete BIP39 words',
    noFinalPrefix: (progress: string, prefix: string) =>
      `${progress} · No valid checksum word starts with "${prefix}".`,
    placeholder: (wordCount: number) => `Enter exactly ${wordCount} BIP39 words`,
    requirementNumbers: (wordCount: number, range: string) =>
      `Enter exactly ${wordCount} BIP39 word numbers using ${range}.`,
    requirementWords: (wordCount: number) =>
      `Enter exactly ${wordCount} BIP39 words. Extended keys ignore this selection.`,
    finalPrefix: (progress: string, count: number, prefix: string) =>
      `${progress} · ${count} valid checksum word(s) start with "${prefix}".`,
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