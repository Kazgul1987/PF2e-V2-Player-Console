import { buildCheckInline } from "./checks.js";
import { getDCByLevel } from "./check-dc.js";
import { resolveDamageType, rollDamage } from "./damage.js";

const CHECK_ALIASES = {
    acrobatics: "acrobatics", acro: "acrobatics", arcana: "arcana", arc: "arcana",
    athletics: "athletics", ath: "athletics", crafting: "crafting", cra: "crafting",
    deception: "deception", dec: "deception", diplomacy: "diplomacy", dip: "diplomacy",
    intimidation: "intimidation", int: "intimidation", medicine: "medicine", med: "medicine",
    nature: "nature", nat: "nature", occultism: "occultism", occ: "occultism",
    perception: "perception", perc: "perception", performance: "performance", perf: "performance",
    religion: "religion", rel: "religion", society: "society", soc: "society", stealth: "stealth",
    ste: "stealth", survival: "survival", sur: "survival", thievery: "thievery", thi: "thievery",
    fortitude: "fortitude", fort: "fortitude", reflex: "reflex", ref: "reflex", will: "will", wil: "will",
};
const ACTION_ALIASES = {
    trip: "trip", disarm: "disarm", shove: "shove", push: "shove", grapple: "grapple", grab: "grapple",
    escape: "escape", demoralize: "demoralize", demoralise: "demoralize", feint: "feint", aid: "aid",
    seek: "seek", tripup: "trip", tumble: "tumbleThrough", tumblethrough: "tumbleThrough",
    "tumble-through": "tumbleThrough", tumblethru: "tumbleThrough", recallknowledge: "recallKnowledge",
    "recall-knowledge": "recallKnowledge", recall: "recallKnowledge",
};

export async function parseQuickRollInput(input, event) {
    const value = input.trim();
    if (!value) return false;
    if (value.startsWith("/")) return applyCondition(value.slice(1));
    if (/^[0-9]/.test(value)) return parseDamage(value);
    const action = ACTION_ALIASES[value.toLowerCase().replace(/\s+/g, "")];
    if (action) return invokeAction(action, event);
    return parseCheck(value);
}

async function parseDamage(input) {
    const match = input.match(/^([0-9dD+\-*/()\s]+)\s*([a-zA-Z]+)$/);
    const type = match && resolveDamageType(match[2]);
    return match && type ? rollDamage(match[1], type) : false;
}

async function parseCheck(input) {
    const match = input.match(/^([a-zA-Z]+)\s+(?:(dc|lvl|level)\s*[:=]?\s*)?(\d+)$/i);
    const slug = match && CHECK_ALIASES[match[1].toLowerCase()];
    if (!match || !slug) return false;
    const number = Number(match[3]);
    const dc = match[2]?.toLowerCase() === "dc" ? number : getDCByLevel(number);
    if (dc === undefined) return false;
    await ChatMessage.create({ content: buildCheckInline(slug, { dc }) });
    return true;
}

async function invokeAction(slug, event) {
    const action = game.pf2e.actions?.get?.(slug) ?? game.pf2e.actions?.[slug];
    if (typeof action?.use === "function") await action.use({ event });
    else if (typeof action === "function") await action({ event });
    else return false;
    return true;
}

async function applyCondition(input) {
    const match = input.trim().match(/^([a-zA-Z-]+)(?:\s+(\d+))?$/);
    const actor = canvas.tokens?.controlled?.[0]?.actor;
    if (!match || !actor) return false;
    const normalized = match[1].toLowerCase().replace(/[^a-z0-9]/g, "");
    const matches = Object.keys(CONFIG.PF2E.conditionTypes ?? {}).filter((slug) => slug.replace(/[^a-z0-9]/g, "") === normalized || (normalized.length >= 3 && slug.replace(/[^a-z0-9]/g, "").startsWith(normalized)));
    if (matches.length !== 1) return false;
    const value = match[2] ? Number(match[2]) : undefined;
    if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0)) return false;
    const options = value === undefined ? undefined : { value };
    if (actor.increaseCondition) await actor.increaseCondition(matches[0], options);
    else if (actor.toggleCondition) await actor.toggleCondition(matches[0], { active: true, ...options });
    else if (actor.addCondition) await actor.addCondition(matches[0], options);
    else return false;
    return true;
}
