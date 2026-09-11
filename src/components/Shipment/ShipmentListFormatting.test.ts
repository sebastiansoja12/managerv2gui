import {formatCompactNumber} from "./ShipmentList";

describe("formatCompactNumber", () => {
    test("formats a six-digit value without conflicting fraction options", () => {
        expect(formatCompactNumber(100_500)).toBe("101K");
    });

    test("keeps one fractional digit for smaller compact values", () => {
        expect(formatCompactNumber(1_500)).toBe("1,5K");
    });
});
