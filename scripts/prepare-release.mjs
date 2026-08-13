import { readFile, writeFile } from "node:fs/promises";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error("Usage: node scripts/prepare-release.mjs <x.y.z>");
}
const path = new URL("../module.json", import.meta.url);
const manifest = JSON.parse(await readFile(path, "utf8"));
manifest.version = version;
manifest.download = `${manifest.url}/releases/download/v${version}/${manifest.id}-v${version}.zip`;
await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared module.json for v${version}`);
