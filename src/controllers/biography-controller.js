const SIMPLE_PATHS = {
    height: "system.details.height.value",
    weight: "system.details.weight.value",
    birthPlace: "system.details.biography.birthPlace",
    attitude: "system.details.biography.attitude",
    beliefs: "system.details.biography.beliefs",
    likes: "system.details.biography.likes",
    dislikes: "system.details.biography.dislikes",
    catchphrases: "system.details.biography.catchphrases",
};
const RICH_TEXT_FIELDS = new Set([
    "appearance", "backstory", "campaignNotes", "allies", "enemies", "organizations",
]);
const LIST_FIELDS = new Set(["edicts", "anathema"]);
const VISIBILITY_SECTIONS = new Set(["appearance", "backstory", "personality", "campaign"]);

export class BiographyController {
    static #editable(actor) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }

    static #biography(actor) { return actor?._source?.system?.details?.biography ?? {}; }

    static value(actor, field) {
        if (field === "height" || field === "weight") return String(actor?._source?.system?.details?.[field]?.value ?? "");
        return String(this.#biography(actor)[field] ?? "");
    }

    static richTextValue(actor, field) {
        return RICH_TEXT_FIELDS.has(field) ? String(this.#biography(actor)[field] ?? "") : null;
    }

    static async updateText(actor, field, value) {
        if (!this.#editable(actor) || !Object.hasOwn(SIMPLE_PATHS, field)) return;
        const next = String(value ?? "");
        if (next === this.value(actor, field)) return;
        return actor.update({ [SIMPLE_PATHS[field]]: next });
    }

    static async updateRichText(actor, field, value) {
        if (!this.#editable(actor) || !RICH_TEXT_FIELDS.has(field)) return;
        const next = String(value ?? "");
        if (next === String(this.#biography(actor)[field] ?? "")) return;
        return actor.update({ [`system.details.biography.${field}`]: next });
    }

    static async toggleVisibility(actor, section) {
        if (!this.#editable(actor) || !actor.isOwner || !VISIBILITY_SECTIONS.has(section)) return;
        const current = this.#biography(actor).visibility?.[section] === true;
        return actor.update({ [`system.details.biography.visibility.${section}`]: !current });
    }

    static async addListEntry(actor, field) {
        if (!this.#editable(actor) || !LIST_FIELDS.has(field)) return;
        const list = this.#sourceList(actor, field);
        return actor.update({ [`system.details.biography.${field}`]: [...list, ""] });
    }

    static async updateListEntry(actor, field, index, value) {
        if (!this.#editable(actor) || !LIST_FIELDS.has(field)) return;
        const list = this.#sourceList(actor, field);
        if (!Number.isInteger(index) || index < 0 || index >= list.length) return;
        const next = String(value ?? "");
        if (list[index] === next) return;
        list[index] = next;
        return actor.update({ [`system.details.biography.${field}`]: list });
    }

    static async deleteListEntry(actor, field, index) {
        if (!this.#editable(actor) || !LIST_FIELDS.has(field)) return;
        const list = this.#sourceList(actor, field);
        if (!Number.isInteger(index) || index < 0 || index >= list.length) return;
        list.splice(index, 1);
        return actor.update({ [`system.details.biography.${field}`]: list });
    }

    static #sourceList(actor, field) {
        const value = this.#biography(actor)[field];
        return Array.isArray(value) ? [...value] : [];
    }
}
