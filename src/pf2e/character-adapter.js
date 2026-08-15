import { LOG_PREFIX } from "../constants.js";

const SAVE_SLUGS = ["fortitude", "reflex", "will"];
const ATTRIBUTE_SLUGS = ["str", "dex", "con", "int", "wis", "cha"];
const MOVEMENT_SLUGS = ["land", "swim", "climb", "fly", "burrow"];

function signed(value) {
    return Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value}` : "—";
}

function statisticView(statistic, slug, fallbackLabel) {
    if (!statistic) {
        console.warn(`${LOG_PREFIX} Statistic not available`, { slug });
        return { slug, label: fallbackLabel, modifier: "—" };
    }

    return {
        slug,
        label: statistic.label ?? fallbackLabel,
        modifier: signed(statistic.mod),
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
        const abilities = actor.system.abilities ?? {};
        const attributes = ATTRIBUTE_SLUGS.map((slug) => ({
            slug,
            label: game.i18n.localize(abilities[slug]?.shortLabel ?? `PF2E.AbilityId.${slug}`),
            modifier: signed(abilities[slug]?.mod),
        }));
        const preparedSpeeds = actor.system.movement?.speeds ?? {};
        const speeds = MOVEMENT_SLUGS.flatMap((slug) => {
            const speed = preparedSpeeds[slug];
            return speed?.value
                ? [{ slug, label: game.i18n.localize(`PF2E.Actor.Speed.Type.${`${slug[0].toUpperCase()}${slug.slice(1)}`}`), value: speed.value }]
                : [];
        });
        const languageSlugs = actor.system.details?.languages?.value ?? [];
        const languages = languageSlugs.map((slug) => ({
            slug,
            label: game.i18n.localize(CONFIG.PF2E.languages?.[slug] ?? slug),
        })).sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
        const preparedShield = actor.system.attributes?.shield;
        const shield = actor.heldShield && preparedShield?.itemId === actor.heldShield.id ? {
            name: preparedShield.name ?? actor.heldShield.name,
            hardness: preparedShield.hardness,
            hp: preparedShield.hp,
            brokenThreshold: preparedShield.brokenThreshold,
            raised: preparedShield.raised === true,
            broken: preparedShield.broken === true,
            destroyed: preparedShield.destroyed === true,
        } : null;

        return {
            id: actor.id,
            uuid: actor.uuid,
            name: actor.name,
            img: actor.img,
            level: actor.level ?? actor.system.details?.level?.value ?? 0,
            hp: actor.system.attributes?.hp ?? { value: 0, max: 0 },
            ac: actor.armorClass?.value ?? actor.system.attributes?.ac?.value ?? "—",
            attributes,
            speeds,
            shield,
            languages,
            perception: statisticView(perception, "perception", game.i18n.localize("PF2E.PerceptionLabel")),
            saves,
            skills,
        };
    }
}
