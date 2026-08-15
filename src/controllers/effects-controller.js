import { renderItemSummary } from "../pf2e/item-summary.js";

export class EffectsController {
    static #editable(actor) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }

    static item(actor, id) { return actor?.conditions?.get?.(id) ?? actor?.items?.get?.(id) ?? null; }
    static open(actor, id) { return this.item(actor, id)?.sheet?.render(true); }
    static chat(actor, id, event) { return this.item(actor, id)?.toMessage?.(event); }
    static async summary(actor, id) {
        return renderItemSummary(this.item(actor, id));
    }

    static async increaseCondition(actor, id) {
        if (!this.#editable(actor)) return;
        const condition = actor.conditions?.get?.(id);
        if (!condition?.isOfType?.("condition") || condition.readonly || condition.isLocked || !condition.system?.value?.isValued) return;
        return actor.increaseCondition(condition);
    }

    static async decreaseCondition(actor, id) {
        if (!this.#editable(actor)) return;
        const condition = actor.conditions?.get?.(id);
        if (!condition?.isOfType?.("condition") || condition.readonly || condition.isLocked || !condition.system?.value?.isValued) return;
        return actor.decreaseCondition(condition);
    }

    static async removeCondition(actor, id) {
        if (!this.#editable(actor)) return;
        const condition = actor.conditions?.get?.(id);
        if (!condition?.isOfType?.("condition") || condition.readonly || condition.isLocked) return;
        return actor.decreaseCondition(condition, { forceRemove: true });
    }

    static async removeEffect(actor, id, event) {
        if (!this.#editable(actor)) return;
        const effect = actor.items?.get?.(id);
        if (!effect?.isOfType?.("effect") || effect.grantedBy) return;
        return event?.ctrlKey || event?.shiftKey ? effect.delete() : effect.deleteDialog();
    }

    static async changeEffect(actor, id, direction) {
        if (!this.#editable(actor)) return;
        const effect = actor.items?.get?.(id);
        if (!effect?.isOfType?.("effect") || effect.grantedBy || effect.isExpired || effect.system?.badge?.type !== "counter") return;
        return direction > 0 ? effect.increase() : effect.decrease();
    }

    static async recoverPersistentDamage(actor, id) {
        if (!this.#editable(actor)) return;
        const condition = actor.conditions?.get?.(id);
        if (!condition?.isOfType?.("condition") || condition.slug !== "persistent-damage" || !condition.system?.persistent || condition.readonly || condition.isLocked) return;
        return condition.rollRecovery();
    }

    static async changeAffliction(actor, id, direction) {
        if (!this.#editable(actor)) return;
        const affliction = actor.items?.get?.(id);
        if (!affliction?.isOfType?.("affliction") || affliction.isLocked) return;
        return direction > 0 ? affliction.increase() : affliction.decrease();
    }

    static dragStart(actor, event, target) {
        const item = actor.items?.get?.(target.dataset.itemId);
        if (item?.isOfType?.("effect", "condition", "affliction") && !item.grantedBy && event.dataTransfer) {
            event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
        }
    }

    static async drop(actor, event) {
        event.preventDefault();
        if (!this.#editable(actor)) return [];
        const data = TextEditor.getDragEventData(event);
        if (data?.type !== "Item") return [];
        const item = await Item.implementation.fromDropData(data).catch(() => null);
        if (!item?.isOfType?.("effect", "condition", "affliction") || item.parent?.uuid === actor.uuid || item.grantedBy) return [];
        if (item.isOfType("condition")) {
            const value = typeof data.value === "number" && item.system?.value?.isValued ? data.value : undefined;
            const created = await actor.increaseCondition(item.slug, { value });
            return created ? [created] : [];
        }
        const itemSource = item.toObject();
        const { level, value, context } = data;
        if (typeof level === "number" && level >= 0) itemSource.system.level.value = Math.floor(level);
        if (itemSource.type === "effect" && itemSource.system.badge?.type === "counter" && typeof value === "number") {
            itemSource.system.badge.value = value;
        }
        itemSource.system.context = context ?? null;
        const originItem = fromUuidSync(context?.origin?.item ?? "");
        if (itemSource.system.traits?.value.length === 0 && originItem?.isOfType?.("spell")) {
            const effectTraits = originItem.system.traits.value.filter((trait) => trait in CONFIG.PF2E.effectTraits);
            itemSource.system.traits.value.push(...effectTraits);
        }
        // Match PF2e's actor-sheet creation boundary: cloning clears the source ID.
        const source = new Item.implementation(itemSource).clone().toObject();
        return actor.createEmbeddedDocuments("Item", [source]);
    }
}
