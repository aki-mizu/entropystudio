import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { DirectDiceState } from '../../../native/entropyStudio';
import type { DiceColors } from '../diceTheme';
import { SeedWordGrid } from './SeedWordGrid';
import type { SeedWordSlotLayout } from './SeedWordGrid';

type DiceWordListProps = {
  readonly compact?: boolean;
  readonly colors: DiceColors;
  readonly finalWord?: string;
  readonly slotCount?: number;
  readonly testID: string;
  readonly words: readonly string[];
};

type Props = {
  readonly compact?: boolean;
  readonly colors: DiceColors;
  readonly slotCount?: number;
  readonly state: DirectDiceState;
};

export function DiceWordList({
  compact = false,
  colors,
  finalWord,
  slotCount,
  testID,
  words,
}: DiceWordListProps) {
  const pendingWordIndex = useRef<number | null>(null);
  const previousWords = useRef(words);
  const scrollOffset = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollViewportHeight = useRef(0);
  const slotLayouts = useRef(new Map<number, SeedWordSlotLayout>());

  const revealPendingWord = useCallback(() => {
    const targetIndex = pendingWordIndex.current;
    const targetLayout =
      targetIndex === null ? undefined : slotLayouts.current.get(targetIndex);
    const scrollView = scrollRef.current;
    const viewportHeight = scrollViewportHeight.current;

    if (!targetLayout || !scrollView || viewportHeight <= 0) {
      return;
    }

    const visibleTop = scrollOffset.current;
    const visibleBottom = visibleTop + viewportHeight;
    const targetBottom = targetLayout.y + targetLayout.height;

    if (targetLayout.y >= visibleTop && targetBottom <= visibleBottom) {
      pendingWordIndex.current = null;
      return;
    }

    const nextOffset = Math.max(
      0,
      targetLayout.y < visibleTop
        ? targetLayout.y
        : targetBottom - viewportHeight,
    );
    scrollOffset.current = nextOffset;
    scrollView.scrollTo({ animated: true, y: nextOffset });
    pendingWordIndex.current = null;
  }, []);

  const handleSlotLayout = useCallback(
    (index: number, layout: SeedWordSlotLayout) => {
      slotLayouts.current.set(index, layout);
      revealPendingWord();
    },
    [revealPendingWord],
  );

  useEffect(() => {
    const previousLastWord = lastCompletedWordIndex(previousWords.current);
    const currentLastWord = lastCompletedWordIndex(words);
    previousWords.current = words;

    if (currentLastWord !== previousLastWord + 1) {
      pendingWordIndex.current = null;
      return;
    }

    pendingWordIndex.current = currentLastWord;
    revealPendingWord();
  }, [revealPendingWord, words]);

  if (words.length === 0 && !slotCount) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        compact && styles.compactContainer,
        { borderColor: colors.border },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        overScrollMode="never"
        showsVerticalScrollIndicator
        style={styles.scroll}
        testID={`${testID}-scroll`}
        ref={scrollRef}
        onLayout={({ nativeEvent }) => {
          scrollViewportHeight.current = nativeEvent.layout.height;
          revealPendingWord();
        }}
        onScroll={({ nativeEvent }) => {
          scrollOffset.current = Math.max(nativeEvent.contentOffset.y, 0);
        }}
        scrollEventThrottle={16}
      >
        <SeedWordGrid
          compact={compact}
          colors={colors}
          finalWord={finalWord}
          onSlotLayout={handleSlotLayout}
          slotCount={slotCount}
          testID={testID}
          words={words}
        />
      </ScrollView>
    </View>
  );
}

function lastCompletedWordIndex(words: readonly string[]) {
  for (let index = words.length - 1; index >= 0; index -= 1) {
    if (words[index]) {
      return index;
    }
  }
  return -1;
}

export function DirectDicePreview({
  compact,
  colors,
  slotCount,
  state,
}: Props) {
  const finalWord = state.finalWord;
  const words = finalWord ? [...state.words, finalWord] : state.words;

  return (
    <DiceWordList
      compact={compact}
      colors={colors}
      finalWord={finalWord}
      slotCount={slotCount}
      testID="direct-dice-words"
      words={words}
    />
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    marginBottom: 4,
    paddingBottom: 2,
    paddingTop: 4,
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexShrink: 1,
    marginBottom: 8,
    minHeight: 0,
    paddingBottom: 4,
    paddingTop: 8,
  },
  scroll: {
    flex: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingRight: 4,
  },
});
