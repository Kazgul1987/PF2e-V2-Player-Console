import { LOG_PREFIX } from "../constants.js";

const SAVE_SLUGS = ["fortitude", "reflex", "will"];
const SAVE_ICONS = { fortitude: "fa-heart", reflex: "fa-feather", will: "fa-brain" };
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
        rank: Number.isInteger(statistic.rank) ? {
            value: statistic.rank,
            label: game.i18n.localize(CONFIG.PF2E.proficiencyLevels?.[statistic.rank] ?? `PF2E.ProficiencyLevel${statistic.rank}`),
        } : null,
    };
}

function hitPointsView(hitPoints) {
    const source = hitPoints ?? {};
    const value = Number.isFinite(Number(source.value)) ? Number(source.value) : 0;
    const max = Number.isFinite(Number(source.max)) ? Math.max(0, Number(source.max)) : 0;
    const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

    return { ...source, value, max, percent, progressValue: Math.max(0, Math.min(max, value)) };
}

function conditionView(status) {
    const value = Number(status?.value) || 0;
    const max = Number(status?.max) || 0;
    return {
        value,
        max,
        active: value > 0,
        pips: Array.from({ length: max }, (_, index) => ({ filled: index < value })),
    };
}

function iwrView(entries) {
    return Array.from(entries ?? [], (entry) => ({ type: entry.type, label: entry.label }));
}

/** Build a display-only projection of PF2e's prepared experience data. */
function experienceView(experience) {
    const source = experience ?? {};
    const value = Number(source.value);
    const min = Number(source.min);
    const max = Number(source.max);
    const corePct = source.pct === null || source.pct === undefined ? Number.NaN : Number(source.pct);
    const fallbackPct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    const pct = Number.isFinite(corePct) ? corePct : fallbackPct;
    const clampedPct = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));

    return {
        value: Number.isFinite(value) ? value : 0,
        min: Number.isFinite(min) ? min : 0,
        max: Number.isFinite(max) ? max : 0,
        pct: clampedPct,
        ariaLabel: game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Character.XPProgressLabel", {
            value: Number.isFinite(value) ? value : 0,
            max: Number.isFinite(max) ? max : 0,
            pct: clampedPct,
        }),
        segments: Array.from({ length: 10 }, (_, index) => ({
            fill: Math.max(0, Math.min(100, (clampedPct - index * 10) * 10)),
        })),
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
        const saves = SAVE_SLUGS.map((slug) => ({
            ...statisticView(actor.saves?.[slug] ?? getStatistic(slug), slug, slug),
            icon: SAVE_ICONS[slug],
        }));
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
        const heroPoints = actor.getResource?.("hero-points");
        const initiative = actor.initiative?.statistic;
        const actorAttributes = actor.system.attributes ?? {};
        const deity = actor.deity;

        return {
            id: actor.id,
            uuid: actor.uuid,
            name: actor.name,
            img: actor.img,
            level: actor.level ?? actor.system.details?.level?.value ?? 0,
            deity: { exists: Boolean(deity), name: deity?.name ?? "—" },
            xp: experienceView(actor.system.details?.xp),
            hp: hitPointsView(actor.system.attributes?.hp),
            heroPoints: heroPoints?.max > 0 ? {
                value: heroPoints.value,
                max: heroPoints.max,
                pips: Array.from({ length: heroPoints.max }, (_, index) => ({ filled: index < heroPoints.value })),
            } : null,
            ac: actor.armorClass?.value ?? actor.system.attributes?.ac?.value ?? "—",
            attributes,
            speeds,
            shield,
            languages,
            perception: statisticView(perception, "perception", game.i18n.localize("PF2E.PerceptionLabel")),
            saves,
            initiative: initiative ? statisticView(initiative, actor.system.initiative?.statistic ?? "perception", initiative.label) : null,
            conditions: {
                dying: conditionView(actorAttributes.dying),
                wounded: conditionView(actorAttributes.wounded),
            },
            defenses: {
                immunities: iwrView(actorAttributes.immunities),
                weaknesses: iwrView(actorAttributes.weaknesses),
                resistances: iwrView(actorAttributes.resistances),
            },
            skills,
        };
    }
}
