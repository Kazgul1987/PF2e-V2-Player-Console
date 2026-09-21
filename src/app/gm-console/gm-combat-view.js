import { prepareGMInventory } from "./gm-inventory-view.js";
import { prepareGMSpellcasting } from "./gm-spellcasting-view.js";

/** Build combat panes from Foundry's already-sorted turn list. The Combat document remains authoritative. */
export async function prepareGMCombat(combat, paneViews) {
    if (!combat) return { combatants: [] };
    const currentId = combat.combatant?.id ?? null;
    const turns = combat.turns ?? [];
    return {
        started: combat.started,
        round: combat.round ?? 0,
        turn: combat.turn === null ? 0 : combat.turn + 1,
        turnCount: turns.length,
        combatants: await Promise.all(turns.flatMap((combatant) => {
            const actor = combatant.actor;
            return actor ? [prepareCombatant(combatant, actor, currentId, paneViews)] : [];
        })),
    };
}

async function prepareCombatant(combatant, actor, currentId, paneViews) {
    const id = combatant.id;
    const isNPC = actor.type === "npc";
    const hasSpellcasting = (actor.spellcasting?.contents?.length ?? 0) > 0;
    const allowedViews = isNPC ? ["overview", "actions", "inventory", "spellcasting"] : ["overview", "inventory", "spellcasting"];
    let activeView = paneViews.get(id) ?? "overview";
    if (!allowedViews.includes(activeView) || (activeView === "spellcasting" && !hasSpellcasting)) activeView = "overview";
    const hp = actor.system.attributes?.hp ?? { value: 0, max: 0 };
    const statistic = (slug) => actor.getStatistic?.(slug)?.mod ?? 0;
    const speed = actor.system.attributes?.speed;
    const isCurrentTurn = id === currentId;
    return {
        id,
        actorId: actor.id,
        tabGroup: `combat-${id}`,
        name: combatant.name ?? actor.name,
        img: combatant.img ?? actor.img,
        initiative: combatant.initiative,
        hasInitiative: Number.isFinite(combatant.initiative),
        defeated: combatant.isDefeated === true,
        hidden: combatant.hidden === true,
        isCurrentTurn,
        isNPC,
        isOverview: activeView === "overview",
        isActions: activeView === "actions",
        isInventory: activeView === "inventory",
        isSpellcasting: activeView === "spellcasting",
        hasSpellcasting,
        editable: actor.canUserModify?.(game.user, "update") === true,
        level: actor.system.details?.level?.value ?? actor.level ?? 0,
        hp: { value: hp.value ?? 0, max: hp.max ?? 0, pct: hp.max > 0 ? Math.clamp((hp.value / hp.max) * 100, 0, 100) : 0 },
        ac: actor.system.attributes?.ac?.value ?? actor.getStatistic?.("ac")?.dc?.value ?? 0,
        perception: statistic("perception"),
        fortitude: statistic("fortitude"),
        reflex: statistic("reflex"),
        will: statistic("will"),
        skills: isNPC ? prepareSkills(actor) : [],
        speed: speed?.total ?? speed?.value ?? 0,
        conditions: (actor.conditions?.active ?? []).map(prepareCondition),
        conditionMenu: isCurrentTurn ? prepareConditionMenu(actor) : null,
        actions: isNPC && activeView === "actions" ? await prepareActions(actor) : null,
        inventory: activeView === "inventory" ? prepareGMInventory(actor) : null,
        spellcasting: activeView === "spellcasting" ? await prepareGMSpellcasting(actor) : null,
    };
}

function prepareCondition(condition) {
    return {
        id: condition.id,
        name: condition.name,
        value: condition.value,
        valued: condition.system?.value?.isValued === true,
        locked: condition.isLocked === true || !!condition.grantedBy,
    };
}

function prepareConditionMenu(actor) {
    const manager = game.pf2e?.ConditionManager;
    const options = (manager?.conditionsSlugs ?? []).flatMap((slug) => {
        if (slug === "persistent-damage") return [];
        const condition = manager.getCondition(slug);
        return condition ? [{ slug, label: condition.name, valued: condition.system?.value?.isValued === true }] : [];
    }).sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
    if (options[0]) options[0].selected = true;
    return { options, selectedValued: options[0]?.valued === true, conditions: (actor.conditions?.active ?? []).map(prepareCondition) };
}

function prepareSkills(actor) {
    return Object.values(actor.skills ?? {})
        .filter((skill) => skill?.proficient === true && Number.isFinite(skill.mod))
        .map((skill) => ({ slug: skill.slug, label: skill.label, modifier: skill.mod }))
        .sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
}

function localizeTrait(trait) {
    const value = typeof trait === "string" ? trait : trait?.value;
    const configured = value ? CONFIG.PF2E.actionTraits?.[value] : null;
    const label = (typeof trait === "object" ? trait?.label : null) ?? configured ?? value ?? "";
    if (!label.startsWith("PF2E.") && !game.i18n.has(label)) return label;
    const localized = game.i18n.localize(label);
    return localized === label && label.startsWith("PF2E.") ? "" : localized;
}

export function prepareTraits(item, chatTraits) {
    const traits = Array.isArray(chatTraits) ? chatTraits : item.traitChatData?.() ?? item.system.traits?.value ?? [];
    return traits.map(localizeTrait).filter(Boolean).join(", ");
}

async function prepareActions(actor) {
    const strikes = (actor.system.actions ?? []).map((strike, actionIndex) => ({
        actionIndex, itemId: strike.item?.id ?? null, name: strike.label ?? strike.item?.name ?? "",
        img: strike.imageUrl ?? strike.item?.img ?? actor.img, traits: strike.item ? prepareTraits(strike.item) : "",
        variants: (strike.variants ?? []).map((variant, variantIndex) => ({ variantIndex, label: variant.label })),
    }));
    const grouped = { action: [], reaction: [], free: [], passive: [] };
    const items = actor.itemTypes?.action ?? actor.items.filter((item) => item.type === "action");
    for (const item of items) {
        const actionCost = item.actionCost ?? { type: item.system.actionType?.value, value: item.system.actions?.value };
        const actionType = item.actionCost?.type ?? item.system.actionType?.value ?? "passive";
        if (!Object.hasOwn(grouped, actionType)) continue;
        const chatData = await item.getChatData();
        grouped[actionType].push({
            id: item.id, name: item.name, img: item.img,
            actionCost: actionType === "reaction" ? "R" : actionType === "free" ? "F" : actionCost.value,
            traits: prepareTraits(item, chatData.traits), description: actionType === "passive" ? chatData.description?.value ?? "" : "",
            passive: actionType === "passive",
        });
    }
    const groups = Object.entries(grouped).map(([type, items]) => ({
        type, label: game.i18n.localize(type === "passive" ? "PF2E_V2_PLAYER_CONSOLE.GMConsole.Combat.Passive" : `PF2E_V2_PLAYER_CONSOLE.GMConsole.Combat.Groups.${type}`), items,
    }));
    return { strikes, groups };
}
