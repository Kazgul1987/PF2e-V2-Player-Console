const DC_BY_LEVEL = new Map([
    [-1, 13], [0, 14], [1, 15], [2, 16], [3, 18], [4, 19], [5, 20], [6, 22], [7, 23],
    [8, 24], [9, 26], [10, 27], [11, 28], [12, 30], [13, 31], [14, 32], [15, 34],
    [16, 35], [17, 36], [18, 38], [19, 39], [20, 40], [21, 42], [22, 44], [23, 46],
    [24, 48], [25, 50],
]);

export function parseCheckDCInput(rawInput) {
    const input = rawInput.trim();
    if (!input) return { mode: "none" };
    if (/^-?\d+$/.test(input)) return { mode: "level", level: Number(input) };
    const fixed = input.match(/^dc(?:\s+|:\s*)(\d+)$/i);
    return fixed ? { mode: "fixed", dc: Number(fixed[1]) } : { mode: "invalid" };
}

export function getDCByLevel(level) {
    return Number.isSafeInteger(level) ? DC_BY_LEVEL.get(level) : undefined;
}

export function resolveCheckDC(input) {
    if (input.mode === "none") return { valid: true };
    if (input.mode === "invalid") return { valid: false, reason: "input" };
    if (input.mode === "fixed") {
        return Number.isSafeInteger(input.dc) && input.dc >= 0
            ? { valid: true, dc: input.dc }
            : { valid: false, reason: "fixed" };
    }
    const dc = getDCByLevel(input.level);
    return dc === undefined ? { valid: false, reason: "level" } : { valid: true, dc };
}
