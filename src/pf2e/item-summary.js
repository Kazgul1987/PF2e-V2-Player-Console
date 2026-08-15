/** Render an Item description through PF2e's public runtime pipeline. */
export async function renderItemSummary(item) {
    if (!item) return "";

    if (typeof item.getDescription === "function") {
        const description = await item.getDescription({ secrets: item.isOwner });
        const gmNotes = description?.gm
            ? `<section class="gm-notes" data-tooltip-class="">${description.gm}</section>`
            : "";
        return `${gmNotes}<div class="description" data-tooltip-class="">${description?.value ?? ""}</div>`;
    }

    const source = String(item.description ?? item.system?.description?.value ?? "");
    const textEditor = game.pf2e?.TextEditor
        ?? globalThis.foundry?.applications?.ux?.TextEditor
        ?? globalThis.TextEditor;
    if (typeof textEditor?.enrichHTML !== "function") return source;
    return textEditor.enrichHTML(source, {
        async: true,
        relativeTo: item,
        rollData: item.getRollData?.(),
        secrets: item.isOwner,
    });
}
