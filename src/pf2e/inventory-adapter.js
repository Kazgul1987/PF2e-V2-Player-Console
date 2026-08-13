import { LOG_PREFIX } from "../constants.js";

const SECTIONS = [
    ["PF2E.Actor.Inventory.Section.WeaponsAndShields", ["weapon", "shield"]],
    ["TYPES.Item.armor", ["armor"]],
    ["TYPES.Item.equipment", ["equipment"]],
    ["PF2E.Item.Consumable.Plural", ["consumable"]],
    ["TYPES.Item.ammo", ["ammo"]],
    ["TYPES.Item.treasure", ["treasure"]],
    ["PF2E.Item.Container.Plural", ["backpack"]],
];

/** A deliberately thin view over PF2e's prepared physical Item and ActorInventory APIs. */
export class InventoryAdapter {
    static prepare(actor) {
        if (!actor?.inventory) throw new Error(`${LOG_PREFIX} PF2e ActorInventory is unavailable`);
        const roots = [...actor.inventory.contents]
            .filter((item) => !item.isInContainer)
            .sort((a, b) => (a.sort || 0) - (b.sort || 0));
        const sections = SECTIONS.map(([label, types]) => ({
            label: game.i18n.localize(label),
            types: types.join(","),
            createType: types.find((type) => type !== "shield"),
            items: roots.filter((item) => types.includes(item.type)).map((item) => this.#item(item, actor)),
        }));
        const currency = actor.inventory.currency;
        return {
            sections,
            bulk: String(actor.inventory.bulk ?? "—"),
            invested: actor.inventory.invested ?? null,
            coins: ["pp", "gp", "sp", "cp"].map((denomination) => ({
                denomination,
                value: Number(currency?.[denomination] ?? 0),
                label: game.i18n.localize(`PF2E.Currency.${denomination.toUpperCase()}`),
            })),
        };
    }

    static #item(item, actor) {
        const isContainer = item.isOfType?.("backpack") === true;
        const usesData = item.isOfType?.("consumable", "ammo") ? item.system.uses : null;
        const uses = usesData?.max > 0 ? { value: usesData.value, max: usesData.max } : null;
        const hp = item.isOfType?.("shield") ? item.system.hp : null;
        return {
            id: item.id, uuid: item.uuid, type: item.type, name: item.name, img: item.img,
            quantity: item.quantity, bulk: String(item.bulk ?? "—"), carryType: item.carryType,
            handsHeld: item.handsHeld, isEquipped: item.isEquipped, isInvested: item.isInvested,
            isInvestable: !item.isStowed && item.isIdentified && item.isInvested !== null,
            identified: item.isIdentified, containerId: item.container?.id ?? null,
            containerName: item.container?.name ?? null, isContainer, collapsed: isContainer && item.isCollapsed,
            canEditQuantity: !(isContainer && item.contents.size > 0) && !(item.isOfType?.("treasure") && item.system.category === "credstick"),
            uses, canConsume: item.isOfType?.("consumable") === true && (uses?.value ?? 0) > 0,
            shield: hp ? { value: hp.value, max: hp.max, hardness: item.hardness, broken: item.isBroken, destroyed: item.isDestroyed } : null,
            children: isContainer ? [...item.contents].sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((child) => this.#item(child, actor)) : [],
        };
    }
}
