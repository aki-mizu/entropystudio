/**
 * @format
 */

const { existsSync, readdirSync, readFileSync } = require('node:fs');
const { extname, join, relative, resolve } = require('node:path');
const typescript = require('typescript');
const {
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} = require('../../src/features/upstreamUiCopy');
const { STUDIO_UI_TEXT } = require('../../src/features/studioUiCopy');

const upstreamAppJs = readFileSync(
  resolve(__dirname, '../../../entropylab/src/js/app.js'),
  'utf8',
);
const upstreamShellHtml = readOptionalSource('src/shell.html');
const renderedUpstreamAppJs = decodeJavaScriptEscapes(upstreamAppJs);
const renderedUpstreamUiSources = [
  renderedUpstreamAppJs,
  decodeJavaScriptEscapes(readOptionalSource('src/js/i18n-labels.js')),
  upstreamShellHtml,
  readOptionalSource('src/index.html'),
].join('\n');

describe('Upstream UI copy provenance', () => {
  test('limits Studio-authored navigation copy to approved actions', () => {
    expect(STUDIO_UI_TEXT).toEqual({
      actions: {
        start: 'Start',
      },
      navigation: {
        settings: 'Settings',
      },
    });
  });

  test('centralizes only text rendered by the current upstream UI', () => {
    const copiedText = collectStrings({
      fallback: UPSTREAM_UI_FALLBACK_COPY,
      labels: UPSTREAM_UI_LABELS,
      text: UPSTREAM_TEXT,
    });

    copiedText.forEach(text => {
      expect(renderedUpstreamUiSources).toContain(text);
    });
  });

  test('copies every dynamic formatter only from current upstream templates', () => {
    const dynamicFallbackTemplates = {
      'common.seedLengthWords': {
        source: upstreamShellHtml,
        template:
          /<option value="12">12 words<\/option><option value="15">15 words<\/option><option value="18">18 words<\/option><option value="21">21 words<\/option><option value="24" selected="selected">24 words<\/option>/,
      },
      'common.seedLengthEntropy': {
        source: upstreamAppJs,
        template:
          /hodlTText\("\{words\} words use \{bits\} bits of BIP39 entropy\.", \{ words: config\.words, bits: config\.bits \}\)/,
      },
      'cards.dealN': {
        source: upstreamAppJs,
        template: /deal \$\{needed\.first\} unique cards without putting them back/,
      },
      'cards.directComplete': {
        source: upstreamAppJs,
        template:
          /\$\{parsed\.entries\.length\} of \$\{parsed\.steps\.length\} rank draws entered \\xB7 checksum-valid \$\{parsed\.config\.words\}-word seed ready to derive/,
      },
      'cards.directHelp': {
        source: upstreamAppJs,
        template:
          /For each of the first \$\{config\.partialWords\} words, shuffle and draw from A\\u20138 three times, then A\\u20134 once\./,
      },
      'cards.directRequirement': {
        source: upstreamAppJs,
        template:
          /"\{words\} words use \{partial\} complete 11-bit rank selections plus \{final\} final rank draw\(s\)\."/,
      },
      'cards.directProgress': {
        source: upstreamAppJs,
        template:
          /\$\{parsed\.entries\.length\} of \$\{parsed\.steps\.length\} rank draws entered \\xB7 \$\{hodlDirectCardStepStatus\(parsed\)\}/,
      },
      'cards.duplicateError': {
        source: upstreamAppJs,
        template: /Do not repeat a card in the same shuffle\. Repeated: \{card\}\./,
      },
      'cards.extraCard': {
        source: upstreamAppJs,
        template:
          /\$\{parsed\.extraEntries\.length\} extra card\$\{parsed\.extraEntries\.length === 1 \? "" : "s"\} highlighted/,
      },
      'cards.extraCards': {
        source: upstreamAppJs,
        template:
          /\$\{parsed\.extraEntries\.length\} extra card\$\{parsed\.extraEntries\.length === 1 \? "" : "s"\} highlighted/,
      },
      'cards.formatError': {
        source: upstreamAppJs,
        template: /Cards use rank then suit, like AS, 10H, or TD\. Ignored: \{ignored\}/,
      },
      'cards.hashedInputHelp':
        {
          source: upstreamAppJs,
          template:
            /Each valid card updates a deterministic test seed\. For real security, \$\{config\.words === 24 \? "deal all 52 unique cards, shuffle again, then deal 6 more" : `deal \$\{needed\.first\} unique cards without putting them back`\}\. SHA-256 hashes the ASCII transcript \(As 2c Td\)\./,
        },
      'cards.hashedRequirement': {
        source: upstreamAppJs,
        template:
          /"\{words\} words need \{bits\} bits\. Deal \{first\} unique cards from one shuffled deck\."/,
      },
      'cards.invalidRank': {
        source: upstreamAppJs,
        template:
          /\$\{parsed\.invalidEntries\.length\} invalid rank\$\{parsed\.invalidEntries\.length === 1 \? "" : "s"\} highlighted/,
      },
      'cards.invalidRanks': {
        source: upstreamAppJs,
        template:
          /\$\{parsed\.invalidEntries\.length\} invalid rank\$\{parsed\.invalidEntries\.length === 1 \? "" : "s"\} highlighted/,
      },
      'dice.d8d16.groups': {
        source: upstreamAppJs,
        template:
          /Group \$\{result\.completedGroups\} of \$\{config\.partialWords\} \\xB7 word \$\{result\.activeGroupIndex\+1\}/,
      },
      'dice.d8d16.rollsComplete': {
        source: upstreamAppJs,
        template: /\$\{config\.partialWords\} of \$\{config\.partialWords\} word rolls complete/,
      },
      'dice.errors.invalidFaces': {
        source: upstreamAppJs,
        template: /Dice must be faces 1(?:\\u2013|–)6\. Ignored characters: \{chars\}/,
      },
      'keyboard.base64Entropy': {
        source: upstreamAppJs,
        template: /On-screen \$\{keyboard\.dataset\.seedKeyboardLayout\} Base64 entropy keyboard/,
      },
      'keyboard.base64EntropyChangeMode': {
        source: upstreamAppJs,
        template: /Change \$\{inputName\} character mode/,
      },
      'keyboard.enterCharacter': {
        source: upstreamAppJs,
        template: /aria-label="Enter \$\{(?:letter|character)\}"/,
      },
      'keyboard.privateKey': {
        source: upstreamAppJs,
        template:
          /On-screen \$\{keyboard\.dataset\.seedKeyboardLayout \|\| "lower"\} private key keyboard/,
      },
      'keyboard.privateKeyChangeMode': {
        source: upstreamAppJs,
        template: /Change \$\{inputName\} character mode/,
      },
      'keyboard.privateKeyInitial': {
        source: upstreamAppJs,
        template:
          /Choose the first \$\{kind === "wif" \? "WIF" : "Mini key"\} character/,
      },
      'numberBases.coinNext': {
        source: upstreamAppJs,
        template:
          /\$\{definition\.fullDigits\} \$\{definition\.shortLabel\} characters complete \\xB7 coin flip \$\{Math\.min\(definition\.remainderBits, coinFlipsEntered \+ 1\)\} of \$\{definition\.remainderBits\} \\xB7 Heads \(0\) or Tails \(1\)/,
      },
      'numberBases.coinReady': {
        source: upstreamAppJs,
        template:
          /\$\{definition\.fullDigits\} \$\{definition\.shortLabel\} characters complete \\xB7 \$\{coinFlipsEntered\} of \$\{definition\.remainderBits\} coin flips entered/,
      },
      'numberBases.entropyLabel': {
        source: upstreamAppJs,
        template: /\$\{format\.label\} entropy for a \$\{config\.words\}-word seed/,
      },
      'numberBases.excess': {
        source: upstreamAppJs,
        template: /\$\{analysis\.excessCount\} extra highlighted \\xB7 remove to continue/,
      },
      'numberBases.finalBits': {
        source: upstreamAppJs,
        template: /final \$\{definition\.remainderBits\} entropy bits must each be 0 or 1/,
      },
      'numberBases.finalCharacter': {
        source: upstreamAppJs,
        template:
          /final \$\{definition\.remainderBits\}-bit character must be one of \$\{\[\.\.\.definition\.finalCharacters\]\.join\(", "\)\}/,
      },
      'numberBases.help': {
        source: upstreamAppJs,
        template:
          /Each complete \$\{format\.shortLabel\} character contributes \$\{format\.bitsPerDigit\} bit\$\{format\.bitsPerDigit === 1 \? "" : "s"\}/,
      },
      'numberBases.invalid': {
        source: upstreamAppJs,
        template:
          /\$\{analysis\.invalidCharacterCount\} invalid character\$\{analysis\.invalidCharacterCount === 1 \? "" : "s"\} highlighted/,
      },
      'numberBases.mixedRemainder': {
        source: upstreamAppJs,
        template:
          /The final character is mixed-radix: it contributes only \{n\} bit\(s\) and must be one of \{chars\}\./,
      },
      'numberBases.progress': {
        source: upstreamAppJs,
        template:
          /\$\{analysis\.count\} of \$\{analysis\.limit\} \$\{definition\.unit\} \\xB7 \$\{words\.length\} of \$\{config\.words\} seed words filled/,
      },
      'numberBases.requirement': {
        source: upstreamAppJs,
        template:
          /hodlTText\("\{words\} words require exactly \{digits\} \{unit\}\.", \{ words: config\.words, digits: format\.digits, unit: format\.unit \}\)/,
      },
      'numberBases.setupRemainderBinary': {
        source: upstreamAppJs,
        template:
          /Enter \{fullDigits\} complete \{shortLabel\} characters followed by \{n\} coin flip\(s\), using Heads \(0\) or Tails \(1\)\./,
      },
      'numberBases.setupRemainderMixed': {
        source: upstreamAppJs,
        template:
          /The final character contributes \{n\} bit\(s\) and must be one of \{chars\}\./,
      },
      'numberBases.remainderBinary': {
        source: upstreamAppJs,
        template:
          /Enter \{fullDigits\} complete \{shortLabel\} characters; the controls and progress message then switch to \{n\} coin flip\(s\), using Heads \(0\) or Tails \(1\)\./,
      },
      'privateKey.progress.brain.empty': {
        source: upstreamAppJs,
        template: /No text entered \\xB7 brain wallets are unsafe/,
      },
      'privateKey.progress.brain.entered': {
        source: upstreamAppJs,
        template: /Text entered \\xB7 \$\{convention\} \\xB7 brain wallets are unsafe/,
      },
      'privateKey.progress.hex.excess': {
        source: upstreamAppJs,
        template: /\$\{count2\} hexadecimal characters entered \\xB7 64 required/,
      },
      'privateKey.progress.hex.ready': {
        source: upstreamAppJs,
        template:
          /parts2 = \["64 of 64 hexadecimal characters entered", "valid secp256k1 private key", "ready to derive"\]/,
      },
      'privateKey.progress.hex.remaining': {
        source: upstreamAppJs,
        template:
          /\$\{count2\} of 64 hexadecimal characters entered \\xB7 \$\{remaining\} remaining/,
      },
      'privateKey.progress.mini.excess': {
        source: upstreamAppJs,
        template: /\$\{count\} Mini-key characters entered \\xB7 30 maximum/,
      },
      'privateKey.progress.mini.prefix': {
        source: upstreamAppJs,
        template: /0 of 22 or 30 Mini-key characters entered \\xB7 must start with S/,
      },
      'privateKey.progress.mini.ready': {
        source: upstreamAppJs,
        template:
          /parts = \[`\$\{count\} of \$\{count\} Mini-key characters entered`, `checksum valid`, `ready to derive`\]/,
      },
      'privateKey.progress.mini.remaining': {
        source: upstreamAppJs,
        template:
          /\$\{count\} of \$\{required\} Mini-key characters entered \\xB7 \$\{Math\.max\(0, required - count\)\} remaining/,
      },
      'privateKey.progress.wif.excess': {
        source: upstreamAppJs,
        template: /\$\{count2\} WIF characters entered \\xB7 \$\{required2\} required/,
      },
      'privateKey.progress.wif.prefix': {
        source: upstreamAppJs,
        template:
          /\$\{count2\} of 51 or 52 WIF characters entered \\xB7 starts with \$\{network === "testnet" \? "9 or c" : "5, K, or L"\}/,
      },
      'privateKey.progress.wif.ready': {
        source: upstreamAppJs,
        template:
          /parts2 = \[`\$\{required2\} of \$\{required2\} WIF characters entered`, `\$\{network\} checksum valid`, `ready to derive`\]/,
      },
      'privateKey.progress.wif.remaining': {
        source: upstreamAppJs,
        template:
          /\$\{count2\} of \$\{required2\} WIF characters entered \\xB7 \$\{Math\.max\(0, required2 - count2\)\} remaining/,
      },
      'seedPhrase.finalPrefix': {
        source: upstreamAppJs,
        template: /\{n\} valid checksum word\(s\) start with \\\"\{prefix\}\\\"\./,
      },
      'seedPhrase.noFinalPrefix': {
        source: upstreamAppJs,
        template: /No valid checksum word starts with \\\"\{prefix\}\\\"\./,
      },
      'seedPhrase.placeholder': {
        source: upstreamAppJs,
        template: /placeholder="Enter exactly \$\{config\.words\} BIP39 words"/,
      },
      'seedPhrase.requirementNumbers': {
        source: upstreamAppJs,
        template: /Enter exactly \{words\} BIP39 word numbers using \{range\}\./,
      },
      'seedPhrase.requirementWords': {
        source: upstreamAppJs,
        template: /Enter exactly \{words\} BIP39 words\. Extended keys ignore this selection\./,
      },
      'seedPhrase.wordsHelp': {
        source: upstreamAppJs,
        template:
          /Enter exactly \$\{config\.words\} English BIP39 words\. You can also paste an extended key here; the selected phrase length does not apply to extended keys\. With \$\{config\.partialWords\} compatible diceware words, choose the final checksum word below\./,
      },
      'seedPhrase.wordsLabel': {
        source: upstreamAppJs,
        template: /Your \$\{config\.words\}-word seed phrase/,
      },
      'sync.shortfall': {
        source: upstreamAppJs,
        template: /\{n\} bits of entropy · under \{min\}/,
      },
    };

    expect(Object.keys(dynamicFallbackTemplates).sort()).toEqual(
      fallbackFunctionPaths(UPSTREAM_UI_FALLBACK_COPY).sort(),
    );
    Object.entries(dynamicFallbackTemplates).forEach(([, { source, template }]) => {
      expect(source).toMatch(template);
    });
  });

  test('keeps static upstream copy imports in the central module', () => {
    const appSourceDirectory = resolve(__dirname, '../../src');
    const centralCopyModule = join(appSourceDirectory, 'features', 'upstreamUiCopy.ts');
    const nonCentralImports = sourceFiles(appSourceDirectory)
      .filter(filePath => filePath !== centralCopyModule)
      .filter(filePath =>
        /(?:upstreamEnglish|i18n-labels\.js|\bupstreamText\s*\()/u.test(
          readFileSync(filePath, 'utf8'),
        ),
      )
      .map(filePath => relative(appSourceDirectory, filePath));

    expect(nonCentralImports).toEqual([]);
  });

  test('does not duplicate central static upstream text', () => {
    const exampleDirectory = resolve(__dirname, '../..');
    const centralCopyModule = join(exampleDirectory, 'src', 'features', 'upstreamUiCopy.ts');
    const staticText = new Set(collectStrings(UPSTREAM_TEXT));
    const duplicateText = [
      ...sourceFiles(join(exampleDirectory, 'src')),
      ...sourceFiles(join(exampleDirectory, '__tests__')),
      ...sourceFiles(join(exampleDirectory, 'test')),
    ]
      .filter(filePath => filePath !== centralCopyModule)
      .flatMap(filePath => centralStaticTextCopies(filePath, exampleDirectory, staticText));

    expect(duplicateText).toEqual([]);
  });

  test('does not introduce direct copy in JSX user-facing nodes', () => {
    const appSourceDirectory = resolve(__dirname, '../../src');
    const directCopy = sourceFiles(appSourceDirectory).flatMap(filePath =>
      directJsxCopy(filePath, appSourceDirectory),
    );

    expect(directCopy).toEqual([]);
  });

  test('does not retain retired downstream copy sources', () => {
    const appSourceDirectory = resolve(__dirname, '../../src');
    const files = sourceFiles(appSourceDirectory);

    expect(
      [
        join(appSourceDirectory, 'features', 'upstreamEnglishCatalog.ts'),
        join(appSourceDirectory, 'features', 'upstreamEnglish.ts'),
        join(appSourceDirectory, 'features', 'generated', 'en.json'),
        join(appSourceDirectory, 'features', 'generated', 'upstreamEsText.json'),
        join(appSourceDirectory, 'features', 'generated', 'upstreamUiText.ts'),
      ].filter(existsSync),
    ).toEqual([]);
    expect(
      files.filter(filePath =>
        /upstreamEnglish(?:Catalog)?|generated\/(?:en\.json|upstreamEsText|upstreamUiText)/u.test(
          readFileSync(filePath, 'utf8'),
        ),
      ),
    ).toEqual([]);
  });
});

function readOptionalSource(path) {
  const sourcePath = resolve(__dirname, '../../../entropylab', path);
  return existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : '';
}

function collectStrings(value) {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function fallbackFunctionPaths(value, path = []) {
  if (typeof value === 'function') {
    return [path.join('.')];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => fallbackFunctionPaths(item, [...path, String(index)]));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => fallbackFunctionPaths(item, [...path, key]));
  }
  return [];
}

function decodeJavaScriptEscapes(source) {
  return source
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)),
    )
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, codeUnit) =>
      String.fromCharCode(Number.parseInt(codeUnit, 16)),
    )
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, codeUnit) =>
      String.fromCharCode(Number.parseInt(codeUnit, 16)),
    );
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(filePath);
    }
    return ['.ts', '.tsx'].includes(extname(filePath)) ? [filePath] : [];
  });
}

function centralStaticTextCopies(filePath, exampleDirectory, staticText) {
  const source = typescript.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    typescript.ScriptTarget.Latest,
    true,
  );
  const copies = [];

  function visit(node) {
    if (
      (typescript.isStringLiteral(node) || typescript.isNoSubstitutionTemplateLiteral(node)) &&
      staticText.has(node.text)
    ) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      copies.push(`${relative(exampleDirectory, filePath)}:${line + 1}:${JSON.stringify(node.text)}`);
    }
    typescript.forEachChild(node, visit);
  }

  visit(source);
  return copies;
}

function directJsxCopy(filePath, appSourceDirectory) {
  const source = typescript.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    typescript.ScriptTarget.Latest,
    true,
  );
  const directCopy = [];

  function addCopy(node, text) {
    if (!/[A-Za-z]/.test(text)) {
      return;
    }
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    directCopy.push(`${relative(appSourceDirectory, filePath)}:${line + 1}:${text}`);
  }

  function visit(node) {
    if (typescript.isJsxText(node)) {
      addCopy(node, node.getText(source).trim());
    }
    if (typescript.isJsxExpression(node) && typescript.isJsxElement(node.parent)) {
      if (
        typescript.isStringLiteral(node.expression) ||
        typescript.isNoSubstitutionTemplateLiteral(node.expression)
      ) {
        addCopy(node.expression, node.expression.text);
      }
    }
    if (typescript.isJsxAttribute(node) && isUserFacingAttribute(node.name.text)) {
      const expression = node.initializer;
      if (typescript.isStringLiteral(expression)) {
        addCopy(expression, expression.text);
      } else if (
        typescript.isJsxExpression(expression) &&
        (typescript.isStringLiteral(expression.expression) ||
          typescript.isNoSubstitutionTemplateLiteral(expression.expression))
      ) {
        addCopy(expression.expression, expression.expression.text);
      } else if (
        typescript.isJsxExpression(expression) &&
        typescript.isTemplateExpression(expression.expression)
      ) {
        const template = [
          expression.expression.head.text,
          ...expression.expression.templateSpans.map(span => span.literal.text),
        ].join('');
        addCopy(expression.expression, template);
      }
    }
    typescript.forEachChild(node, visit);
  }

  visit(source);
  return directCopy;
}

function isUserFacingAttribute(name) {
  return ['accessibilityHint', 'accessibilityLabel', 'placeholder'].includes(name);
}
