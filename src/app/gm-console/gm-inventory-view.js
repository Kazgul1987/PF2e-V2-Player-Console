/** Build the isolated GM inventory view from PF2e's prepared inventory documents. */
export function prepareGMInventory(actor) {
    const sectionDefinitions = [
        ["PF2E.Actor.Inventory.Section.WeaponsAndShields", ["weapon", "shield"]],
        ["TYPES.Item.armor", ["armor"]],
        ["TYPES.Item.equipment", ["equipment"]],
        ["PF2E.Item.Consumable.Plural", ["consumable"]],
        ["TYPES.Item.ammo", ["ammo"]],
        ["TYPES.Item.treasure", ["treasure"]],
        ["PF2E.Item.Container.Plural", ["backpack"]],
    ];
    const items = actor.inventory?.contents ?? [];
    const editable = actor.isOwner === true;
    const sections = sectionDefinitions.map(([label, types]) => ({
        label: game.i18n.localize(label),
        items: items.filter((item) => types.includes(item.type)).map((item) => prepareItem(item, editable)),
    })).filter((section) => section.items.length > 0);
    const currency = actor.inventory?.currency ?? {};

    return {
        editable,
        sections,
        coins: ["pp", "gp", "sp", "cp"].map((denomination) => ({
            denomination: denomination.toUpperCase(),
            value: currency[denomination] ?? 0,
        })),
    };
}

function prepareItem(item, editable) {
    const carryType = item.carryType ?? item.system.equipped?.carryType ?? "worn";
    const handsHeld = item.handsHeld ?? item.system.equipped?.handsHeld ?? 0;
    const carryKey = carryType === "held" ? `PF2E.CarryType.held${handsHeld || 1}` : `PF2E.CarryType.${carryType}`;
    const isInvestable = item.isInvested !== null;
    return {
        id: item.id,
        img: item.img,
        name: item.name,
        quantity: item.quantity,
        bulk: item.bulk?.toString?.() ?? "—",
        carryLabel: game.i18n.localize(carryKey),
        isInvestable,
        invested: item.isInvested === true,
        editable,
        carryOptions: [
            { value: "held", label: game.i18n.localize("PF2E.CarryType.held1"), selected: carryType === "held" },
            { value: "worn", label: game.i18n.localize("PF2E.CarryType.worn"), selected: carryType === "worn" },
            { value: "stowed", label: game.i18n.localize("PF2E.CarryType.stowed"), selected: carryType === "stowed" },
            { value: "dropped", label: game.i18n.localize("PF2E.CarryType.dropped"), selected: carryType === "dropped" },
        ],
    };
}
