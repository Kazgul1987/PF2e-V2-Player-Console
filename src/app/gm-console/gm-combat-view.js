import { prepareGMInventory } from "./gm-inventory-view.js";
import { prepareGMSpellcasting } from "./gm-spellcasting-view.js";

/** Build combat panes directly from PF2e's prepared NPC and Foundry combat data. */
export async function prepareGMCombat(combat, paneViews) {
    if (!combat) return { combatants: [] };
    const currentId = combat.combatant?.id ?? null;
    const combatants = await Promise.all((combat.turns ?? []).flatMap((combatant) => {
        const actor = combatant.actor;
        return actor?.type === "npc" ? [prepareNPC(combatant, actor, currentId, paneViews)] : [];
    }));
    return { combatants };
}

async function prepareNPC(combatant, actor, currentId, paneViews) {
    const id = combatant.id;
    const hasSpellcasting = (actor.spellcasting?.contents?.length ?? 0) > 0;
    let activeView = paneViews.get(id) ?? "overview";
    if (activeView === "spellcasting" && !hasSpellcasting) activeView = "overview";
    const hp = actor.system.attributes?.hp ?? { value: 0, max: 0 };
    const statistic = (slug) => actor.getStatistic?.(slug)?.mod ?? 0;
    const speed = actor.system.attributes?.speed;
    return {
        id,
        actorId: actor.id,
        tabGroup: `combat-npc-${id}`,
        name: combatant.name ?? actor.name,
        img: combatant.img ?? actor.img,
        initiative: combatant.initiative,
        hasInitiative: Number.isFinite(combatant.initiative),
        defeated: combatant.isDefeated === true,
        isCurrentTurn: id === currentId,
        isOverview: activeView === "overview",
        isActions: activeView === "actions",
        isInventory: activeView === "inventory",
        isSpellcasting: activeView === "spellcasting",
        hasSpellcasting,
        level: actor.system.details?.level?.value ?? actor.level ?? 0,
        hp: { value: hp.value, max: hp.max, pct: hp.max > 0 ? Math.clamp((hp.value / hp.max) * 100, 0, 100) : 0 },
        ac: actor.system.attributes?.ac?.value ?? actor.getStatistic?.("ac")?.dc?.value ?? 0,
        perception: statistic("perception"),
        fortitude: statistic("fortitude"),
        reflex: statistic("reflex"),
        will: statistic("will"),
        speed: speed?.total ?? speed?.value ?? 0,
        conditions: (actor.conditions?.active ?? []).map((condition) => ({ id: condition.id, name: condition.name })),
        actions: activeView === "actions" ? prepareActions(actor) : null,
        inventory: activeView === "inventory" ? prepareGMInventory(actor) : null,
        spellcasting: activeView === "spellcasting" ? await prepareGMSpellcasting(actor) : null,
    };
}

function prepareActions(actor) {
    const strikes = (actor.system.actions ?? []).map((strike, actionIndex) => ({
        actionIndex,
        itemId: strike.item?.id ?? null,
        name: strike.label ?? strike.item?.name ?? "",
        img: strike.imageUrl ?? strike.item?.img ?? actor.img,
        variants: (strike.variants ?? []).map((variant, variantIndex) => ({
            variantIndex,
            label: variant.label,
        })),
    }));
    const grouped = { action: [], reaction: [], free: [] };
    for (const item of actor.itemTypes?.action ?? actor.items.filter((item) => item.type === "action")) {
        const actionCost = item.actionCost ?? {
            type: item.system.actionType?.value,
            value: item.system.actions?.value,
        };
        const actionType = actionCost.type;
        if (!Object.hasOwn(grouped, actionType)) continue;
        grouped[actionType].push({
            id: item.id,
            name: item.name,
            img: item.img,
            actionCost: actionType === "reaction" ? "R" : actionType === "free" ? "F" : actionCost.value,
            traits: [...(item.system.traits?.value ?? [])].map((trait) => CONFIG.PF2E.actionTraits?.[trait] ?? trait).join(", "),
        });
    }
    const groups = Object.entries(grouped).map(([type, items]) => ({
        type,
        label: game.i18n.localize(`PF2E_V2_PLAYER_CONSOLE.GMConsole.Combat.Groups.${type}`),
        items,
    }));
    return { strikes, groups };
}
