import { LOG_PREFIX } from "../constants.js";

/** Presentation-only view over PF2e's PFS source data and prepared boon collection. */
export class PFSAdapter {
    static prepare(actor) {
        const pfs = actor?.system?.pfs;
        if (!pfs || !Array.isArray(actor?.pfsBoons)) {
            throw new Error(`${LOG_PREFIX} PF2e PFS prepared data is unavailable`);
        }
        const configuredFactions = CONFIG.PF2E.pfsFactions ?? {};
        const factions = Object.entries(configuredFactions).map(([slug, label]) => ({
            slug,
            label: game.i18n.localize(label),
            reputation: pfs.reputation?.[slug] ?? null,
            selected: pfs.currentFaction === slug,
        }));

        return {
            playerNumber: pfs.playerNumber ?? null,
            characterNumber: pfs.characterNumber ?? null,
            levelBump: Boolean(pfs.levelBump),
            currentFaction: pfs.currentFaction,
            factions,
            boons: actor.pfsBoons.map((item) => ({
                id: item.id,
                name: item.name,
                img: item.img,
                level: item.level ?? item.system?.level?.value ?? null,
                movable: !item.grantedBy,
            })),
        };
    }
}
