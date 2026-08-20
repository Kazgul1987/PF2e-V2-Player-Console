import { LOG_PREFIX } from "../constants.js";

/** Targeted, permission-guarded mutations for the persistent character sidebar. */
export class SidebarController {
    static async updateHitPoints(actor, value) {
        if (!actor?.isOwner) return this.#notEditable();
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return null;
        return actor.update({ "system.attributes.hp.value": numeric });
    }

    static async adjustHeroPoints(actor, delta) {
        if (!actor?.isOwner) return this.#notEditable();
        const resource = actor.getResource?.("hero-points");
        if (!resource || typeof actor.updateResource !== "function") {
            console.warn(`${LOG_PREFIX} Hero Point resource API is unavailable`, { actor: actor?.uuid });
            return null;
        }
        // PF2e owns bounds and mythic-resource semantics in updateResource.
        return actor.updateResource("hero-points", resource.value + delta);
    }

    static #notEditable() {
        ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return null;
    }
}
