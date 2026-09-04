import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DiceColors } from '../diceTheme';
import { UPSTREAM_UI_FALLBACK_COPY } from '../../upstreamUiCopy';

type Props = {
  readonly children: ReactNode;
  readonly colors: DiceColors;
  readonly onDismiss: () => void;
  readonly testID: string;
  readonly title: string;
  readonly visible: boolean;
};

export function NativeSheet({
  children,
  colors,
  onDismiss,
  testID,
  title,
  visible,
}: Props) {
  const safeAreaInsets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onDismiss}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.cancel}
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.backdrop}
          testID={`${testID}-backdrop`}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              paddingBottom: Math.max(20, safeAreaInsets.bottom + 12),
            },
          ]}
          testID={testID}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]} testID={`${testID}-title`}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.cancel}
              accessibilityRole="button"
              onPress={onDismiss}
              style={styles.closeButton}
              testID={`${testID}-close`}
            >
              <Text style={[styles.closeText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.cancel}
              </Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
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
});