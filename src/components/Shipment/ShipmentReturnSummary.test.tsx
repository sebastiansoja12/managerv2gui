import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes, useLocation} from "react-router-dom";
import pl from "../../i18n/translate";
import {ReturnPackageDto} from "../Returns/model/ReturnPackage";
import ShipmentReturnSummary from "./ShipmentReturnSummary";

const returnPackage = {
    returnPackageId: {value: "9223372036854775001"},
    shipmentId: {value: "6805406359141427429"},
    returnStatus: "CREATED",
} as ReturnPackageDto;
const Destination = () => <div>{useLocation().pathname}</div>;
const view = (value: ReturnPackageDto | null = returnPackage) => (
    <MemoryRouter>
        <Routes>
            <Route path="/" element={<ShipmentReturnSummary returnPackage={value} />} />
            <Route path="/returns/:returnId" element={<Destination />} />
        </Routes>
    </MemoryRouter>
);

describe("ShipmentReturnSummary", () => {
    it("renders nothing when Manager reports no return", () => {
        const {container} = render(view(null));
        expect(container).toBeEmptyDOMElement();
    });

    it.each(["CREATED", "PROCESSING", "COMPLETED", "CANCELLED"] as const)("shows status %s from Manager and opens the exact return ID", (status) => {
        render(view({...returnPackage, returnStatus: status}));
        expect(screen.getByText(pl.returns.status[status])).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.shipments.returnSummary.open}));
        expect(screen.getByText(`/returns/${returnPackage.returnPackageId.value}`)).toBeInTheDocument();
    });

    it("updates and clears the panel when Manager supplies new shipment details", () => {
        const {container, rerender} = render(view());
        expect(screen.getByText(pl.returns.status.CREATED)).toBeInTheDocument();
        rerender(view({...returnPackage, returnStatus: "COMPLETED"}));
        expect(screen.getByText(pl.returns.status.COMPLETED)).toBeInTheDocument();
        rerender(view(null));
        expect(container).toBeEmptyDOMElement();
    });
});
