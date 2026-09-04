/** Exact UI text rendered by upstream app.js but unavailable in en.json. */
export const UPSTREAM_UI_FALLBACK_COPY = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
  },
  cards: {
    colemanNote: '(show and hash A♠ 2♣ instead of As 2c)',
    hashedInputHelp: (deal: string) =>
      `Each valid card updates a deterministic test seed. For real security, ${deal}. SHA-256 hashes the ASCII transcript (As 2c Td).`,
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