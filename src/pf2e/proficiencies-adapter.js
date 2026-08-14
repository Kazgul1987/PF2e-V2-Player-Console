import { LOG_PREFIX } from "../constants.js";

const RANKS = Object.freeze([0, 1, 2, 3, 4]);
const SAVE_SLUGS = Object.freeze(["fortitude", "reflex", "will"]);

function localize(label, fallback) {
    const value = typeof label === "string" && label ? label : fallback;
    return game.i18n.localize(value);
}

function modifier(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? `${numeric >= 0 ? "+" : ""}${numeric}` : "—";
}

function rankView(rank) {
    const value = RANKS.includes(Number(rank)) ? Number(rank) : 0;
    return {
        value,
        label: game.i18n.localize(`PF2E.ProficiencyLevel${value}`),
        options: RANKS.map((option) => ({
            value: option,
            label: game.i18n.localize(`PF2E.ProficiencyLevel${option}`),
            selected: option === value,
        })),
    };
}

function statisticRow(statistic, { slug, label, editable = false, category = null, itemId = null } = {}) {
    const rank = rankView(statistic?.rank);
    const rawModifier = statistic?.mod ?? statistic?.value;
    const hasModifier = Number.isFinite(rawModifier);
    return {
        slug,
        itemId,
        label: localize(statistic?.label, label ?? slug),
        modifier: hasModifier ? modifier(rawModifier) : null,
        hasModifier,
        dc: Number.isFinite(Number(statistic?.dc?.value ?? statistic?.dc)) ? Number(statistic?.dc?.value ?? statistic.dc) : null,
        rank,
        editable,
        category,
    };
}

function martialLabel(section, slug, proficiency) {
    if (proficiency?.label) return localize(proficiency.label, slug);
    if (section === "attacks") {
        const group = /^weapon-group-([-\w]+)$/.exec(slug)?.[1];
        if (group) return localize(CONFIG.PF2E.weaponGroups?.[group], group);
        const base = /^weapon-base-([-\w]+)$/.exec(slug)?.[1];
        if (base) return localize(CONFIG.PF2E.baseWeaponTypes?.[base] ?? CONFIG.PF2E.baseShieldTypes?.[base], base);
    }
    const config = section === "attacks" ? CONFIG.PF2E.weaponCategories : CONFIG.PF2E.armorCategories;
    return localize(config?.[slug], slug);
}

/** Normalize prepared PF2e statistics and proficiency records without deriving rules. */
export class ProficienciesAdapter {
    static prepare(actor, editable = false) {
        if (actor?.type !== "character" || !actor.system) throw new Error(`${LOG_PREFIX} A PF2e character Actor is required`);
        const canEdit = editable && actor.canUserModify?.(game.user, "update") === true;
        const getStatistic = (slug) => actor.getStatistic?.(slug);

        const perceptionStatistic = actor.perception ?? getStatistic("perception");
        const perception = statisticRow(perceptionStatistic, {
            slug: "perception",
            label: "PF2E.PerceptionLabel",
        });
        const saves = SAVE_SLUGS.map((slug) => statisticRow(actor.saves?.[slug] ?? getStatistic(slug), {
            slug,
            label: CONFIG.PF2E.saves?.[slug] ?? slug,
        }));

        const skills = [];
        const lores = [];
        for (const [slug, statistic] of Object.entries(actor.skills ?? {})) {
            const trace = actor.system.skills?.[slug] ?? {};
            const itemId = trace.itemId ?? null;
            const lore = Boolean(statistic?.lore || trace.lore || itemId);
            const row = statisticRow(statistic ?? getStatistic(slug), {
                slug,
                itemId,
                label: CONFIG.PF2E.skills?.[slug]?.label ?? slug,
                editable: canEdit,
                category: lore ? "lore" : "skill",
            });
            (lore ? lores : skills).push(row);
        }
        const byLabel = (a, b) => a.label.localeCompare(b.label, game.i18n.lang);
        skills.sort(byLabel);
        lores.sort(byLabel);

        const proficiencies = actor.system.proficiencies ?? {};
        const attacks = Object.entries(proficiencies.attacks ?? {}).map(([slug, proficiency]) => ({
            ...statisticRow(proficiency, {
                slug,
                label: martialLabel("attacks", slug, proficiency),
                editable: canEdit && proficiency?.custom === true && actor._source?.system?.proficiencies?.attacks?.[slug]?.custom === true,
                category: "attack",
            }),
            custom: proficiency?.custom === true,
            visible: proficiency?.visible !== false,
            sameAs: proficiency?.sameAs ? localize(CONFIG.PF2E.weaponCategories?.[proficiency.sameAs], proficiency.sameAs) : null,
        }));
        const standardWeaponSlugs = new Set(Object.keys(CONFIG.PF2E.weaponCategories ?? {}));
        const weapons = attacks.filter((entry) => standardWeaponSlugs.has(entry.slug)).sort(byLabel);
        const martial = attacks.filter((entry) => !standardWeaponSlugs.has(entry.slug) && entry.visible && (entry.rank.value > 0 || entry.custom)).sort(byLabel);
        const armor = Object.entries(proficiencies.defenses ?? {})
            .filter(([, proficiency]) => proficiency?.visible !== false)
            .map(([slug, proficiency]) => statisticRow(proficiency, { slug, label: martialLabel("defenses", slug, proficiency) }))
            .sort(byLabel);

        const classDCs = Object.entries(actor.classDCs ?? {}).map(([slug, statistic]) => {
            const prepared = proficiencies.classDCs?.[slug] ?? {};
            return {
                ...statisticRow(statistic, { slug, label: prepared.label ?? statistic?.label ?? slug }),
                dc: Number.isFinite(Number(prepared.value ?? statistic?.dc?.value)) ? Number(prepared.value ?? statistic.dc.value) : null,
                primary: Boolean(prepared.primary || actor.classDC === statistic),
            };
        }).sort((a, b) => Number(b.primary) - Number(a.primary) || byLabel(a, b));

        const spellStatistic = actor.spellcasting?.base ?? null;
        const spellcasting = spellStatistic && Number(spellStatistic.rank) > 0
            ? statisticRow(spellStatistic, { slug: "spellcasting", label: spellStatistic.label ?? "PF2E.Item.Spell.Plural" })
            : null;

        return { perception, saves, skills, lores, classDCs, armor, weapons, martial, spellcasting };
    }
}
