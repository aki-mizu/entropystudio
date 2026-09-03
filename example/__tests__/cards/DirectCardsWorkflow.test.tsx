/**
 * @format
 */

import {
  App,
  mockDirectCardState,
  openCardsEntry,
  React,
  ReactTestRenderer,
  selectEntropyTool,
} from '../../test/testSupport';

describe('Direct cards', () => {
  test('uses rank-only controls for card selection', async () => {
    mockDirectCardState.mockReset();
    mockDirectCardState.mockReturnValue({
      activeDraw: 1,
      activeMax: 8,
      activeWord: 1,
      candidates: [],
      complete: false,
      completedGroups: 0,
      extraCount: 0,
      finalWord: '',
      invalidCount: 0,
      partialWords: 23,
      step: 0,
      words: [],
    });

    let app: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(<App />);
    });

    await selectEntropyTool(app!, 'cards');
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'card-method-direct' }).props.onPress();
    });
    await openCardsEntry(app!);

    expect(app!.root.findByProps({ testID: 'direct-card-rank-8' }).props.disabled).toBe(false);
    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'direct-card-rank-A' }).props.onPress();
    });

    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('A');
    expect(mockDirectCardState).toHaveBeenLastCalledWith('A', 24);

    for (const rank of ['2', '3', '4', '5']) {
      await ReactTestRenderer.act(async () => {
        app!.root.findByProps({ testID: `direct-card-rank-${rank}` }).props.onPress();
      });
    }

    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe(
      'A234 5',
    );
    expect(mockDirectCardState).toHaveBeenLastCalledWith('A2345', 24);

    await ReactTestRenderer.act(async () => {
      app!.root.findByProps({ testID: 'undo-card-entry' }).props.onPress();
    });
    expect(app!.root.findByProps({ testID: 'card-transcript-input' }).props.value).toBe('A234');
  });
});