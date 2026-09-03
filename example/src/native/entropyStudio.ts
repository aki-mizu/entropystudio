import {
  CardHashMethod,
  CardInputMethod,
  DirectCardStep as GeneratedDirectCardStep,
  DiceFinalStep,
  DiceInputMethod as GeneratedDiceInputMethod,
  DiceRollMethod,
  DirectDiceMethod as GeneratedDirectDiceMethod,
  DirectDiceStep as GeneratedDirectDiceStep,
  HashedCardInstruction,
  NumberBaseFormat as GeneratedNumberBaseFormat,
  PrivateKeyFormat as GeneratedPrivateKeyFormat,
  PrivateKeyInputStatus as GeneratedPrivateKeyInputStatus,
  SeedPhraseInputMethod as GeneratedSeedPhraseInputMethod,
  SeedPhraseStatus as GeneratedSeedPhraseStatus,
  analyzeNumberBaseInput,
  cardKeyAllowed,
  cardTranscriptToEntropy,
  diceMethodInfo,
  directCardState,
  directDiceInputState,
  directDiceState,
  diceRollsToEntropy,
  entropyToMnemonic,
  EntropyStudioError_Tags,
  formatDiceTranscript,
  hashedCardState,
  hashedDiceState,
  mnemonicToEntropy,
  normalizeCardToken,
  normalizeDirectCardTranscript,
  numberBaseEntropy,
  privateKeyEntropy,
  privateKeyInputState,
  privateKeyKeyAllowed,
  seedPhraseAutocomplete,
  seedPhraseKeyAllowed,
  seedPhraseNumbersToWords,
  seedPhraseSpaceAllowed,
  seedPhraseState,
  seedPhraseWordsToNumbers,
  translateSeedNumberIndices,
} from 'entropystudio';

export const DirectDiceMethod = {
  Bitbox: GeneratedDirectDiceMethod.Bitbox,
  D8D16: GeneratedDirectDiceMethod.D8d16,
} as const;

export const DiceInputMethod = {
  Bitbox: GeneratedDiceInputMethod.Bitbox,
  Coldcard: GeneratedDiceInputMethod.Coldcard,
  Coleman: GeneratedDiceInputMethod.Coleman,
  D8D16: GeneratedDiceInputMethod.D8d16,
} as const;

export const SeedPhraseInputMethod = {
  Words: GeneratedSeedPhraseInputMethod.Words,
  Numbers: GeneratedSeedPhraseInputMethod.Numbers,
} as const;

export const PrivateKeyFormat = {
  Wif: GeneratedPrivateKeyFormat.Wif,
  Hex: GeneratedPrivateKeyFormat.Hex,
  MiniKey: GeneratedPrivateKeyFormat.MiniKey,
  BrainWallet: GeneratedPrivateKeyFormat.BrainWallet,
} as const;

export const PrivateKeyInputStatus = {
  Empty: GeneratedPrivateKeyInputStatus.Empty,
  Prefix: GeneratedPrivateKeyInputStatus.Prefix,
  Incomplete: GeneratedPrivateKeyInputStatus.Incomplete,
  Invalid: GeneratedPrivateKeyInputStatus.Invalid,
  Excess: GeneratedPrivateKeyInputStatus.Excess,
  Ready: GeneratedPrivateKeyInputStatus.Ready,
} as const;

export const SeedPhraseStatus = {
  Remaining: GeneratedSeedPhraseStatus.Remaining,
  Extra: GeneratedSeedPhraseStatus.Extra,
  ChooseFinal: GeneratedSeedPhraseStatus.ChooseFinal,
  Ready: GeneratedSeedPhraseStatus.Ready,
  FinalPrefix: GeneratedSeedPhraseStatus.FinalPrefix,
  NoFinalPrefix: GeneratedSeedPhraseStatus.NoFinalPrefix,
  InvalidWord: GeneratedSeedPhraseStatus.InvalidWord,
  InvalidNumber: GeneratedSeedPhraseStatus.InvalidNumber,
  ChecksumInvalid: GeneratedSeedPhraseStatus.ChecksumInvalid,
} as const;

export const DirectCardStep = {
  Word: GeneratedDirectCardStep.Word,
  Final: GeneratedDirectCardStep.Final,
  Correction: GeneratedDirectCardStep.Correction,
  Complete: GeneratedDirectCardStep.Complete,
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
  CardHashMethod,
  CardInputMethod,
  DiceFinalStep,
  DiceRollMethod,
  HashedCardInstruction,
  GeneratedNumberBaseFormat as NumberBaseFormat,
  analyzeNumberBaseInput,
  cardKeyAllowed,
  cardTranscriptToEntropy,
  diceMethodInfo,
  directCardState,
  directDiceInputState,
  directDiceState,
  diceRollsToEntropy,
  entropyToMnemonic,
  EntropyStudioError_Tags,
  formatDiceTranscript,
  hashedCardState,
  hashedDiceState,
  mnemonicToEntropy,
  normalizeCardToken,
  normalizeDirectCardTranscript,
  numberBaseEntropy,
  privateKeyEntropy,
  privateKeyInputState,
  privateKeyKeyAllowed,
  seedPhraseAutocomplete,
  seedPhraseKeyAllowed,
  seedPhraseNumbersToWords,
  seedPhraseSpaceAllowed,
  seedPhraseState,
  seedPhraseWordsToNumbers,
  translateSeedNumberIndices,
};

export type {
  DiceMethodInfo,
  DirectCardState,
  DirectDiceState,
  HashedCardState,
  HashedDiceState,
  NumberBaseAnalysis,
  PrivateKeyInputState,
  SeedPhraseAutocompleteResult,
  SeedPhraseState,
} from 'entropystudio';