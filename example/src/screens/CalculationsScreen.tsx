import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import {
  DirectDiceCalculationTermKind,
} from '../native/entropyStudio';
import type {
  DirectDiceCalculationRow,
  NumberBaseCalculations,
} from '../native/entropyStudio';
import {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
} from '../features/upstreamUiCopy';

type CalculationFrameProps = {
  readonly children: ReactNode;
  readonly colors: DiceColors;
  readonly contentTitle: string;
  readonly description: string;
  readonly onBack: () => void;
  readonly testID: string;
};

type DirectDiceCalculationsScreenProps = {
  readonly colors: DiceColors;
  readonly method: 'bitbox' | 'd8d16';
  readonly onBack: () => void;
  readonly rows: readonly DirectDiceCalculationRow[];
};

type NumberBaseCalculationsScreenProps = {
  readonly calculations: NumberBaseCalculations;
  readonly colors: DiceColors;
  readonly formatLabel: string;
  readonly onBack: () => void;
  readonly shortLabel: string;
  readonly showConversion: boolean;
};

type NumberBaseCalculationRow = NumberBaseCalculations['rows'][number];

export function DirectDiceCalculationsScreen({
  colors,
  method,
  onBack,
  rows,
}: DirectDiceCalculationsScreenProps) {
  const isBitbox = method === 'bitbox';
  const contentTitle = isBitbox
    ? UPSTREAM_TEXT.calculations.bitboxTitle
    : UPSTREAM_TEXT.calculations.dplusTitle;
  const description = isBitbox
    ? UPSTREAM_TEXT.calculations.bitboxDescription
    : UPSTREAM_TEXT.calculations.dplusDescription;

  return (
    <CalculationsFrame
      colors={colors}
      contentTitle={contentTitle}
      description={description}
      onBack={onBack}
      testID="direct-dice-calculations-view"
    >
      <View style={styles.calculationList} testID="direct-dice-calculation-list">
        {rows.map(row => (
          <DirectDiceCalculationCard colors={colors} key={row.number} row={row} />
        ))}
      </View>
    </CalculationsFrame>
  );
}

export function NumberBaseCalculationsScreen({
  calculations,
  colors,
  formatLabel,
  onBack,
  shortLabel,
  showConversion,
}: NumberBaseCalculationsScreenProps) {
  return (
    <CalculationsFrame
      colors={colors}
      contentTitle={UPSTREAM_UI_FALLBACK_COPY.calculations.numberBaseTitle(formatLabel)}
      description={UPSTREAM_TEXT.calculations.numberBaseDescription}
      onBack={onBack}
      testID="number-base-calculations-view"
    >
      {showConversion ? (
        <View style={styles.conversionSection} testID="number-base-calculation-conversion">
          <Text style={[styles.conversionTitle, { color: colors.text }]}>
            {UPSTREAM_UI_FALLBACK_COPY.calculations.numberBaseDigitValues(shortLabel)}
          </Text>
          <Text style={[styles.conversionDescription, { color: colors.muted }]}>
            {UPSTREAM_UI_FALLBACK_COPY.calculations.numberBaseConversion(shortLabel)}
          </Text>
          <View style={styles.conversionValues}>
            {calculations.digitValues.map(value => (
              <View
                key={value.digit}
                style={styles.conversionValue}
                testID={`number-base-calculation-conversion-${value.digit}`}
              >
                <Text style={[styles.conversionDigit, { color: colors.text }]}>
                  {value.digit}
                </Text>
                <Text
                  style={[styles.conversionArrow, { color: colors.muted }]}
                  testID={`number-base-calculation-conversion-arrow-${value.digit}`}
                >
                  {UPSTREAM_TEXT.calculations.conversionArrow}
                </Text>
                <Text
                  style={[styles.conversionBits, { color: colors.accent }]}
                  testID={`number-base-calculation-conversion-bits-${value.digit}`}
                >
                  {value.bits}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.calculationList} testID="number-base-calculation-list">
        {calculations.rows.map(row => (
          <NumberBaseCalculationCard colors={colors} key={row.number} row={row} />
        ))}
      </View>
    </CalculationsFrame>
  );
}

function CalculationsFrame({
  children,
  colors,
  contentTitle,
  description,
  onBack,
  testID,
}: CalculationFrameProps) {
  return (
    <View style={styles.screen} testID={testID}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
          testID={`${testID}-back`}
        >
          <Text style={[styles.backButtonText, { color: colors.accent }]}>
            {UPSTREAM_UI_FALLBACK_COPY.common.back}
          </Text>
        </Pressable>
        <Text
          numberOfLines={1}
          style={[styles.headerTitle, { color: colors.text }]}
          testID={`${testID}-title`}
        >
          {UPSTREAM_TEXT.calculations.show}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        style={styles.scrollView}
      >
        <Text
          style={[styles.contentTitle, { color: colors.text }]}
          testID={`${testID}-content-title`}
        >
          {contentTitle}
        </Text>
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
        {children}
      </ScrollView>
    </View>
  );
}

function DirectDiceCalculationCard({
  colors,
  row,
}: {
  readonly colors: DiceColors;
  readonly row: DirectDiceCalculationRow;
}) {
  const testID = `direct-dice-calculation-row-${row.number}`;

  return (
    <View style={[styles.calculationCard, { borderColor: colors.border }]} testID={testID}>
      <CalculationHeading colors={colors} number={row.number} testID={testID} word={row.word} />
      <View style={styles.directTerms}>
        {row.terms.map((term, position) => (
          <View key={`${term.kind}-${position}`} style={styles.directTerm}>
            <Text style={[styles.termLabel, { color: colors.muted }]}>
              {directDiceTermLabel(term.kind, position)}
            </Text>
            <Text style={[styles.termFace, { color: colors.text }]}>{term.face}</Text>
            <Text style={[styles.termFormula, { color: colors.muted }]}>
              {`${term.value} × ${term.multiplier}`}
            </Text>
            <Text style={[styles.termContribution, { color: colors.accent }]}>
              {`= ${term.contribution}`}
            </Text>
          </View>
        ))}
      </View>
      <CalculationSummary colors={colors} row={row} testID={testID} />
    </View>
  );
}

function NumberBaseCalculationCard({
  colors,
  row,
}: {
  readonly colors: DiceColors;
  readonly row: NumberBaseCalculationRow;
}) {
  const testID = `number-base-calculation-row-${row.number}`;

  return (
    <View style={[styles.calculationCard, { borderColor: colors.border }]} testID={testID}>
      <CalculationHeading colors={colors} number={row.number} testID={testID} word={row.word} />
      <NumberBaseTerms
        colors={colors}
        label={UPSTREAM_TEXT.calculations.bitWeight}
        values={row.terms.map(term => String(term.bitWeight))}
      />
      <NumberBaseTerms
        colors={colors}
        label={UPSTREAM_TEXT.calculations.bit}
        values={row.terms.map(term => String(term.bit))}
      />
      <NumberBaseTerms
        colors={colors}
        label={UPSTREAM_TEXT.calculations.contribution}
        values={row.terms.map(term => String(term.contribution))}
      />
      <CalculationSummary colors={colors} row={row} testID={testID} />
    </View>
  );
}

function CalculationHeading({
  colors,
  number,
  testID,
  word,
}: {
  readonly colors: DiceColors;
  readonly number: number;
  readonly testID: string;
  readonly word: string;
}) {
  return (
    <View style={styles.calculationHeading}>
      <Text style={[styles.wordNumber, { color: colors.muted }]}>
        {UPSTREAM_UI_FALLBACK_COPY.calculations.word(number)}
      </Text>
      <Text selectable style={[styles.word, { color: colors.text }]} testID={`${testID}-word`}>
        {word}
      </Text>
    </View>
  );
}

function NumberBaseTerms({
  colors,
  label,
  values,
}: {
  readonly colors: DiceColors;
  readonly label: string;
  readonly values: readonly string[];
}) {
  return (
    <View style={styles.numberBaseTerms}>
      <Text style={[styles.numberBaseTermsLabel, { color: colors.muted }]}>{label}</Text>
      <View style={styles.numberBaseTermsValues}>
        {values.map((value, position) => (
          <View
            key={`${value}-${position}`}
            style={position === 0 ? styles.numberBaseLeadingTerm : styles.numberBaseTermTrack}
          >
            <Text
              numberOfLines={1}
              style={[styles.numberBaseTerm, { color: colors.text }]}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CalculationSummary({
  colors,
  row,
  testID,
}: {
  readonly colors: DiceColors;
  readonly row: { readonly index: number; readonly number: number; readonly terms: readonly { readonly contribution: number }[] };
  readonly testID: string;
}) {
  return (
    <View
      style={[styles.calculationSummary, { borderTopColor: colors.border }]}
      testID={`${testID}-summary`}
    >
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        numberOfLines={1}
        style={[styles.sum, { color: colors.text }]}
      >
        {`${row.terms.map(term => term.contribution).join(' + ')} =`}
      </Text>
      <View style={styles.calculationSummaryResults}>
        <Text
          numberOfLines={1}
          style={[styles.index, { color: colors.muted }]}
          testID={`${testID}-index`}
        >
          {`${UPSTREAM_TEXT.calculations.bip39Index} ${row.index}`}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.index, { color: colors.muted }]}
          testID={`${testID}-word-number`}
        >
          {`${UPSTREAM_TEXT.calculations.wordNumber} ${row.index + 1}`}
        </Text>
      </View>
    </View>
  );
}

function directDiceTermLabel(kind: DirectDiceCalculationTermKind, position: number): string {
  switch (kind) {
    case DirectDiceCalculationTermKind.BitboxDie:
      return UPSTREAM_UI_FALLBACK_COPY.calculations.die(position + 1);
    case DirectDiceCalculationTermKind.BitboxCoin:
      return UPSTREAM_TEXT.calculations.coinBit;
    case DirectDiceCalculationTermKind.D8:
      return UPSTREAM_TEXT.calculations.d8;
    case DirectDiceCalculationTermKind.D16:
      return UPSTREAM_TEXT.calculations.d16;
  }
}

const styles = StyleSheet.create({
  backButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingRight: 14,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  calculationCard: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
  },
  calculationHeading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  calculationList: {
    gap: 12,
    marginTop: 16,
  },
  calculationSummary: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  calculationSummaryResults: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  conversionBits: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 17,
  },
  conversionArrow: {
    fontSize: 12,
    lineHeight: 17,
    transform: [{ translateY: -3 }],
  },
  conversionDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  conversionDigit: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  conversionSection: {
    marginTop: 16,
  },
  conversionTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  conversionValue: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    minWidth: 52,
  },
  conversionValues: {
    columnGap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    rowGap: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  directTerm: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  directTerms: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 14,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 24,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  index: {
    flexShrink: 0,
    fontSize: 12,
    lineHeight: 17,
  },
  numberBaseTerm: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    width: '100%',
  },
  numberBaseTermTrack: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  numberBaseTerms: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
  },
  numberBaseTermsLabel: {
    fontSize: 10,
    lineHeight: 15,
    width: 58,
  },
  numberBaseTermsValues: {
    flex: 1,
    flexDirection: 'row',
    gap: 1,
    minWidth: 0,
  },
  numberBaseLeadingTerm: {
    flexBasis: 30,
    flexGrow: 0,
    flexShrink: 0,
  },
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sum: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 15,
  },
  termContribution: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
  },
  termFace: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 2,
  },
  termFormula: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  termLabel: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  word: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'right',
  },
  wordNumber: {
    fontSize: 12,
    lineHeight: 17,
  },
});