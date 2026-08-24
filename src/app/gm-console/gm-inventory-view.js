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
    const carryState = carryType === "held" && [1, 2].includes(handsHeld) ? `held-${handsHeld}` : carryType;
    const carryKey = carryType === "held" && [1, 2].includes(handsHeld)
        ? `PF2E.CarryType.held${handsHeld}`
        : `PF2E.CarryType.${carryType}`;
    const carryLabel = game.i18n.has(carryKey) ? game.i18n.localize(carryKey) : carryType;
    const supportedCarryStates = ["held-1", "held-2", "worn", "stowed", "dropped"];
    const carryEditable = editable && supportedCarryStates.includes(carryState);
    const isInvestable = !item.isStowed && item.isIdentified && item.isInvested !== null;
    const carryOptions = carryEditable
        ? [
            { value: "held-1", label: game.i18n.localize("PF2E.CarryType.held1"), selected: carryState === "held-1" },
            { value: "held-2", label: game.i18n.localize("PF2E.CarryType.held2"), selected: carryState === "held-2" },
            { value: "worn", label: game.i18n.localize("PF2E.CarryType.worn"), selected: carryState === "worn" },
            { value: "stowed", label: game.i18n.localize("PF2E.CarryType.stowed"), selected: carryState === "stowed" },
            { value: "dropped", label: game.i18n.localize("PF2E.CarryType.dropped"), selected: carryState === "dropped" },
        ]
        : [{
            value: carryState,
            label: game.i18n.format("PF2E_V2_PLAYER_CONSOLE.GMConsole.UnsupportedCarryState", { state: carryLabel }),
            selected: true,
        }];
    return {
        id: item.id,
        img: item.img,
        name: item.name,
        quantity: item.quantity,
        bulk: item.bulk?.toString?.() ?? "—",
        carryLabel,
        carryEditable,
        isInvestable,
        invested: item.isInvested === true,
        editable,
        carryOptions,
    };
}
