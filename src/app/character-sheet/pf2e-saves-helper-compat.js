const MODULE_ID = "pf2e-saves-helper";
const SOCKET_NAME = `module.${MODULE_ID}`;
const warnedMessages = new Set();

function convertedUuid(uuid) { return uuid.replaceAll(".", "-"); }

function warnOnce(message, reason) {
    if (warnedMessages.has(message.id)) return;
    warnedMessages.add(message.id);
    console.warn("PF2e V2 Player Console | PF2e Saves Helper: Unsupported prompt", { message: message.id, reason });
}

/** Compatibility adapter for the current PF2e Saves Helper chat prompt flag/roll contract. */
export class SavesHelperCompat {
    static get active() { return game.modules.get(MODULE_ID)?.active === true; }
    static flags(message) { return this.active ? message?.flags?.[MODULE_ID] : null; }

    static matchesActor(message, actor) {
        const flags = this.flags(message);
        if (!Array.isArray(flags?.targets)) return false;
        return flags.targets.some((uuid) => {
            const token = fromUuidSync(uuid);
            return token?.actor === actor || token?.actor?.uuid === actor.uuid;
        });
    }

    static async targetForActor(message, actor) {
        const flags = this.flags(message);
        if (!flags) return null;
        if (!Array.isArray(flags.targets) || !flags.saveInfo || !flags.sourceMessage) {
            warnOnce(message, "missing targets, saveInfo, or sourceMessage flags");
            return null;
        }
        for (const uuid of flags.targets) {
            const token = await fromUuid(uuid);
            if (token?.actor === actor || token?.actor?.uuid === actor.uuid) return token;
        }
        return null;
    }

    static resultFor(flags, token) { return flags.results?.[convertedUuid(token.uuid)] ?? null; }

    /** Mirror PF2e's processing of Saves Helper's owner-visible DC element for the current user. */
    static canSeeDc(message) {
        if (game.pf2e.settings.metagame.dcs) return true;
        const document = message.actor ?? message;
        return document.hasPlayerOwner === true || game.user.isGM;
    }

    static async roll(event, message, actor) {
        event.preventDefault();
        event.stopPropagation();
        const flags = this.flags(message);
        const token = await this.targetForActor(message, actor);
        if (!flags || !token || this.resultFor(flags, token)) return;
        const { saveInfo, origin } = flags;
        const statistic = token.actor?.getStatistic(saveInfo.saveType);
        if (!statistic || !origin?.uuid || !token.isOwner) throw new Error("Save statistic, origin, or target ownership is unavailable");

        let result = null;
        await statistic.check.roll({
            item: await fromUuid(origin.uuid),
            origin: origin.actor ? await fromUuid(origin.actor) : undefined,
            dc: saveInfo.dc,
            token,
            skipDialog: !event.shiftKey,
            identifier: message.id,
            rollMode: token.hidden ? "gmroll" : "roll",
            messageMode: token.hidden ? "gm" : "public",
            extraRollOptions: saveInfo.extraRollOptions,
            createMessage: !game.settings.get(MODULE_ID, "hideSavingThrows"),
            callback: async (roll, _outcome, rollMessage) => {
                if (roll?.degreeOfSuccess == null || roll.total === undefined) return;
                if (game.modules.get("dice-so-nice")?.active && rollMessage?._dice3danimating) {
                    await game.dice3d?.waitFor3DAnimationByMessageID(rollMessage.id);
                }
                const rolledToken = rollMessage?.flags?.[game.system.id]?.context?.target?.token;
                if (rolledToken !== token.uuid || !game.messages.get(message.id)?.flags?.[MODULE_ID]) return;
                result = { degreeOfSuccess: roll.degreeOfSuccess, rollValue: roll.total };
            },
        });
        if (result) await this.#updateResult(message, token.uuid, result);
    }

    static async #updateResult(message, tokenUuid, result) {
        if (message.isOwner) {
            await message.update({ [`flags.${MODULE_ID}.results.${convertedUuid(tokenUuid)}`]: result });
        } else {
            game.socket.emit(SOCKET_NAME, {
                type: "save-rolled", message: message.id, token: tokenUuid,
                degreeOfSuccess: result.degreeOfSuccess, rollValue: result.rollValue,
            });
        }
    }
}
