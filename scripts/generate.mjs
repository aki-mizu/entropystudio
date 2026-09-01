import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const libraryNames = {
  darwin: "libentropystudio_ffi.dylib",
  linux: "libentropystudio_ffi.so",
  win32: "entropystudio_ffi.dll",
};
const libraryName = libraryNames[process.platform];

if (libraryName === undefined) {
  throw new Error(`Unsupported build platform: ${process.platform}`);
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: fileURLToPath(cwd), stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with status ${code}`));
      }
    });
  });
}

const configuredLibrary = process.env.ENTROPYSTUDIO_FFI_LIBRARY;
if (configuredLibrary === undefined) {
  await run("cargo", ["build", "--lib"], root);
}

const library = configuredLibrary ?? fileURLToPath(new URL(`target/debug/${libraryName}`, root));
const typescript = fileURLToPath(new URL("js/generated", root));
const cpp = fileURLToPath(new URL("cpp/generated", root));
const config = fileURLToPath(new URL("ubrn.config.yaml", root));
const ubrn = fileURLToPath(new URL(`node_modules/.bin/ubrn${process.platform === "win32" ? ".cmd" : ""}`, root));

await run(
  ubrn,
  ["generate", "jsi", "bindings", library, "--library", "--ts-dir", typescript, "--cpp-dir", cpp, "--no-format"],
  root
);

await run(
  ubrn,
  ["generate", "jsi", "turbo-module", "entropystudio_ffi", "--native-bindings", "--config", config],
  root
);