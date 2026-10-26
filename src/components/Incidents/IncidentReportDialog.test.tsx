import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import IncidentService from "../../hooks/IncidentService";
import pl from "../../i18n/translate";
import IncidentReportDialog from "./IncidentReportDialog";

jest.mock("../../hooks/IncidentService", () => ({
    __esModule: true,
    default: {report: jest.fn()},
}));

const incidentService = IncidentService as jest.Mocked<typeof IncidentService>;

const renderDialog = (onReported = jest.fn()) => {
    render(<IncidentReportDialog open shipmentId="5748961476996084888" onClose={jest.fn()} onReported={onReported} />);
    return onReported;
};

describe("IncidentReportDialog", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        incidentService.report.mockResolvedValue({status: 201, data: {value: "7"}} as never);
    });

    it("reports an incident for the shipment", async () => {
        const onReported = renderDialog();

        fireEvent.change(screen.getByLabelText(pl.incidents.columns.severity), {target: {value: "CRITICAL"}});
        fireEvent.change(screen.getByLabelText(pl.incidents.report.details), {target: {value: " Crushed box "}});
        fireEvent.click(screen.getByRole("button", {name: pl.incidents.report.submit}));

        await waitFor(() => expect(onReported).toHaveBeenCalledWith("7"));
        expect(incidentService.report).toHaveBeenCalledWith({
            shipmentId: {value: "5748961476996084888"},
            category: "DAMAGED",
            severity: "CRITICAL",
            description: "Crushed box",
        });
    });

    it("requires a description for the other category", async () => {
        renderDialog();

        fireEvent.change(screen.getByLabelText(pl.incidents.columns.category), {target: {value: "OTHER"}});
        fireEvent.click(screen.getByRole("button", {name: pl.incidents.report.submit}));

        expect(await screen.findByText(pl.incidents.report.detailsRequired)).toBeInTheDocument();
        expect(incidentService.report).not.toHaveBeenCalled();
    });

    it("explains when the shipment already has an open incident", async () => {
        incidentService.report.mockRejectedValue({status: 409, message: "conflict"});
        renderDialog();

        fireEvent.click(screen.getByRole("button", {name: pl.incidents.report.submit}));

        expect(await screen.findByText(pl.incidents.report.conflict)).toBeInTheDocument();
    });
});
