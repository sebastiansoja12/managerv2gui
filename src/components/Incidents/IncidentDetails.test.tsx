import React from "react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import IncidentService from "../../hooks/IncidentService";
import pl from "../../i18n/translate";
import IncidentDetails from "./IncidentDetails";
import {IncidentDto} from "./model/Incident";

jest.mock("../../hooks/IncidentService", () => ({
    __esModule: true,
    default: {get: jest.fn(), assignToMe: jest.fn(), comment: jest.fn(), resolve: jest.fn(), reopen: jest.fn()},
}));

const incidentService = IncidentService as jest.Mocked<typeof IncidentService>;

const incident = (overrides: Partial<IncidentDto> = {}): IncidentDto => ({
    incidentId: {value: "42"},
    shipmentId: {value: "5748961476996084888"},
    trackingNumber: "KT1202611",
    departmentCode: "WRO",
    category: "DAMAGED",
    severity: "CRITICAL",
    status: "OPEN",
    description: "Crushed box",
    reporter: {userId: {value: 1}, username: "anna"},
    assignee: null,
    resolution: null,
    reportedAt: "2026-11-04T08:00:00Z",
    resolvedAt: null,
    updatedAt: "2026-11-04T09:00:00Z",
    entries: [
        {type: "REPORTED", actor: {userId: {value: 1}, username: "anna"}, text: "Crushed box", occurredAt: "2026-11-04T08:00:00Z"},
        {type: "COMMENTED", actor: {userId: {value: 2}, username: "piotr"}, text: "Photo taken", occurredAt: "2026-11-04T09:00:00Z"},
    ],
    ...overrides,
});

const renderDetails = (onOpenTab = jest.fn()) => {
    render(
        <MemoryRouter initialEntries={["/incidents/42"]}>
            <Routes>
                <Route path="/incidents/:incidentId" element={<IncidentDetails onOpenTab={onOpenTab} />} />
            </Routes>
        </MemoryRouter>,
    );
    return onOpenTab;
};

describe("IncidentDetails", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        incidentService.get.mockResolvedValue({status: 200, data: incident()} as never);
        incidentService.comment.mockResolvedValue({status: 204, data: undefined} as never);
        incidentService.reopen.mockResolvedValue({status: 204, data: undefined} as never);
    });

    it("shows the incident and its timeline, newest first", async () => {
        renderDetails();

        expect(await screen.findByRole("heading", {name: pl.incidents.details.title.replace("{incidentId}", "42")})).toBeInTheDocument();
        expect(screen.getByText("KT1202611")).toBeInTheDocument();
        const entries = within(screen.getByRole("list")).getAllByRole("listitem");
        expect(entries[0]).toHaveTextContent(pl.incidents.details.entryTypes.COMMENTED);
        expect(entries[1]).toHaveTextContent(pl.incidents.details.entryTypes.REPORTED);
    });

    it("opens the shipment in a new tab", async () => {
        const onOpenTab = renderDetails();

        fireEvent.click(await screen.findByRole("button", {name: pl.incidents.details.openShipment}));

        expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/shipments/5748961476996084888/edit"}));
    });

    it("adds a comment and reloads the incident", async () => {
        renderDetails();
        await screen.findByText("KT1202611");

        fireEvent.change(screen.getByLabelText(pl.incidents.details.commentLabel), {target: {value: "  Called the sender "}});
        fireEvent.click(screen.getByRole("button", {name: pl.incidents.details.commentSubmit}));

        await waitFor(() => expect(incidentService.comment).toHaveBeenCalledWith("42", "Called the sender"));
        await waitFor(() => expect(incidentService.get).toHaveBeenCalledTimes(2));
    });

    it("does not send an empty comment", async () => {
        renderDetails();
        await screen.findByText("KT1202611");

        fireEvent.click(screen.getByRole("button", {name: pl.incidents.details.commentSubmit}));

        expect(await screen.findByText(pl.incidents.details.commentRequired)).toBeInTheDocument();
        expect(incidentService.comment).not.toHaveBeenCalled();
    });

    it("reopens a resolved incident with a reason", async () => {
        incidentService.get.mockResolvedValue({status: 200, data: incident({status: "RESOLVED", resolution: "EXPLAINED", resolvedAt: "2026-11-04T10:00:00Z"})} as never);
        renderDetails();

        fireEvent.click(await screen.findByRole("button", {name: pl.incidents.details.reopen}));
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText(new RegExp(pl.incidents.details.reopenDialog.reason)), {target: {value: "Still damaged"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.incidents.details.reopenDialog.submit}));

        await waitFor(() => expect(incidentService.reopen).toHaveBeenCalledWith("42", "Still damaged"));
        expect(screen.queryByRole("button", {name: pl.incidents.list.assign})).not.toBeInTheDocument();
    });

    it("shows not found for a missing incident", async () => {
        incidentService.get.mockRejectedValue({status: 404, message: "missing"});
        renderDetails();

        expect(await screen.findByText(pl.incidents.details.notFound)).toBeInTheDocument();
    });
});
