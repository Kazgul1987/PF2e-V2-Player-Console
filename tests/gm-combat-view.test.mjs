import test from "node:test";
import assert from "node:assert/strict";

Math.clamp ??= (value, min, max) => Math.min(Math.max(value, min), max);
globalThis.CONFIG = { PF2E: { actionTraits: {} } };
globalThis.game = {
    user: { id: "gm" },
    i18n: { lang: "en", has: () => false, localize: (key) => key },
    pf2e: {
        ConditionManager: {
            conditionsSlugs: ["prone", "frightened", "persistent-damage"],
            getCondition: (slug) => ({
                name: slug === "prone" ? "Prone" : "Frightened",
                system: { value: { isValued: slug === "frightened" } },
            }),
        },
    },
};

const { prepareGMCombat } = await import("../src/app/gm-console/gm-combat-view.js");

function actor(id, type) {
    return {
        id, type, name: id, img: `${id}.webp`, level: 1,
        system: { attributes: { hp: { value: 10, max: 10 }, ac: { value: 18 }, speed: { value: 25 } }, details: { level: { value: 1 } } },
        conditions: { active: [] }, spellcasting: { contents: [] }, skills: {}, items: [], itemTypes: { action: [] },
        getStatistic: () => ({ mod: 5 }), canUserModify: () => true,
    };
}

function condition(slug, name, value, valued) {
    return {
        id: `${slug}-${value ?? "unvalued"}`, slug, name, value,
        system: { value: { isValued: valued } },
        isLocked: false,
    };
}

function combatant(id, initiative, type) {
    const combatActor = actor(`actor-${id}`, type);
    return { id, initiative, actor: combatActor, name: id, img: combatActor.img, hidden: false, isDefeated: false };
}

test("keeps Foundry's mixed turn order and combatant identity", async () => {
    const turns = [combatant("kyra", 28, "character"), combatant("king", 24, "npc"), combatant("merisiel", 19, "character"), combatant("goblin", 12, "npc")];
    const result = await prepareGMCombat({ turns, combatant: turns[1], started: true, round: 3, turn: 1 }, new Map());
    assert.deepEqual(result.combatants.map((entry) => entry.id), ["kyra", "king", "merisiel", "goblin"]);
    assert.equal(result.combatants[1].isCurrentTurn, true);
    assert.equal(result.combatants[0].isNPC, false);
    assert.equal(result.turn, 2);
});

test("shows dynamic PF2e conditions only for the active combatant", async () => {
    const turns = [combatant("pc", 20, "character"), combatant("npc", 10, "npc")];
    const result = await prepareGMCombat({ turns, combatant: turns[0], started: true, round: 1, turn: 0 }, new Map());
    assert.deepEqual(result.combatants[0].conditionMenu.options.map((option) => option.slug), ["frightened", "prone"]);
    assert.equal(result.combatants[1].conditionMenu, null);
    assert.ok(!result.combatants[0].conditionMenu.options.some((option) => option.slug === "persistent-damage"));
});

test("uses PF2e base labels and keeps valued condition values separate", async () => {
    const active = combatant("pc", 20, "character");
    active.actor.conditions.active = [
        condition("frightened", "Frightened 3", 3, true),
        condition("prone", "Prone", null, false),
    ];
    const result = await prepareGMCombat({ turns: [active], combatant: active, started: true, round: 1, turn: 0 }, new Map());

    assert.deepEqual(result.combatants[0].conditions.map(({ label, value, valued }) => ({ label, value, valued })), [
        { label: "Frightened", value: 3, valued: true },
        { label: "Prone", value: null, valued: false },
    ]);
    assert.deepEqual(result.combatants[0].conditionMenu.conditions.map(({ label, value }) => ({ label, value })), [
        { label: "Frightened", value: 3 },
        { label: "Prone", value: null },
    ]);
});
