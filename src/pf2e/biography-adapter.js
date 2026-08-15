const RICH_TEXT_FIELDS = ["appearance", "backstory", "campaignNotes", "allies", "enemies", "organizations"];
const SECTIONS = ["appearance", "backstory", "personality", "campaign"];

export class BiographyAdapter {
    static async prepare(actor, editable = false) {
        const source = actor?._source?.system?.details ?? {};
        const biography = source.biography ?? {};
        const owner = actor?.isOwner === true;
        const enrichmentOptions = {
            async: true,
            rollData: actor?.getRollData?.() ?? {},
            secrets: owner,
            relativeTo: actor,
        };
        const enriched = {};
        await Promise.all(RICH_TEXT_FIELDS.map(async (field) => {
            enriched[field] = await TextEditor.enrichHTML(String(biography[field] ?? ""), enrichmentOptions);
        }));

        const visible = Object.fromEntries(SECTIONS.map((section) => [section, owner || biography.visibility?.[section] === true]));
        return {
            editable: editable && actor?.canUserModify?.(game.user, "update") === true,
            owner,
            visible,
            visibility: Object.fromEntries(SECTIONS.map((section) => [section, biography.visibility?.[section] === true])),
            appearance: visible.appearance ? {
                raw: String(biography.appearance ?? ""), enriched: enriched.appearance,
                height: String(source.height?.value ?? ""), weight: String(source.weight?.value ?? ""),
            } : null,
            backstory: visible.backstory ? {
                raw: String(biography.backstory ?? ""), enriched: enriched.backstory,
                birthPlace: String(biography.birthPlace ?? ""),
            } : null,
            personality: visible.personality ? {
                attitude: String(biography.attitude ?? ""), beliefs: String(biography.beliefs ?? ""),
                edicts: Array.isArray(biography.edicts) ? [...biography.edicts] : [],
                anathema: Array.isArray(biography.anathema) ? [...biography.anathema] : [],
                likes: String(biography.likes ?? ""), dislikes: String(biography.dislikes ?? ""),
                catchphrases: String(biography.catchphrases ?? ""),
            } : null,
            campaign: visible.campaign ? Object.fromEntries(RICH_TEXT_FIELDS.slice(2).map((field) => [field, {
                raw: String(biography[field] ?? ""), enriched: enriched[field],
            }])) : null,
        };
    }
}
