export const STANDARD_DAMAGE_TYPES = [
    "bludgeoning", "piercing", "slashing", "bleed", "acid", "cold", "electricity", "fire",
    "force", "sonic", "mental", "poison", "spirit", "vitality", "void", "untyped",
];
export const DAMAGE_TYPE_ICONS = {
    bleed: "droplet", acid: "vial", bludgeoning: "hammer", cold: "snowflake", electricity: "bolt",
    fire: "fire", force: "sparkles", mental: "brain", piercing: "bow-arrow", poison: "spider",
    slashing: "axe", sonic: "waveform-lines", spirit: "ghost", vitality: "sun", void: "skull",
};
const ALIASES = {
    positive: "vitality", negative: "void", pos: "vitality", neg: "void", aci: "acid",
    blu: "bludgeoning", blud: "bludgeoning", col: "cold", ele: "electricity", elec: "electricity",
    fir: "fire", men: "mental", pie: "piercing", poi: "poison", sla: "slashing", son: "sonic",
    vit: "vitality", voi: "void",
};

export function getAvailableDamageTypes() {
    const configured = Object.keys(CONFIG.PF2E.damageTypes ?? {});
    return new Set(configured.length ? configured : STANDARD_DAMAGE_TYPES);
}

export function resolveDamageType(value) {
    const token = value.trim().toLowerCase();
    const normalized = ALIASES[token] ?? token;
    return getAvailableDamageTypes().has(normalized) ? normalized : null;
}

export function buildDamageFormula(formula, damageType) {
    const normalized = formula.replace(/\s+/g, "");
    const type = resolveDamageType(damageType);
    return normalized && type && /^[0-9dD+\-*/()]+$/.test(normalized) ? `(${normalized})[${type}]` : null;
}

export async function rollDamage(formula, damageType) {
    const damageFormula = buildDamageFormula(formula, damageType);
    if (!damageFormula || !ui.chat?.processMessage) return false;
    await ui.chat.processMessage(`/r ${damageFormula}`, {});
    return true;
}
