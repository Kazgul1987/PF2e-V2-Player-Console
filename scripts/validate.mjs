import { access, readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));
if (manifest.id !== "pf2e-v2-player-console") throw new Error("Unexpected module id");
if (manifest.compatibility.maximum !== "14") throw new Error("Manifest must target Foundry 14");
if (!manifest.relationships.systems.some((system) => system.id === "pf2e" && system.type === "system")) {
    throw new Error("PF2e must be a required system relationship");
}
for (const path of [...manifest.esmodules, ...manifest.styles]) await access(new URL(`../${path}`, import.meta.url));
for (const template of ["header", "navigation", "character", "placeholder"]) {
    await access(new URL(`../src/templates/character-sheet/${template}.hbs`, import.meta.url));
}
console.log("Manifest and module paths are valid.");
