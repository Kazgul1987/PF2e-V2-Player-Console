import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));
if (manifest.id !== "pf2e-v2-player-console") throw new Error("Unexpected module id");
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error("Manifest version must use x.y.z release format");
for (const key of ["url", "manifest", "download"]) {
    if (!manifest[key]) throw new Error(`Manifest is missing ${key}`);
    const url = new URL(manifest[key]);
    if (url.protocol !== "https:") throw new Error(`Manifest ${key} must be an HTTPS URL`);
}
const expectedRepository = "https://github.com/Kazgul1987/PF2e-V2-Player-Console";
if (manifest.url !== expectedRepository) throw new Error("Manifest repository URL is inconsistent");
if (manifest.manifest !== `${manifest.url}/releases/latest/download/module.json`) throw new Error("Manifest update URL is inconsistent");
if (manifest.download !== `${manifest.url}/releases/latest/download/${manifest.id}.zip`) throw new Error("Manifest download URL is inconsistent with the release workflow convention");
if (manifest.compatibility.maximum !== "14") throw new Error("Manifest must target Foundry 14");
if (!manifest.relationships.systems.some((system) => system.id === "pf2e" && system.type === "system")) {
    throw new Error("PF2e must be a required system relationship");
}
for (const path of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map((language) => language.path)]) {
    await access(new URL(`../${path}`, import.meta.url));
}
for (const language of manifest.languages) {
    const translations = JSON.parse(await readFile(new URL(`../${language.path}`, import.meta.url), "utf8"));
    if (!translations.PF2E_V2_PLAYER_CONSOLE?.Tabs?.character) throw new Error(`Missing localization namespace in ${language.path}`);
}
for (const template of ["header", "navigation", "character", "actions", "inventory", "spellcasting", "crafting", "proficiencies", "feats", "effects", "biography", "pfs", "inventory-item"]) {
    await access(new URL(`../src/templates/character-sheet/${template}.hbs`, import.meta.url));
}
for (const template of ["console", "selector", "character-pane"]) {
    await access(new URL(`../src/templates/gm-console/${template}.hbs`, import.meta.url));
}
console.log("Manifest and module paths are valid.");

const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));
const sourceFiles = [
    "module.js", "constants.js", "settings.js", "app/character-sheet/character-sheet-v2.js", "app/gm-console/gm-character-console.js",
    "controllers/roll-controller.js", "controllers/inventory-controller.js", "controllers/action-controller.js", "controllers/feat-controller.js", "controllers/spellcasting-controller.js", "controllers/crafting-controller.js", "controllers/proficiencies-controller.js", "controllers/effects-controller.js", "controllers/biography-controller.js", "controllers/pfs-controller.js",
    "pf2e/character-adapter.js", "pf2e/inventory-adapter.js", "pf2e/actions-adapter.js", "pf2e/feats-adapter.js", "pf2e/spellcasting-adapter.js", "pf2e/crafting-adapter.js", "pf2e/proficiencies-adapter.js", "pf2e/effects-adapter.js", "pf2e/biography-adapter.js", "pf2e/pfs-adapter.js", "pf2e/item-summary.js",
];
for (const relativePath of sourceFiles) {
    const absolutePath = resolve(sourceRoot, relativePath);
    const source = await readFile(absolutePath, "utf8");
    for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
        await access(resolve(dirname(absolutePath), match[1]));
    }
}
console.log("JavaScript relative imports are valid.");
