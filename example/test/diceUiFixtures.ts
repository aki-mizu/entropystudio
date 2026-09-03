type DiceUiMockSetters = {
  readonly getDirectDiceState: (
    rolls: string,
    method: number,
    targetWords: number,
  ) => Record<string, unknown> | undefined;
  readonly setDiceMethodInfo: (implementation: (targetWords: number) => unknown) => void;
  readonly setDirectDiceInputState: (
    implementation: (
      rolls: string,
      method: number,
      targetWords: number,
      selectedFinalWord: string,
    ) => unknown,
  ) => void;
  readonly setFormatDiceTranscript: (
    implementation: (rolls: string, method: number, targetWords: number) => string,
  ) => void;
  readonly setHashedDiceState: (
    implementation: (rolls: string, targetWords: number) => unknown,
  ) => void;
};

const DICE_METHOD_INFO: Record<
  number,
  {
    readonly checksumCandidates: number;
    readonly entropyBits: number;
    readonly finalSteps: readonly number[];
    readonly partialWords: number;
    readonly recommendedRolls: number;
  }
> = {
  12: {
    checksumCandidates: 128,
    entropyBits: 128,
    finalSteps: [0, 1],
    partialWords: 11,
    recommendedRolls: 50,
  },
  15: {
    checksumCandidates: 64,
    entropyBits: 160,
    finalSteps: [0, 0],
    partialWords: 14,
    recommendedRolls: 62,
  },
  18: {
    checksumCandidates: 32,
    entropyBits: 192,
    finalSteps: [1, 2],
    partialWords: 17,
    recommendedRolls: 75,
  },
  21: {
    checksumCandidates: 16,
    entropyBits: 224,
    finalSteps: [1],
    partialWords: 20,
    recommendedRolls: 87,
  },
  24: {
    checksumCandidates: 8,
    entropyBits: 256,
    finalSteps: [0],
    partialWords: 23,
    recommendedRolls: 99,
  },
};

const HASHED_DICE_EMPTY_STATES: Record<number, ReturnType<typeof hashedDiceFixture>> = {
  12: hashedDiceFixture(50),
  15: hashedDiceFixture(62),
  18: hashedDiceFixture(75),
  21: hashedDiceFixture(87),
  24: hashedDiceFixture(99),
};

const HASHED_DICE_STATE_FIXTURES: Record<string, ReturnType<typeof hashedDiceFixture>> = {
  '24:1': hashedDiceFixture(99, {
    canDerive: true,
    estimatedEntropyBits: 2.584962500721156,
    hasRolls: true,
    progress: 1 / 99,
    rollCount: 1,
  }),
  '24:6': hashedDiceFixture(99, {
    canDerive: true,
    estimatedEntropyBits: 2.584962500721156,
    hasRolls: true,
    progress: 1 / 99,
    rollCount: 1,
  }),
  [`24:${'1'.repeat(99)}x`]: hashedDiceFixture(99, {
    canDerive: true,
    estimatedEntropyBits: 255.91128757139444,
    hasRolls: true,
    invalidFaces: 'x',
    progress: 1,
    rollCount: 99,
  }),
  [`24:${'123456'.repeat(16)}123`]: hashedDiceFixture(99, {
    canDerive: true,
    estimatedEntropyBits: 255.91128757139444,
    hasRolls: true,
    progress: 1,
    rollCount: 99,
  }),
};

const DICE_TRANSCRIPT_FIXTURES: Record<string, string> = {
  '2:24:1111111': '111111 1',
  '2:24:111111222222333333': '111111 222222 333333',
  '2:24:11111122222333333': '111111 222223 33333',
  '2:24:111111333333': '111111 333333',
  '2:24:1111112242222333333': '111111 224222 233333 3',
  '3:24:1234': '123 4',
  '3:24:123456789': '123 456 789',
  '3:24:12356789': '123 567 89',
};

function hashedDiceFixture(
  recommendedRolls: number,
  overrides: Partial<{
    readonly canDerive: boolean;
    readonly estimatedEntropyBits: number;
    readonly hasRolls: boolean;
    readonly invalidFaces: string;
    readonly progress: number;
    readonly rollCount: number;
  }> = {},
) {
  return {
    allowedFaces: ['1', '2', '3', '4', '5', '6'],
    canDerive: false,
    estimatedEntropyBits: 0,
    hasRolls: false,
    invalidFaces: '',
    progress: 0,
    recommendedRolls,
    rollCount: 0,
    ...overrides,
  };
}

export function installDiceUiFixtures({
  getDirectDiceState,
  setDiceMethodInfo,
  setDirectDiceInputState,
  setFormatDiceTranscript,
  setHashedDiceState,
}: DiceUiMockSetters) {
  setDiceMethodInfo(targetWords => DICE_METHOD_INFO[targetWords]);
  setDirectDiceInputState((rolls, method, targetWords, _selectedFinalWord) => ({
    allowedFaces: [],
    canDerive: false,
    finalWord: '',
    mnemonic: '',
    progress: 0,
    ...(getDirectDiceState(rolls, method, targetWords) ?? {}),
  }));
  setFormatDiceTranscript(
    (rolls, method, targetWords) =>
      DICE_TRANSCRIPT_FIXTURES[`${method}:${targetWords}:${rolls}`] ?? rolls,
  );
  setHashedDiceState(
    (rolls, targetWords) =>
      HASHED_DICE_STATE_FIXTURES[`${targetWords}:${rolls}`] ?? HASHED_DICE_EMPTY_STATES[targetWords],
  );
}