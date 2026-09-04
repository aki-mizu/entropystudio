type Bip39UiMockSetters = {
  readonly setBip39EntropyBits: (implementation: (targetWords: number) => number) => void;
};

const BIP39_ENTROPY_BITS: Readonly<Record<number, number>> = {
  12: 128,
  15: 160,
  18: 192,
  21: 224,
  24: 256,
};

export function installBip39UiFixtures({ setBip39EntropyBits }: Bip39UiMockSetters) {
  setBip39EntropyBits(targetWords => {
    const bitCount = BIP39_ENTROPY_BITS[targetWords];
    if (bitCount === undefined) {
      throw new Error('Unsupported BIP39 word count fixture.');
    }
    return bitCount;
  });
}