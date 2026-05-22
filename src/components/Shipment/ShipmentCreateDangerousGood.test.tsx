import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import ShipmentCreate from "./ShipmentCreate";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";

jest.mock("../../hooks/ShipmentService", () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
    },
}));

describe("ShipmentCreate dangerous goods", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows and clears the dangerous goods form conditionally", () => {
        render((
            <MemoryRouter>
                <ShipmentCreate />
            </MemoryRouter>
        ));

        expect(screen.queryByLabelText(`${pl.shipments.form.fields.unNumber} *`)).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText(pl.shipments.form.fields.containsDangerousGoods));
        expect(screen.getByLabelText(`${pl.shipments.form.fields.unNumber} *`)).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText(pl.shipments.form.fields.containsDangerousGoods));
        expect(screen.queryByLabelText(`${pl.shipments.form.fields.unNumber} *`)).not.toBeInTheDocument();
    });

    it("does not send an empty dangerousGood object when the toggle is disabled", async () => {
        (ShipmentService.create as jest.Mock).mockResolvedValue({
            data: {
                shipmentId: "42",
                trackingNumber: "TRACK-42",
            },
            status: 200,
        });
        render((
            <MemoryRouter>
                <ShipmentCreate />
            </MemoryRouter>
        ));

        fireEvent.click(screen.getByRole("button", {name: pl.shipments.actions.create}));

        await waitFor(() => expect(ShipmentService.create).toHaveBeenCalledTimes(1));
        expect(ShipmentService.create).toHaveBeenCalledWith(
            expect.not.objectContaining({dangerousGood: expect.anything()})
        );
        await waitFor(() => expect(
            screen.getByRole("button", {name: pl.shipments.actions.create})
        ).not.toBeDisabled());
    });
});
