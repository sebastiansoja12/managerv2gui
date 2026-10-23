const MAX_LONG = "9223372036854775807";

// Identifiers stay strings: converting to Number would corrupt ids above 2^53. Empty input means "none".
export const parseOptionalId = (value: string): string | null | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    if (!/^[1-9][0-9]{0,18}$/.test(trimmed)) {
        return undefined;
    }
    // Same-length digit strings compare like the numbers they represent.
    return trimmed.length < MAX_LONG.length || trimmed <= MAX_LONG ? trimmed : undefined;
};
