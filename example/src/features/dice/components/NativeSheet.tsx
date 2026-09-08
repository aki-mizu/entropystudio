import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DiceColors } from '../diceTheme';
import { UPSTREAM_TEXT } from '../../upstreamUiCopy';

type Props = {
  readonly animateSheetSeparately?: boolean;
  readonly children: ReactNode;
  readonly colors: DiceColors;
  readonly onDismiss: () => void;
  readonly testID: string;
  readonly title: string;
  readonly visible: boolean;
};

export function NativeSheet({
  animateSheetSeparately = false,
  children,
  colors,
  onDismiss,
  testID,
  title,
  visible,
}: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetAnimationProgress = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    if (!animateSheetSeparately) {
      return;
    }

    sheetAnimationProgress.stopAnimation();
    if (!visible) {
      sheetAnimationProgress.setValue(0);
      return;
    }

    sheetAnimationProgress.setValue(0);
    const animation = Animated.timing(sheetAnimationProgress, {
      duration: 250,
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animateSheetSeparately, sheetAnimationProgress, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType={animateSheetSeparately ? 'none' : 'slide'}
      onRequestClose={onDismiss}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible
    >
      <View style={[styles.overlay, animateSheetSeparately && styles.transparentOverlay]}>
        {animateSheetSeparately ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.backdropVisual,
              { opacity: sheetAnimationProgress },
            ]}
          />
        ) : null}
        <Pressable
          accessibilityLabel={UPSTREAM_TEXT.common.cancel}
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.backdrop}
          testID={`${testID}-backdrop`}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              paddingBottom: Math.max(20, safeAreaInsets.bottom + 12),
            },
            animateSheetSeparately && {
              transform: [
                {
                  translateY: sheetAnimationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [windowHeight, 0],
                  }),
                },
              ],
            },
          ]}
          testID={testID}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]} testID={`${testID}-title`}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.common.cancel}
              accessibilityRole="button"
              onPress={onDismiss}
              style={styles.closeButton}
              testID={`${testID}-close`}
            >
              <Text style={[styles.closeText, { color: colors.accent }]}>
                {UPSTREAM_TEXT.common.cancel}
              </Text>
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropVisual: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingLeft: 16,
  },
  closeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    minHeight: 48,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  transparentOverlay: {
    backgroundColor: 'transparent',
  },
});
