import {Operator, operatorToDraft} from "../../Operators/model/Operator";
import pl from "../../../i18n/translate";
import {isOperatorDraftDirty, validateOperatorData} from "./OperatorDataPanel";

const operator = {
    operatorId: {value: 20},
    registeringUserId: {value: 1},
    taxId: {value: "1234567890"},
    companyName: "Acme",
    contactEmail: "office@acme.pl",
    contactPhone: "+48123456789",
    contractStartDate: "2026-01-01",
    contractEndDate: "2026-12-31",
    foundedDate: "2020-05-01",
    status: "ACTIVE",
} as unknown as Operator;

describe("OperatorDataPanel helpers", () => {
    test("detects edited operator data", () => {
        const draft = operatorToDraft(operator);

        expect(isOperatorDraftDirty(operator, draft)).toBe(false);
        expect(isOperatorDraftDirty(operator, {...draft, companyName: "Acme Logistics"})).toBe(true);
    });

    test("accepts complete operator data", () => {
        expect(validateOperatorData(operatorToDraft(operator))).toEqual([]);
    });

    test("reports missing name, invalid email and inverted contract dates", () => {
        const errors = validateOperatorData({
            ...operatorToDraft(operator),
            companyName: " ",
            contactEmail: "office",
            contractStartDate: "2026-12-31",
            contractEndDate: "2026-01-01",
        });

        expect(errors).toEqual([
            pl.superAdmin.operatorData.validation.companyName,
            pl.superAdmin.operatorData.validation.email,
            pl.superAdmin.operatorData.validation.contractDates,
        ]);
    });
});
