import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import DangerousGoodForm, {
    createEmptyDangerousGood,
    isDangerousGoodValid,
} from "./DangerousGoodForm";
import pl from "../../i18n/translate";

describe("DangerousGoodForm", () => {
    it("renders required dangerous goods fields", () => {
        render((
            <DangerousGoodForm
                value={createEmptyDangerousGood()}
                onChange={jest.fn()}
            />
        ));

        expect(screen.getByLabelText(`${pl.shipments.form.fields.unNumber} *`)).toBeInTheDocument();
        expect(screen.getByLabelText(`${pl.shipments.form.fields.properShippingName} *`)).toBeInTheDocument();
        expect(screen.getByLabelText(`${pl.shipments.form.fields.hazardClass} *`)).toBeInTheDocument();
    });

    it("updates the canonical corrosive property", () => {
        const handleChange = jest.fn();
        render((
            <DangerousGoodForm
                value={createEmptyDangerousGood()}
                onChange={handleChange}
            />
        ));

        fireEvent.click(screen.getByLabelText(pl.shipments.form.fields.corrosive));

        expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({corrosive: true}));
        expect(handleChange).not.toHaveBeenCalledWith(expect.objectContaining({corosive: true}));
    });

    it("validates required values and the 24-hour contact rule", () => {
        const validRoadGood = {
            ...createEmptyDangerousGood(),
            unNumber: "UN1203",
            properShippingName: "Gasoline",
            hazardClass: "3",
            packingGroup: "II",
            quantity: 10,
            packagingType: "DRUM",
        };

        expect(isDangerousGoodValid(validRoadGood)).toBe(true);
        expect(isDangerousGoodValid({...validRoadGood, unNumber: "1203"})).toBe(false);
        expect(isDangerousGoodValid({...validRoadGood, quantity: 0})).toBe(false);
        expect(isDangerousGoodValid({...validRoadGood, packageCount: 0})).toBe(false);
        expect(isDangerousGoodValid({...validRoadGood, transportMode: "AIR"})).toBe(false);
        expect(isDangerousGoodValid({
            ...validRoadGood,
            transportMode: "AIR",
            emergencyContact24h: "+48 123 456 789",
        })).toBe(true);
    });
});
