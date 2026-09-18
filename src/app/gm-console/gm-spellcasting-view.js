/** Build the isolated GM spellcasting view from PF2e's prepared sheet data. */
function localizePF2eLabel(value) {
    if (typeof value !== "string" || !value) return "";
    if (!value.startsWith("PF2E.")) return value;
    const localized = game.i18n.localize(value);
    return localized === value ? "" : localized;
}

function pf2eLabel(value, configured, fallback = "") {
    const nativeLabel = typeof value === "object" ? value?.label ?? value?.name : null;
    return localizePF2eLabel(nativeLabel)
        || localizePF2eLabel(configured)
        || localizePF2eLabel(typeof value === "string" ? value : null)
        || fallback;
}

export async function prepareGMSpellcasting(actor) {
    const spellcasting = actor.spellcasting;
    if (!spellcasting) return { entries: [], editable: false };

    const editable = actor.isOwner === true;
    const entries = await Promise.all(spellcasting.contents.map(async (entry) => {
        const data = await entry.getSheetData();
        const category = data.category ?? entry.category ?? "unknown";
        const castableCategory = ["prepared", "spontaneous", "innate", "focus"].includes(category);
        const groups = (data.groups ?? []).map((group) => {
            const spells = (group.active ?? []).flatMap((active, slotId) => {
                const spell = active?.spell;
                if (!spell) return [];
                const rank = active.castRank ?? group.maxRank ?? spell.rank;
                const uses = active.uses ?? null;
                return [{
                    id: spell.id,
                    name: spell.name,
                    img: spell.img,
                    rank,
                    slotId,
                    expended: active.expended === true,
                    uses,
                    usesLabel: uses ? `${uses.value} / ${uses.max}` : null,
                    canCast: editable && spell.isOwner === true && castableCategory && entry.canCast(spell) && !active.expended,
                }];
            });
            const uses = group.uses ?? null;
            return {
                id: group.id,
                label: game.i18n.localize(group.label),
                rank: group.number ?? (group.id === "cantrips" ? 0 : group.id),
                isCantrips: group.id === "cantrips",
                uses,
                usesLabel: group.id !== "cantrips" && uses
                    ? (uses.value === undefined ? String(uses.max) : `${uses.value} / ${uses.max}`)
                    : null,
                spells,
            };
        }).filter((group) => group.spells.length > 0 || (group.uses?.max ?? 0) > 0);

        const traditionValue = data.tradition ?? entry.tradition;
        const traditionSlug = typeof traditionValue === "string" ? traditionValue : traditionValue?.value;
        const categoryValue = data.categoryLabel ?? data.preparationType ?? category;
        return {
            id: data.id ?? entry.id,
            name: data.name ?? entry.name,
            tradition: traditionValue
                ? pf2eLabel(traditionValue, CONFIG.PF2E.magicTraditions?.[traditionSlug])
                : null,
            category,
            categoryLabel: pf2eLabel(categoryValue, CONFIG.PF2E.preparationType?.[category], entry.name),
            hasStatistic: Number.isFinite(data.statistic?.check?.mod) && Number.isFinite(data.statistic?.dc?.value),
            attack: data.statistic?.check?.mod,
            dc: data.statistic?.dc?.value,
            groups,
        };
    }));

    return { entries, editable };
}
