/** Exact UI text rendered by upstream app.js but unavailable in en.json. */
export const UPSTREAM_UI_FALLBACK_COPY = {
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