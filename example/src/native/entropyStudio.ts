import {
  DiceRollMethod,
  DirectDiceMethod as GeneratedDirectDiceMethod,
  DirectDiceStep as GeneratedDirectDiceStep,
  directDiceState,
  diceRollsToEntropy,
  entropyToMnemonic,
  EntropyStudioError_Tags,
  mnemonicToEntropy,
} from 'entropystudio';

export const DirectDiceMethod = {
  Bitbox: GeneratedDirectDiceMethod.Bitbox,
  D8D16: GeneratedDirectDiceMethod.D8d16,
} as const;

export const DirectDiceStep = {
  BitboxDie: GeneratedDirectDiceStep.BitboxDie,
  BitboxCoin: GeneratedDirectDiceStep.BitboxCoin,
  BitboxFinalWord: GeneratedDirectDiceStep.BitboxFinalWord,
  D8D16WordD8: GeneratedDirectDiceStep.D8d16WordD8,
  D8D16WordD16First: GeneratedDirectDiceStep.D8d16WordD16First,
  D8D16WordD16Second: GeneratedDirectDiceStep.D8d16WordD16Second,
  D8D16ChecksumD8: GeneratedDirectDiceStep.D8d16ChecksumD8,
  D8D16ChecksumD16: GeneratedDirectDiceStep.D8d16ChecksumD16,
  D8D16ChecksumCoin: GeneratedDirectDiceStep.D8d16ChecksumCoin,
  D8D16Correction: GeneratedDirectDiceStep.D8d16Correction,
  D8D16Complete: GeneratedDirectDiceStep.D8d16Complete,
} as const;

export {
  DiceRollMethod,
  directDiceState,
  diceRollsToEntropy,
  entropyToMnemonic,
  EntropyStudioError_Tags,
  mnemonicToEntropy,
};

export type { DirectDiceState } from 'entropystudio';