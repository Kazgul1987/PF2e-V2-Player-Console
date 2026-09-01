import { parseCheckDCInput, resolveCheckDC } from "./check-dc.js";
import { postCheck, prepareCheckButtons } from "./checks.js";
import { DAMAGE_TYPE_ICONS, getAvailableDamageTypes, rollDamage, STANDARD_DAMAGE_TYPES } from "./damage.js";
import { parseQuickRollInput } from "./parser.js";

const GROUPS = {
    Physical: ["bludgeoning", "piercing", "slashing", "bleed"],
    Energy: ["acid", "cold", "electricity", "fire", "force", "sonic"],
    Other: ["mental", "poison", "spirit", "vitality", "void", "untyped"],
};

export class QuickRollController {
    selectedDamageType = null;

    prepareContext() {
        const localize = (key) => game.i18n.localize(key);
        const available = getAvailableDamageTypes();
        const labels = CONFIG.PF2E.damageTypes ?? {};
        const typeData = (type) => ({ type, label: ["bludgeoning", "piercing", "slashing"].includes(type) ? type[0].toUpperCase() : localize(labels[type] ?? type), title: localize(labels[type] ?? type), icon: DAMAGE_TYPE_ICONS[type], selected: type === this.selectedDamageType });
        const groups = Object.entries(GROUPS).map(([label, types]) => ({ label: localize(`PF2E_V2_PLAYER_CONSOLE.GMConsole.QuickRolls.Groups.${label}`), types: types.filter((type) => available.has(type)).map(typeData) }));
        const standard = new Set(STANDARD_DAMAGE_TYPES);
        const additional = [...available].filter((type) => !standard.has(type));
        if (additional.length) groups.push({ label: localize("PF2E_V2_PLAYER_CONSOLE.GMConsole.QuickRolls.Groups.Additional"), types: additional.map(typeData) });
        return { groups, playerTargets: this.#preparePlayerTargets(), ...prepareCheckButtons(localize) };
    }

    #preparePlayerTargets() {
        const scene = canvas?.ready ? canvas.scene : null;
        if (!scene) return [];

        const assignedActorIds = new Set((game.users ?? [])
            .filter((user) => !user.isGM && user.character?.type === "character")
            .map((user) => user.character.id));
        const targets = game.user?.targets ?? new Set();
        const documents = [...(scene.tokens ?? [])]
            .filter((token) => assignedActorIds.has(token.actorId) && token.actor?.type === "character");
        const totals = new Map();
        for (const token of documents) {
            const name = token.actor.name;
            totals.set(name, (totals.get(name) ?? 0) + 1);
        }
        const occurrences = new Map();
        return documents.map((document) => {
            const name = document.actor.name;
            const occurrence = (occurrences.get(name) ?? 0) + 1;
            occurrences.set(name, occurrence);
            return {
                id: document.id,
                label: totals.get(name) > 1 && occurrence > 1 ? `${name} (${occurrence})` : name,
                targeted: !!document.object && targets.has(document.object),
            };
        });
    }

    setPlayerTarget(tokenId, targeted) {
        const token = canvas?.ready ? canvas.scene?.tokens.get(tokenId)?.object : null;
        token?.setTarget(targeted, { user: game.user, releaseOthers: false });
    }

    setAllPlayerTargets(tokenIds, targeted) {
        for (const tokenId of tokenIds) this.setPlayerTarget(tokenId, targeted);
    }

    selectDamageType(type, root) {
        this.selectedDamageType = this.selectedDamageType === type ? null : type;
        for (const button of root.querySelectorAll("[data-damage-type]")) {
            const selected = button.dataset.damageType === this.selectedDamageType;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        }
    }

    async postCheck(slug, rawDC) {
        const resolved = resolveCheckDC(parseCheckDCInput(rawDC));
        if (!resolved.valid) return false;
        return postCheck(slug, { dc: resolved.dc });
    }

    async processInput(value, event) {
        return this.selectedDamageType ? rollDamage(value, this.selectedDamageType) : parseQuickRollInput(value, event);
    }
}
