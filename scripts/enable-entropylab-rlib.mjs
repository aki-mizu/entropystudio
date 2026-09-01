import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [entropylabPath] = process.argv.slice(2);

if (entropylabPath === undefined) {
  throw new Error("Usage: node scripts/enable-entropylab-rlib.mjs <entropylab-path>");
}

const manifest = resolve(entropylabPath, "entropylab-wasm", "Cargo.toml");
const source = await readFile(manifest, "utf8");
const cdylibOnly = /^crate-type = \["cdylib"\]$/gm;
const reusable = /^crate-type = \["cdylib", "rlib"\]$/gm;
const cdylibOnlyCount = [...source.matchAll(cdylibOnly)].length;
const reusableCount = [...source.matchAll(reusable)].length;

if (cdylibOnlyCount === 1 && reusableCount === 0) {
  await writeFile(manifest, source.replace(cdylibOnly, 'crate-type = ["cdylib", "rlib"]'));
  console.log(`Enabled rlib output in ${manifest}`);
} else if (cdylibOnlyCount === 0 && reusableCount === 1) {
  console.log(`rlib output is already enabled in ${manifest}`);
} else {
  throw new Error(`Unexpected crate-type declaration in ${manifest}`);
}