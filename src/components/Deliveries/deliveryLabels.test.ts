import {setLanguage} from "../../i18n/languageStore";
import Department from "../../class/depots/Department";
import {deliveryStepCommentText, destinationDepartmentLabel} from "./deliveryLabels";

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

describe("destinationDepartmentLabel", () => {
    afterEach(() => setLanguage("pl"));

    const departments = [{departmentId: 7, departmentCode: {value: "WA1"}}] as unknown as Department[];

    it.each([
        ["pl", "Nie ustalono"],
        ["en", "Not determined"],
        ["de", "Nicht ermittelt"],
    ] as const)("marks shipment delivery without destination as not determined in %s", (language, label) => {
        setLanguage(language);

        expect(destinationDepartmentLabel(departments, {targetType: "SHIPMENT", destinationDepartmentId: null}))
            .toBe(label);
    });

    it("shows department code when destination is set", () => {
        expect(destinationDepartmentLabel(departments, {targetType: "SHIPMENT", destinationDepartmentId: "7"}))
            .toBe("WA1");
    });

    it("keeps dash for pallet delivery without destination", () => {
        expect(destinationDepartmentLabel(departments, {targetType: "PALLET", destinationDepartmentId: null}))
            .toBe("-");
    });
});
