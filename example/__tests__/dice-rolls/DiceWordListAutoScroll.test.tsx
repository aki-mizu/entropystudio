/**
 * @format
 */

import { DiceWordList } from '../../src/features/dice/components/DirectDicePreview';
import { diceColors } from '../../src/features/dice/diceTheme';
import { React, ReactTestRenderer, ScrollView } from '../../test/testSupport';

const COLORS = diceColors(false);
const WORDS = Array.from({ length: 24 }, () => 'abandon');

function wordList(words: readonly string[]) {
  return (
    <DiceWordList
      compact
      colors={COLORS}
      slotCount={24}
      testID="test-words"
      words={words}
    />
  );
}

function setScrollViewport(
  app: ReactTestRenderer.ReactTestRenderer,
  height: number,
) {
  app.root.findByProps({ testID: 'test-words-scroll' }).props.onLayout({
    nativeEvent: { layout: { height } },
  });
}

function setSlotLayout(
  app: ReactTestRenderer.ReactTestRenderer,
  slot: number,
  height: number,
  y: number,
) {
  app.root.findByProps({ testID: `test-words-slot-${slot}` }).props.onLayout({
    nativeEvent: { layout: { height, y } },
  });
}

describe('DiceWordList automatic scrolling', () => {
  test('reveals one newly completed word below the viewport', async () => {
    const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;
    scrollTo.mockClear();

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(wordList(WORDS.slice(0, 6)));
    });
    await ReactTestRenderer.act(async () => {
      setScrollViewport(app!, 100);
      setSlotLayout(app!, 7, 28, 100);
    });
    scrollTo.mockClear();

    await ReactTestRenderer.act(async () => {
      app!.update(wordList(WORDS.slice(0, 7)));
    });

    expect(scrollTo).toHaveBeenCalledWith({ animated: true, y: 28 });
  });

  test('leaves a newly completed visible word in place', async () => {
    const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;
    scrollTo.mockClear();

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(wordList(WORDS.slice(0, 6)));
    });
    await ReactTestRenderer.act(async () => {
      setScrollViewport(app!, 100);
      setSlotLayout(app!, 7, 28, 72);
    });
    scrollTo.mockClear();

    await ReactTestRenderer.act(async () => {
      app!.update(wordList(WORDS.slice(0, 7)));
    });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  test('returns to the top when the next column starts above the viewport', async () => {
    const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;
    scrollTo.mockClear();

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(wordList(WORDS.slice(0, 8)));
    });
    await ReactTestRenderer.act(async () => {
      setScrollViewport(app!, 100);
      setSlotLayout(app!, 9, 28, 0);
      app!.root.findByProps({ testID: 'test-words-scroll' }).props.onScroll({
        nativeEvent: { contentOffset: { y: 96 } },
      });
    });
    scrollTo.mockClear();

    await ReactTestRenderer.act(async () => {
      app!.update(wordList(WORDS.slice(0, 9)));
    });

    expect(scrollTo).toHaveBeenCalledWith({ animated: true, y: 0 });
  });

  test('does not jump for an initial complete phrase', async () => {
    const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;
    scrollTo.mockClear();

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(wordList([]));
    });
    await ReactTestRenderer.act(async () => {
      setScrollViewport(app!, 100);
      setSlotLayout(app!, 24, 28, 196);
    });
    scrollTo.mockClear();

    await ReactTestRenderer.act(async () => {
      app!.update(wordList(WORDS));
    });

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
