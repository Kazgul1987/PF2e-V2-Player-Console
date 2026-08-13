import { LOG_PREFIX } from "../constants.js";

const SAVE_SLUGS = ["fortitude", "reflex", "will"];

function statisticView(statistic, slug, fallbackLabel) {
    if (!statistic) {
        console.warn(`${LOG_PREFIX} Statistic not available`, { slug });
        return { slug, label: fallbackLabel, modifier: "—" };
    }

    return {
        slug,
        label: statistic.label ?? fallbackLabel,
        modifier: Number.isFinite(statistic.mod) ? `${statistic.mod >= 0 ? "+" : ""}${statistic.mod}` : "—",
    };
}

/** Translate stable PF2e Actor runtime data into template-only data. */
export class CharacterAdapter {
    static supports(actor) {
        return actor?.documentName === "Actor" && actor.type === "character" && actor.system;
    }

    static prepare(actor) {
        if (!this.supports(actor)) {
            throw new Error(`${LOG_PREFIX} A PF2e character Actor is required`);
        }

        const getStatistic = (slug) => actor.getStatistic?.(slug);
        const perception = actor.perception ?? getStatistic("perception");
        const saves = SAVE_SLUGS.map((slug) => statisticView(actor.saves?.[slug] ?? getStatistic(slug), slug, slug));
        const skills = Object.entries(actor.skills ?? {})
            .map(([slug, statistic]) => statisticView(statistic ?? getStatistic(slug), slug, slug))
            .sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

        return {
            id: actor.id,
            uuid: actor.uuid,
            name: actor.name,
            img: actor.img,
            level: actor.level ?? actor.system.details?.level?.value ?? 0,
            hp: actor.system.attributes?.hp ?? { value: 0, max: 0 },
            ac: actor.armorClass?.value ?? actor.system.attributes?.ac?.value ?? "—",
            perception: statisticView(perception, "perception", game.i18n.localize("PF2E.PerceptionLabel")),
            saves,
            skills,
        };
    }
}
