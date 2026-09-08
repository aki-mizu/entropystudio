import { rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);

await Promise.all([
  rm(new URL("android/generated", root), { recursive: true, force: true }),
  rm(new URL("android/src/main/jniLibs", root), { recursive: true, force: true }),
  rm(new URL("cpp", root), { recursive: true, force: true }),
  rm(new URL("ios/generated", root), { recursive: true, force: true }),
  rm(new URL("js/generated", root), { recursive: true, force: true }),
  rm(new URL("ios/EntropystudioFfi.h", root), { force: true }),
  rm(new URL("ios/EntropystudioFfi.mm", root), { force: true }),
  rm(new URL("js/NativeEntropystudioFfi.ts", root), { force: true }),
  rm(new URL("js/index.ts", root), { force: true }),
]);
