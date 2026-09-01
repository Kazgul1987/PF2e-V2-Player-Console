export const SAVE_AND_PERCEPTION_CHECKS = ["fortitude", "reflex", "will", "perception"];

const LABELS = {
    fortitude: "PF2E.SavesFortitude", reflex: "PF2E.SavesReflex",
    will: "PF2E.SavesWill", perception: "PF2E.PerceptionLabel",
};

export function prepareCheckButtons(localize) {
    const checks = SAVE_AND_PERCEPTION_CHECKS.map((slug) => ({ slug, label: localize(LABELS[slug]) }));
    const skills = Object.entries(CONFIG.PF2E.skills ?? {}).map(([slug, data]) => ({
        slug,
        label: localize(typeof data === "string" ? data : data.label),
    })).sort((a, b) => a.label.localeCompare(b.label));
    return { checks, skills };
}

export function buildCheckInline(type, { dc } = {}) {
    return `@Check[type:${type}${dc === undefined ? "" : `|dc:${dc}`}]`;
}

export async function postCheck(check, { dc } = {}) {
    const available = new Set([...SAVE_AND_PERCEPTION_CHECKS, ...Object.keys(CONFIG.PF2E.skills ?? {})]);
    const slug = check.trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(slug) || !available.has(slug)) return false;
    if (dc !== undefined && (!Number.isSafeInteger(dc) || dc < 0)) return false;
    await ChatMessage.create({ content: buildCheckInline(slug, { dc }) });
    return true;
}
