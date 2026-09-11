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
const upstreamVanityJs = readFileSync(
  resolve(__dirname, '../../../entropylab/src/js/vanity.js'),
  'utf8',
);
const upstreamShellHtml = readOptionalSource('src/shell.html');
const renderedUpstreamAppJs = decodeJavaScriptEscapes(upstreamAppJs);
const renderedUpstreamUiSources = [
  renderedUpstreamAppJs,
  decodeJavaScriptEscapes(upstreamVanityJs),
  decodeJavaScriptEscapes(readOptionalSource('src/js/i18n-labels.js')),
  upstreamShellHtml,
  readOptionalSource('src/index.html'),
  // The catalog's keys are English source text; it is read only by this
  // provenance test and is never bundled by the React Native app.
  readOptionalSource('src/locales/es.json'),
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

  test('excludes upstream accessibility-only copy', () => {
    expect(Object.keys(UPSTREAM_UI_FALLBACK_COPY.keyboard).sort()).toEqual([
      'modeButton',
      'spaceButton',
    ]);
    expect(UPSTREAM_TEXT.hex).not.toHaveProperty('enterDigit');
    expect(UPSTREAM_TEXT.hex).not.toHaveProperty('keypadAria');
    expect(UPSTREAM_TEXT.seed).not.toHaveProperty('enterDigit');
    expect(UPSTREAM_TEXT.seed).not.toHaveProperty('lastWordAria');
    expect(UPSTREAM_TEXT.seed).not.toHaveProperty('numberKeypadAria');
    expect(UPSTREAM_TEXT.seed).not.toHaveProperty('wordSlotsAria');
  });

  test('copies every dynamic formatter only from current upstream templates', () => {
    const dynamicFallbackTemplates = {
      'calculations.die': {
        source: upstreamAppJs,
        template: /Die \$\{index \+ 1\}/,
      },
      'calculations.numberBaseConversion': {
        source: upstreamAppJs,
        template:
          /Each \$\{meta\.shortLabel\} digit uses the binary value shown below before the 11-bit BIP39 calculations\./,
      },
      'calculations.numberBaseDigitValues': {
        source: upstreamAppJs,
        template: /\$\{meta\.shortLabel\} digit values/,
      },
      'calculations.numberBaseTitle': {
        source: upstreamAppJs,
        template: /\$\{meta\.label\} calculations/,
      },
      'calculations.word': {
        source: upstreamAppJs,
        template: /Word \$\{row\.number\}/,
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
      'keys.advanced.accountIndexHelp': {
        source: upstreamAppJs,
        template:
          /Account index · \$\{hardening\.account \? "Hardened" : "Unhardened"\} · 0 to 2,147,483,647/,
      },
      'keys.advanced.addressRangeHelp': {
        source: upstreamAppJs,
        template:
          /Derives \$\{addressCopies\} \$\{range \* branches\.length === 1 \? "address" : "addresses"\} · Max \$\{maximum\.toLocaleString\(\)\}/,
      },
      'keys.advanced.addressEstimate': {
        source: upstreamAppJs,
        template:
          /Estimated derivation time on this device: \$\{hodlFormatAddressEstimate\(hodlAddressBenchmarkMs \* range \* branches\.length \* keyCount\)\}\./,
      },
      'keys.advanced.addressStartHelp': {
        source: upstreamAppJs,
        template:
          /First \$\{branchLabels\.toLowerCase\(\)\} index to derive · \$\{hardening\.address \? "Hardened" : "Unhardened"\} · 0 to 2,147,483,647/,
      },
      'keys.advanced.branchLabel': {
        source: upstreamAppJs,
        template:
          /return branch === 0 \? "Receive" : branch === 1 \? "Change" : `Custom branch \$\{branch\}`;/,
      },
      'keys.advanced.branchRangeHelp': {
        source: upstreamAppJs,
        template:
          /Derives \$\{branchLabels\} \$\{hardening\.branch \? "hardened " : ""\}\$\{branches\.length === 1 \? "branch" : "branches"\} · Max \$\{branchMaximum\}/,
      },
      'keys.advanced.branchStartHelp': {
        source: upstreamAppJs,
        template:
          /First address branch to derive · 0 is Receive · 1 is Change · \$\{hardening\.branch \? "Hardened" : "Unhardened"\} · 0 to 2,147,483,647/,
      },
      'keys.advanced.coinTypeIndexHelp': {
        source: upstreamAppJs,
        template:
          /Coin type index · \$\{label\} · \$\{hardened \? "Hardened" : "Unhardened"\} · 0 to 2,147,483,647/,
      },
      'keys.advanced.coinTypeLabel': {
        source: upstreamAppJs,
        template:
          /(?=[\s\S]*let label = "Custom";)(?=[\s\S]*return Number\(coinType\) === 1 \? hodlT\("Testnet"\) : Number\(coinType\) === 0 \? hodlT\("Mainnet"\) : hodlT\("Custom · Mainnet addresses"\);)/,
      },
      'keys.advanced.derivationPathHelp': {
        source: upstreamAppJs,
        template:
          /function hodlDerivationPathRangeMessage\(branchWindow, addressWindow\) \{[\s\S]*?Multiple address branches and indexes selected · path shown through the account level\.[\s\S]*?Multiple address branches selected · path shown through the account level\.[\s\S]*?Multiple address indexes selected · path shown through the address branch\.[\s\S]*?Exact BIP32 address path · edit directly to use a custom path/,
      },
      'keys.advanced.formatAddressEstimate': {
        source: upstreamAppJs,
        template:
          /function hodlFormatAddressEstimate\(milliseconds\) \{[\s\S]*?milliseconds < 100\) return hodlTText\("under 0\.1 seconds"\);[\s\S]*?milliseconds < 10000\) return hodlTText\("about \{n\} seconds", \{ n: \(milliseconds \/ 1000\)\.toFixed\(1\) \}\);[\s\S]*?milliseconds < 60000\) return hodlTText\("about \{n\} seconds", \{ n: Math\.round\(milliseconds \/ 1000\) \}\);[\s\S]*?return hodlTText\("about \{n\} minutes", \{ n: Math\.ceil\(milliseconds \/ 60000\) \}\);/,
      },
      'keys.advanced.pathValidationHelp': {
        source: upstreamAppJs,
        template:
          /(?=[\s\S]*Complete the purpose, network, and account indexes\.)(?=[\s\S]*Starting address branch index must be a whole number from 0 to 2,147,483,647\.)(?=[\s\S]*Address branch range must be a whole number from 1 to \$\{maximum\}\.)(?=[\s\S]*Starting address index must be a whole number from 0 to 2,147,483,647\.)(?=[\s\S]*Address range must be a whole number from 1 to \$\{maximum\.toLocaleString\(\)\}\.)/,
      },
      'keys.advanced.genericAddressStartHelp': {
        source: upstreamAppJs,
        template:
          /First address index to derive · \$\{hardening\.address \? "Hardened" : "Unhardened"\} · 0 to 2,147,483,647/,
      },
      'keys.advanced.hardeningLabel': {
        source: upstreamAppJs,
        template:
          /hardening\.(?:purpose|coinType|account|branch|address) \? "Hardened" : "Unhardened"/,
      },
      'keys.advanced.purposeIndexHelp': {
        source: upstreamAppJs,
        template:
          /Purpose index · \$\{hardening\.purpose \? "Hardened" : "Unhardened"\} · 0 to 2,147,483,647/,
      },
      'keys.scriptTypeKicker': {
        source: upstreamAppJs,
        template:
          /purposeLabel = account\.imported \? account\.def\.bip : `Purpose \$\{hodlPathComponent\(account\.def\.purpose, account\.def\.purposeHardened !== false\)\}`[\s\S]*?\$\{hodlEscapeHtml\(purposeLabel\)\} \\xB7 \$\{hodlEscapeHtml\(hodlWalletResult\.network\)\}/,
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
      'numberBases.progress': {
        source: upstreamAppJs,
        template:
          /\$\{analysis\.count\} of \$\{analysis\.limit\} \$\{definition\.unit\} \\xB7 \$\{words\.length\} of \$\{config\.words\} seed words filled/,
      },
      'privateKey.progress.brain.empty': {
        source: upstreamAppJs,
        template: /No text entered \\xB7 brain wallets are unsafe/,
      },
      'privateKey.progress.brain.entered': {
        source: upstreamAppJs,
        template: /Text entered \\xB7 \$\{convention\} \\xB7 brain wallets are unsafe/,
      },
      'privateKey.progress.brain.trimmedEmpty': {
        source: upstreamAppJs,
        template:
          /Boundary whitespace trimming leaves an empty passphrase \\xB7 enter non-whitespace text or turn trimming off/,
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
      'result.seedPhrase': {
        source: upstreamAppJs,
        template:
          /Your seed phrase \\xB7 \$\{wallet\.mnemonic\.trim\(\)\.split\(\/\\s\+\/\)\.length\} words/,
      },
      'result.bitcoinCore': {
        source: upstreamAppJs,
        template: /field\(`Bitcoin Core \$\{coreLabel\}`, core\)/,
      },
      'result.genericDescriptorCompatibility': {
        source: upstreamAppJs,
        template: /hodlPrivateFieldHtml\("Generic \{name\} for descriptor compatibility", account\.genericPrivate, \{ name: account\.genericPrivateLabel \}\)/,
      },
      'result.multisigCosigner': {
        source: upstreamAppJs,
        template: /hodlPublicFieldHtml\("Multisig co-signer \{prefix\} · \{label\}", item\.value, \{ prefix: item\.prefix, label: item\.label \}\)/,
      },
      'result.address': {
        source: upstreamAppJs,
        template: /\$\{hodlEscapeHtml\(firstLabel\)\} address #\$\{hodlAddressIndexHtml\(firstIndex\)\}/,
      },
      'result.addressCheckMatch': {
        source: upstreamAppJs,
        template: /\$\{chain\} address #\$\{hit\.index\} of this wallet \\xB7 \$\{hodlDisplayDerivationPath\(hit\.path\)\}\$\{extra\}/,
      },
      'result.addressCheckSearching': {
        source: upstreamAppJs,
        template: /hodlTText\("Not in the \{n\} shown addresses\. Checking further indices", \{ n: shown \}\)/,
      },
      'result.addressCheckMiss': {
        source: upstreamAppJs,
        template: /No match in \$\{hodlAddressBranchSummary\(rows\.branches\.map\(\(branch\) => branch\.branch\)\)\.toLowerCase\(\)\} indices \$\{Number\.isFinite\(firstShown\) \? firstShown : 0\}\\u2013\$\{beyond\.searchedTo \?\? lastShown\} of this derivation\./,
      },
      'result.addressesWithWif': {
        source: upstreamAppJs,
        template: /hodlTText\("\{label\} with WIF private keys", \{ label \}\)/,
      },
      'result.spendingDescriptor': {
        source: upstreamAppJs,
        template: /let label = `\$\{isPrivate \? "Spending" : "Watch-only"\} \$\{hodlAddressBranchLabel\(branch\.branch\)\.toLowerCase\(\)\} descriptor`/,
      },
      'result.watchOnlyDescriptor': {
        source: upstreamAppJs,
        template: /let label = `\$\{isPrivate \? "Spending" : "Watch-only"\} \$\{hodlAddressBranchLabel\(branch\.branch\)\.toLowerCase\(\)\} descriptor`/,
      },
      'result.slip132': {
        source: upstreamAppJs,
        template: /field\(`SLIP-132 \$\{slipLabel\}`, slip\)/,
      },
      'seedPhrase.placeholder': {
        source: upstreamAppJs,
        template: /placeholder="Enter exactly \$\{config\.words\} BIP39 words"/,
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
      'vanity.errors.accountPathNeedsComponents': {
        source: upstreamAppJs,
        template:
          /Key \$\{label\}'s derivation path needs purpose, coin type, and account components\./,
      },
      'vanity.errors.branchAndAddressIndexes': {
        source: upstreamAppJs,
        template:
          /Key \$\{label\}'s branch and address indexes must be whole numbers from 0 to 2,147,483,647\./,
      },
      'vanity.errors.counterRangePast': {
        source: upstreamVanityJs,
        template:
          /The range runs past the \$\{passLen\}-character space \(\$\{limit\.toString\(\)\} counters\)\./,
      },
      'vanity.errors.counterStartBeyond': {
        source: upstreamVanityJs,
        template:
          /The start counter is beyond the \$\{passLen\}-character counter space\./,
      },
      'vanity.errors.keyNoLongerInStation': {
        source: upstreamAppJs,
        template:
          /Key \$\{run\.sourceLabel\} is no longer in Key Station, so there is nothing to update\./,
      },
      'vanity.errors.mainnetOnly': {
        source: upstreamAppJs,
        template:
          /Vanity matching is Bitcoin mainnet: key \$\{label\} derives coin type \$\{accountComponents\[1\] & VANITY_MAX_INDEX\}\. Pick a mainnet key \(coin type 0\)\./,
      },
      'vanity.errors.mnemonicTooLong': {
        source: upstreamVanityJs,
        template:
          /The mnemonic is \$\{length\} UTF-8 bytes, over the \$\{VANITY_MAX_MNEMONIC_LEN\}-byte vanity limit\./,
      },
      'vanity.errors.noKeyMaterial': {
        source: upstreamAppJs,
        template: /Key \$\{label\} carries neither seed words nor a root xprv\./,
      },
      'vanity.errors.noMnemonicForPassphrase': {
        source: upstreamAppJs,
        template:
          /Key \$\{label\} has no seed words \(root xprv\), so its passphrase cannot be extended — switch to the derivation grind\./,
      },
      'vanity.errors.passphraseLength': {
        source: upstreamVanityJs,
        template: /Passphrase length is 1 to \$\{VANITY_MAX_PASS_LEN\} characters\./,
      },
      'vanity.errors.pathTooDeep': {
        source: upstreamVanityJs,
        template:
          /Derivation paths are at most \$\{VANITY_MAX_PATH_LEN\} components deep for the vanity grind\./,
      },
      'vanity.errors.prefixMustStartWith': {
        source: upstreamVanityJs,
        template:
          /\$\{meta\.label\} addresses start with “\$\{meta\.prefix\}”; the prefix must too\./,
      },
      'vanity.errors.prefixNeedsAdditionalCharacter': {
        source: upstreamVanityJs,
        template:
          /Add at least one character after “\$\{meta\.prefix\}” — “\$\{meta\.prefix\}” alone matches every \$\{meta\.label\} address\./,
      },
      'vanity.errors.prefixTooLong': {
        source: upstreamVanityJs,
        template:
          /The prefix is longer than a whole \$\{meta\.label\} address \(\$\{meta\.max\} characters\)\./,
      },
      'vanity.errors.silentPaymentParity': {
        source: upstreamVanityJs,
        template:
          /The character after “\$\{meta\.prefix\}” encodes the scan key's parity: every \$\{meta\.label\} code continues with one of \$\{\[\.\.\.meta\.firstFree\]\.join\(", "\)\}\./,
      },
      'vanity.errors.startingPassphraseTooLong': {
        source: upstreamVanityJs,
        template:
          /The starting passphrase is \$\{length\} UTF-8 bytes, over the \$\{VANITY_MAX_SALT_LEN\}-byte vanity limit — shorten it on the Keys tab\./,
      },
      'vanity.errors.watchOnly': {
        source: upstreamAppJs,
        template:
          /Key \$\{label\} is watch-only; the derivation grind needs private material\./,
      },
      'vanity.errors.wholeNumber': {
        source: upstreamAppJs,
        template: /\$\{label\} is a whole number \(digits only\)\./,
      },
      'vanity.estimate.formatDuration': {
        source: upstreamAppJs,
        template:
          /function hodlVanityFormatDuration\(seconds\) \{[\s\S]*?seconds < 1\) return "under a second";[\s\S]*?seconds < 90\) return `\$\{Math\.round\(seconds\)\} second\$\{Math\.round\(seconds\) === 1 \? "" : "s"\}`;[\s\S]*?return `\$\{Math\.round\(days \/ 365\)\.toLocaleString\("en-US"\)\} years`;/,
      },
      'vanity.estimate.summary': {
        source: upstreamAppJs,
        template:
          /estimateEl\.textContent = `Prefix “\$\{prefix\}” matches about 1 in \$\{hodlVanityFormatCount\(work\)\} \$\{hodlVanityScript\(\)\.label\} candidates on average\. \$\{timing\}`;/,
      },
      'vanity.estimate.timing': {
        source: upstreamAppJs,
        template:
          /At about \$\{hodlVanityFormatCount\(Math\.round\(rate\)\)\} candidates\/s[\s\S]*?expect a match roughly every \$\{hodlVanityFormatDuration\(Number\(work\) \/ rate\)\}\./,
      },
      'vanity.form.prefixHelp.base58': {
        source: upstreamAppJs,
        template:
          /\$\{meta\.label\} prefix, starts with “\$\{meta\.prefix\}”\. Live-filtered to base58 characters; each free character multiplies the work by ~58\./,
      },
      'vanity.form.prefixHelp.bech32': {
        source: upstreamAppJs,
        template:
          /\$\{meta\.label\} prefix, starts with “\$\{meta\.prefix\}”\. Live-filtered to lowercase bech32 characters; each free character multiplies the work by ~32\./,
      },
      'vanity.form.prefixHelp.silentPayment': {
        source: upstreamAppJs,
        template:
          /\$\{meta\.label\} code, starts with “\$\{meta\.prefix\}”; the next character is one of \$\{\[\.\.\.meta\.firstFree\]\.join\(" "\)\} \(the scan key's parity\)\. Live-filtered to lowercase bech32 characters; each further free character multiplies the work by ~32\./,
      },
      'vanity.form.prefixPlaceholder': {
        source: upstreamAppJs,
        template: /input\.placeholder = `\$\{meta\.prefix\}…`;/,
      },
      'vanity.result.addressWhere': {
        source: upstreamAppJs,
        template:
          /`the \$\{hodlEscapeHtml\(meta\.label\)\} address at \$\{hodlEscapeHtml\(hodlDisplayDerivationPath\(run\.pathText\)\)\}`/,
      },
      'vanity.result.derivationDescription': {
        source: upstreamAppJs,
        template:
          /Each row is a BIP32 account index of key \$\{label\} — with its passphrase unchanged, \$\{where\} starts with the prefix\. Update key sets that account on the key and re-derives it, so the Keys tab, its exports, and the Journal show this wallet\./,
      },
      'vanity.result.matchesHeading': {
        source: upstreamAppJs,
        template: /Matching \$\{derivation \? "accounts" : "passphrases"\}/,
      },
      'vanity.result.overflow': {
        source: upstreamAppJs,
        template:
          /Only the first \$\{hodlVanityMatches\.length\} matches are listed; \$\{hodlVanityFormatCount\(hodlVanityFound\)\} found in total\./,
      },
      'vanity.result.maskedPassphrase': {
        source: upstreamAppJs,
        template: /hodlEscapeHtml\("•"\.repeat\(12\)\)/,
      },
      'vanity.result.passphraseDescription': {
        source: upstreamAppJs,
        template:
          /Each row is a new BIP39 passphrase for key \$\{label\}: the starting passphrase followed by the counter characters\. With this key's seed words it derives \$\{where\}\. Update key writes the passphrase to the key and re-derives it, so the Keys tab, its exports, and the Journal show this wallet\. Anyone holding the words and this passphrase holds the coins\./,
      },
      'vanity.result.savedToKey': {
        source: upstreamAppJs,
        template: /Saved to key \$\{hodlEscapeHtml\(match\.savedTo\)\}/,
      },
      'vanity.result.silentPaymentWhere': {
        source: upstreamAppJs,
        template:
          /the BIP-352 Silent Payment code of that account \(scan \$\{hodlEscapeHtml\(hodlDisplayDerivationPath\(run\.pathText\)\)\}\/1h\/0, spend …\/0h\/0\)/,
      },
      'vanity.source.fromKey': {
        source: upstreamAppJs,
        template: /if \(from\) from\.textContent = `· from key \$\{label\}`;/,
      },
      'vanity.source.kind': {
        source: upstreamAppJs,
        template:
          /if \(kind\) kind\.textContent = `\$\{hasMnemonic \? "BIP39 seed words" : "Root xprv"\}\$\{state\.name && state\.name !== label \? ` · \$\{state\.name\}` : ""\} · \$\{hodlDisplayDerivationPath\(state\.fields\?\.derivationPath \|\| ""\)\}`;/,
      },
      'vanity.source.rootXprvNote': {
        source: upstreamAppJs,
        template:
          /Key \$\{label\} was imported as a root xprv: it has no seed words, so its passphrase cannot be extended — only the derivation grind is available\./,
      },
      'vanity.source.withPassphraseNote': {
        source: upstreamAppJs,
        template:
          /Copied verbatim from key \$\{label\}'s Optional BIP39 passphrase on the Keys tab\. Passphrase grind: candidates are this text followed by the counter characters\. Derivation grind: this exact passphrase, with the account index changing\./,
      },
      'vanity.source.withoutPassphraseNote': {
        source: upstreamAppJs,
        template:
          /Key \$\{label\} has no passphrase\. Passphrase grind: candidates are the counter characters alone\. Derivation grind: no passphrase, with the account index changing\./,
      },
      'vanity.status.complete': {
        source: upstreamAppJs,
        template:
          /Stopped at first match[\s\S]*?Range complete[\s\S]*?Next \$\{inputs\.method === "derivation" \? "account" : "counter"\}: \$\{nextStart\.toString\(\)\}\./,
      },
      'vanity.status.progress': {
        source: upstreamAppJs,
        template:
          /\$\{hodlVanityFormatCount\(done\)\} \/ \$\{hodlVanityFormatCount\(total\)\} candidates · \$\{hodlVanityFormatCount\(Math\.round\(rate\)\)\}\/s · \$\{hodlVanityFound\} match\$\{hodlVanityFound === 1 \? "" : "es"\}/,
      },
      'vanity.status.saved': {
        source: upstreamAppJs,
        template:
          /Saved to key \$\{match\.savedTo\}: \$\{match\.index !== null \? `account \$\{match\.index\}` : "the new passphrase"\} is now on the key\$\{run\.sourceLabel !== match\.savedTo \? ` — its master fingerprint and LifeHash changed from \$\{run\.sourceLabel\} to \$\{match\.savedTo\}` : ""\}\. Open the Keys tab to review and export it\./,
      },
      'vanity.status.starting': {
        source: upstreamAppJs,
        template:
          /Starting workers — stepping through account indexes of key \$\{inputs\.sourceLabel\}…[\s\S]*?Starting workers — extending key \$\{inputs\.sourceLabel\}'s passphrase with the counter characters…/,
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
    )
    .replace(/\\(["'])/g, '$1');
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
