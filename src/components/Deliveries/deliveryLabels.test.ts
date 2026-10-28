import {setLanguage} from "../../i18n/languageStore";
import {deliveryStepCommentText} from "./deliveryLabels";

describe("deliveryStepCommentText", () => {
    afterEach(() => setLanguage("pl"));

    it.each([
        ["pl", "Zastąpiona dostawą paletową"],
        ["en", "Replaced by pallet delivery"],
        ["de", "Durch Palettenzustellung ersetzt"],
    ] as const)("translates known comment code in %s", (language, label) => {
        setLanguage(language);

        expect(deliveryStepCommentText({comment: null, commentCode: "REPLACED_BY_PALLET_DELIVERY"})).toBe(label);
    });

    it("appends operator comment to translated code", () => {
        setLanguage("en");

        expect(deliveryStepCommentText({comment: "Checked", commentCode: "REPLACED_BY_PALLET_DELIVERY"}))
            .toBe("Replaced by pallet delivery — Checked");
    });

    it("keeps legacy text-only comments and unknown codes as they are", () => {
        expect(deliveryStepCommentText({comment: "Replaced by pallet delivery 42"}))
            .toBe("Replaced by pallet delivery 42");
        expect(deliveryStepCommentText({comment: "Left at reception", commentCode: "NEW_CODE"})).toBe("Left at reception");
        expect(deliveryStepCommentText({comment: null, commentCode: "NEW_CODE"})).toBe("NEW_CODE");
        expect(deliveryStepCommentText({comment: null, commentCode: null})).toBeNull();
    });
});
