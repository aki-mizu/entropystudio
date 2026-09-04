/**
 * @format
 */

const { readdirSync, readFileSync } = require('node:fs');
const { extname, join, relative, resolve } = require('node:path');
const typescript = require('typescript');
const entropyLabEnglish = require('../../../entropylab/src/locales/en.json');
const { UPSTREAM_UI_FALLBACK_COPY } = require('../../src/features/upstreamUiCopy');

const upstreamAppJs = readFileSync(
  resolve(__dirname, '../../../entropylab/src/js/app.js'),
  'utf8',
);
const renderedUpstreamAppJs = decodeJavaScriptEscapes(upstreamAppJs);
const CATALOG_TEMPLATE_EVIDENCE = {
  'cards.help.dealN': /deal \$\{needed\.first\} unique cards without putting them back/,
  'cards.help.direct':
    /For each of the first \$\{config\.partialWords\} words, shuffle and draw from A\\u20138 three times, then A\\u20134 once\./,
  'cards.meta.directComplete':
    /rank draws entered \\xB7 checksum-valid \$\{parsed\.config\.words\}-word seed ready to derive/,
  'cards.meta.directProgress':
    /rank draws entered \\xB7 \$\{hodlDirectCardStepStatus\(parsed\)\}/,
  'cards.meta.extraCard':
    /extra card\$\{parsed\.extraEntries\.length === 1 \? "" : "s"\} highlighted/,
  'cards.meta.extraCards':
    /extra card\$\{parsed\.extraEntries\.length === 1 \? "" : "s"\} highlighted/,
  'cards.meta.invalidRank':
    /invalid rank\$\{parsed\.invalidEntries\.length === 1 \? "" : "s"\} highlighted/,
  'cards.meta.invalidRanks':
    /invalid rank\$\{parsed\.invalidEntries\.length === 1 \? "" : "s"\} highlighted/,
  'dice.dplus.rollsComplete':
    /\$\{config\.partialWords\} of \$\{config\.partialWords\} word rolls complete/,
  'hex.entropyLabel': /\$\{format\.label\} entropy for a \$\{config\.words\}-word seed/,
  'hex.help':
    /Each complete \$\{format\.shortLabel\} character contributes \$\{format\.bitsPerDigit\} bit\$\{format\.bitsPerDigit === 1 \? "" : "s"\}/,
  'hex.meta.coinNext':
    /coin flip \$\{Math\.min\(definition\.remainderBits, coinFlipsEntered \+ 1\)\} of \$\{definition\.remainderBits\} \\xB7 Heads \(0\) or Tails \(1\)/,
  'hex.meta.coinReady':
    /\$\{coinFlipsEntered\} of \$\{definition\.remainderBits\} coin flips entered/,
  'hex.meta.excess': /\$\{analysis\.excessCount\} extra highlighted \\xB7 remove to continue/,
  'hex.meta.finalBits':
    /final \$\{definition\.remainderBits\} entropy bits must each be 0 or 1/,
  'hex.meta.finalChar':
    /final \$\{definition\.remainderBits\}-bit character must be one of \$\{\[\.\.\.definition\.finalCharacters\]\.join\(", "\)\}/,
  'hex.meta.invalid':
    /\$\{analysis\.invalidCharacterCount\} invalid character\$\{analysis\.invalidCharacterCount === 1 \? "" : "s"\} highlighted/,
  'hex.meta.progress':
    /\$\{analysis\.count\} of \$\{analysis\.limit\} \$\{definition\.unit\} \\xB7 \$\{words\.length\} of \$\{config\.words\} seed words filled/,
  'seed.placeholder': /placeholder="Enter exactly \$\{config\.words\} BIP39 words"/,
  'seed.wordsHelp':
    /Enter exactly \$\{config\.words\} English BIP39 words\. You can also paste an extended key here;/,
  'seed.wordsLabel': /Your \$\{config\.words\}-word seed phrase/,
};
const DYNAMIC_CATALOG_KEY_TEMPLATE_EVIDENCE = {
  'dice.help.${}': /hodlT\("dice\.help\.(?:coleman|coldcard)"/,
  'dice.method.${}': /hodlT\("dice\.method\.(?:coleman|coldcard)"\)/,
  'hex.desc.${}': /hodlT\(`hex\.desc\.\$\{id\}`\)/,
  'hex.format.${}': /hodlT\(`hex\.format\.\$\{id\}`\)/,
  'hex.short.${}': /hodlT\(`hex\.short\.\$\{format\.id\}`\)/,
  'hex.unit.${}': /hodlT\(`hex\.unit\.\$\{format\.id\}`\)/,
  'seed.method.${}': /hodlT\("seed\.method\.(?:words|numbers)"\)/,
  'seed.method.${}Desc': /hodlT\("seed\.method\.(?:words|numbers)Desc"\)/,
};

describe('Upstream UI fallback copy provenance', () => {
  test('copies only text rendered by app.js and unavailable in en.json', () => {
    const copiedText = collectStrings(UPSTREAM_UI_FALLBACK_COPY);
    const catalogText = collectStrings(entropyLabEnglish);

    copiedText.forEach(text => {
      expect(renderedUpstreamAppJs).toContain(text);
      expect(catalogText).not.toContain(text);
    });
  });

  test('copies dynamic text only from app.js templates', () => {
    const catalogText = collectStrings(entropyLabEnglish);
    const dynamicFallbackTemplates = {
      'cards.hashedInputHelp':
        /Each valid card updates a deterministic test seed\. For real security, \$\{config\.words === 24 \? "deal all 52 unique cards, shuffle again, then deal 6 more" : `deal \$\{needed\.first\} unique cards without putting them back`\}\. SHA-256 hashes the ASCII transcript \(As 2c Td\)\./,
      'dice.d8d16.groups':
        /Group \$\{result\.completedGroups\} of \$\{config\.partialWords\} \\xB7 word \$\{result\.activeGroupIndex\+1\}/,
      'keyboard.base64EntropyBinding':
        /hodlKeyboardMarkup\(true, "Base64 entropy", "base64-keyboard"\)/,
      'keyboard.base64Entropy':
        /On-screen \$\{keyboard\.dataset\.seedKeyboardLayout\} Base64 entropy keyboard/,
      'keyboard.base64EntropyChangeMode': /Change \$\{inputName\} character mode/,
      'keyboard.enterCharacter': /aria-label="Enter \$\{(?:letter|character)\}"/,
      'keyboard.privateKey':
        /On-screen \$\{keyboard\.dataset\.seedKeyboardLayout \|\| "lower"\} private key keyboard/,
      'keyboard.privateKeyBinding':
        /hodlKeyboardMarkup\(true, "private key", "private-keyboard", true\)/,
      'keyboard.privateKeyChangeMode': /Change \$\{inputName\} character mode/,
      'keyboard.privateKeyInitial':
        /Choose the first \$\{kind === "wif" \? "WIF" : "Mini key"\} character/,
      'privateKey.progress.brain':
        /Text entered \\xB7 \$\{convention\} \\xB7 brain wallets are unsafe/,
      'privateKey.progress.hex': /hexadecimal characters entered \\xB7/,
      'privateKey.progress.mini': /Mini-key characters entered \\xB7/,
      'privateKey.progress.wif': /WIF characters entered \\xB7/,
    };

    Object.entries(dynamicFallbackTemplates).forEach(([, template]) => {
      expect(upstreamAppJs).toMatch(template);
    });

    const dynamicFallbackText = [
      UPSTREAM_UI_FALLBACK_COPY.cards.hashedInputHelp(
        'deal all 52 unique cards, shuffle again, then deal 6 more',
      ),
      UPSTREAM_UI_FALLBACK_COPY.dice.d8d16.groups(1, 23, 2),
      UPSTREAM_UI_FALLBACK_COPY.keyboard.base64Entropy('lower'),
      UPSTREAM_UI_FALLBACK_COPY.keyboard.base64EntropyChangeMode(),
      UPSTREAM_UI_FALLBACK_COPY.keyboard.enterCharacter('a'),
      UPSTREAM_UI_FALLBACK_COPY.keyboard.privateKey('lower'),
      UPSTREAM_UI_FALLBACK_COPY.keyboard.privateKeyChangeMode(),
      UPSTREAM_UI_FALLBACK_COPY.keyboard.privateKeyInitial('mini'),
      UPSTREAM_UI_FALLBACK_COPY.keyboard.privateKeyInitial('wif'),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.brain.empty(),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.brain.entered(),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.hex.excess(65, 64),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.hex.ready(64, 64),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.hex.remaining(1, 64, 63),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.mini.excess(31, 30),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.mini.prefix(22, 30),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.mini.ready(22, 22),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.mini.remaining(1, 22, 21),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.wif.excess(53, 52),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.wif.prefix(0, 51, 52),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.wif.ready(52, 52),
      UPSTREAM_UI_FALLBACK_COPY.privateKey.progress.wif.remaining(1, 51, 50),
    ];

    dynamicFallbackText.forEach(text => {
      expect(catalogText).not.toContain(text);
    });
  });

  test('does not introduce direct copy in JSX user-facing nodes', () => {
    const appSourceDirectory = resolve(__dirname, '../../src');
    const directCopy = sourceFiles(appSourceDirectory).flatMap(filePath =>
      directJsxCopy(filePath, appSourceDirectory),
    );

    expect(directCopy).toEqual([]);
  });

  test('uses catalog copy only where upstream renders the key, value, or template', () => {
    const appSourceDirectory = resolve(__dirname, '../../src');
    const files = sourceFiles(appSourceDirectory);
    const catalogKeys = [...new Set(files.flatMap(catalogKeysUsedBy))];
    const unverifiedKeys = catalogKeys.filter(
      key =>
        !upstreamAppJs.includes(key) &&
        !renderedUpstreamAppJs.includes(entropyLabEnglish[key]) &&
        !CATALOG_TEMPLATE_EVIDENCE[key]?.test(upstreamAppJs),
    );
    const dynamicCatalogKeys = [
      ...new Set(files.flatMap(dynamicCatalogKeyTemplatesUsedBy)),
    ].sort();

    expect(unverifiedKeys).toEqual([]);
    expect(Object.keys(CATALOG_TEMPLATE_EVIDENCE).sort()).toEqual(
      catalogKeys.filter(key => CATALOG_TEMPLATE_EVIDENCE[key]).sort(),
    );
    expect(dynamicCatalogKeys).toEqual(Object.keys(DYNAMIC_CATALOG_KEY_TEMPLATE_EVIDENCE).sort());
    Object.values(CATALOG_TEMPLATE_EVIDENCE).forEach(template => {
      expect(upstreamAppJs).toMatch(template);
    });
    Object.values(DYNAMIC_CATALOG_KEY_TEMPLATE_EVIDENCE).forEach(template => {
      expect(upstreamAppJs).toMatch(template);
    });
  });
});

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

function catalogKeysUsedBy(filePath) {
  return catalogKeyUsages(filePath, node =>
    typescript.isStringLiteral(node) && Object.hasOwn(entropyLabEnglish, node.text)
      ? node.text
      : null,
  );
}

function dynamicCatalogKeyTemplatesUsedBy(filePath) {
  return catalogKeyUsages(filePath, node => {
    if (
      !typescript.isElementAccessExpression(node) ||
      !typescript.isIdentifier(node.expression) ||
      node.expression.text !== 'entropyLabEnglish' ||
      !typescript.isTemplateExpression(node.argumentExpression)
    ) {
      return null;
    }
    return [
      node.argumentExpression.head.text,
      ...node.argumentExpression.templateSpans.map(span => span.literal.text),
    ].join('${}');
  });
}

function catalogKeyUsages(filePath, keyFromNode) {
  const source = typescript.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    typescript.ScriptTarget.Latest,
    true,
  );
  const keys = [];

  function visit(node) {
    const key = keyFromNode(node);
    if (key) {
      keys.push(key);
    }
    typescript.forEachChild(node, visit);
  }

  visit(source);
  return keys;
}