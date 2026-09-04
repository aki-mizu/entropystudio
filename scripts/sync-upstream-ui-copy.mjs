import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const typescript = require('typescript');
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const upstreamRoot = join(root, 'entropylab');
const upstreamAppFile = join(upstreamRoot, 'src/js/app.js');
const upstreamLocaleCatalogFile = join(upstreamRoot, 'src/locales/es.json');
const upstreamLabelsFile = join(upstreamRoot, 'src/js/i18n-labels.js');
const upstreamUiCopyFile = join(root, 'example/src/features/upstreamUiCopy.ts');

const upstreamSourceKeys = readUpstreamSourceKeys();
const upstreamSourceSet = new Set(upstreamSourceKeys);
const upstreamRenderedSource = readFileSync(upstreamAppFile, 'utf8');
const upstreamLabelsSource = sourceFile(upstreamLabelsFile);
const upstreamUiCopySource = sourceFile(upstreamUiCopyFile);
const staticText = findStaticText(upstreamUiCopySource);
const upstreamLabelExports = new Set(findUpstreamLabelExports(upstreamUiCopySource));

for (const entry of staticText) {
  assertCurrentUpstreamSource(entry.text, entry.location);
}
for (const name of upstreamLabelExports) {
  assertUpstreamLabelExport(name, upstreamLabelsSource);
}

console.log(
  `Studio upstream UI copy is in sync (${new Set(staticText.map(entry => entry.text)).size} static alias value(s); ${upstreamLabelExports.size} label table(s))`,
);

function readUpstreamSourceKeys() {
  // EntropyLab's translated locale catalogs use English source text as their
  // keys. Studio verifies its static aliases against this set without
  // bundling or copying a translated locale catalog.
  const catalog = JSON.parse(readFileSync(upstreamLocaleCatalogFile, 'utf8'));
  if (!catalog || Array.isArray(catalog) || typeof catalog !== 'object') {
    fail('Pinned EntropyLab es.json must be a content-keyed locale object.');
  }
  return Object.keys(catalog);
}

function assertCurrentUpstreamSource(text, location) {
  if (!upstreamSourceSet.has(text) && !upstreamRenderedSource.includes(text)) {
    fail(`${location} is not current pinned upstream UI text: ${JSON.stringify(text)}.`);
  }
}

function fail(message) {
  console.error(`upstream UI copy sync failed: ${message}`);
  process.exit(1);
}

function findStaticText(source) {
  const filePath = source.fileName;
  let initializer;

  for (const statement of source.statements) {
    if (!typescript.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (
        typescript.isIdentifier(declaration.name) &&
        declaration.name.text === 'UPSTREAM_TEXT' &&
        declaration.initializer
      ) {
        initializer = declaration.initializer;
      }
    }
  }

  if (!initializer) {
    fail(`${relative(root, filePath)} must export a static UPSTREAM_TEXT object.`);
  }

  const entries = [];

  function visit(node) {
    while (typescript.isAsExpression(node) || typescript.isParenthesizedExpression(node)) {
      node = node.expression;
    }
    if (typescript.isStringLiteral(node) || typescript.isNoSubstitutionTemplateLiteral(node)) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      entries.push({
        location: `${relative(root, filePath)}:${line + 1}`,
        text: node.text,
      });
      return;
    }
    if (
      typescript.isObjectLiteralExpression(node) ||
      typescript.isArrayLiteralExpression(node)
    ) {
      const values = typescript.isObjectLiteralExpression(node)
        ? node.properties.map(property => {
            if (!typescript.isPropertyAssignment(property)) {
              fail(`${relative(root, filePath)} must keep UPSTREAM_TEXT fully static.`);
            }
            return property.initializer;
          })
        : node.elements;
      for (const value of values) {
        visit(value);
      }
      return;
    }
    fail(`${relative(root, filePath)} must keep UPSTREAM_TEXT fully static.`);
  }

  visit(initializer);
  return entries;
}

function findUpstreamLabelExports(source) {
  const exports = [];

  for (const statement of source.statements) {
    if (
      !typescript.isImportDeclaration(statement) ||
      !typescript.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.endsWith('/i18n-labels.js') ||
      !statement.importClause?.namedBindings ||
      !typescript.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue;
    }
    for (const imported of statement.importClause.namedBindings.elements) {
      exports.push((imported.propertyName ?? imported.name).text);
    }
  }

  return exports;
}

function assertUpstreamLabelExport(name, source) {
  const values = findStaticLabelExport(source, name);
  const unsupportedValues = values.filter(value => !upstreamSourceSet.has(value));
  if (unsupportedValues.length) {
    fail(
      `i18n-labels.js export ${name} has value(s) absent from upstream es.json: ` +
        unsupportedValues.map(value => JSON.stringify(value)).join(', '),
    );
  }
}

function findStaticLabelExport(source, name) {
  let initializer;

  for (const statement of source.statements) {
    if (!typescript.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (
        typescript.isIdentifier(declaration.name) &&
        declaration.name.text === name &&
        declaration.initializer
      ) {
        initializer = declaration.initializer;
      }
    }
  }

  if (!initializer) {
    fail(`Unknown i18n-labels.js export imported by Studio: ${name}.`);
  }

  return collectStaticStrings(initializer, source, `i18n-labels.js export ${name}`);
}

function collectStaticStrings(node, source, description) {
  while (typescript.isAsExpression(node) || typescript.isParenthesizedExpression(node)) {
    node = node.expression;
  }
  if (
    typescript.isCallExpression(node) &&
    node.arguments.length === 1 &&
    typescript.isPropertyAccessExpression(node.expression) &&
    typescript.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === 'Object' &&
    node.expression.name.text === 'freeze'
  ) {
    return collectStaticStrings(node.arguments[0], source, description);
  }
  if (typescript.isStringLiteral(node) || typescript.isNoSubstitutionTemplateLiteral(node)) {
    return [node.text];
  }
  if (typescript.isArrayLiteralExpression(node)) {
    return node.elements.flatMap(element => collectStaticStrings(element, source, description));
  }
  if (typescript.isObjectLiteralExpression(node)) {
    return node.properties.flatMap(property => {
      if (!typescript.isPropertyAssignment(property)) {
        fail(`${relative(root, source.fileName)} ${description} must be fully static.`);
      }
      return collectStaticStrings(property.initializer, source, description);
    });
  }
  fail(`${relative(root, source.fileName)} ${description} must be fully static.`);
}

function sourceFile(filePath) {
  return typescript.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    typescript.ScriptTarget.Latest,
    true,
  );
}