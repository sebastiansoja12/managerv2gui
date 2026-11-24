import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import IncidentService from "../../hooks/IncidentService";
import pl from "../../i18n/translate";
import IncidentList from "./IncidentList";
import {IncidentDto} from "./model/Incident";

jest.mock("../../hooks/ShipmentService", () => ({
    __esModule: true,
    default: {get: () => Promise.resolve({data: {shipmentStatus: "SENT", declaredValue: null}})},
}));

jest.mock("../../hooks/IncidentService", () => ({
    __esModule: true,
    default: {find: jest.fn(), statistics: jest.fn(), assignToMe: jest.fn(), resolve: jest.fn()},
}));

const incidentService = IncidentService as jest.Mocked<typeof IncidentService>;

const incident = (id: number, overrides: Partial<IncidentDto> = {}): IncidentDto => ({
    incidentId: {value: String(id)},
    shipmentId: {value: "5748961476996084888"},
    trackingNumber: `KT${id}`,
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
    updatedAt: "2026-11-04T08:00:00Z",
    entries: [],
    ...overrides,
});

const page = (incidents: IncidentDto[]) => ({status: 200, data: {incidents, page: 0, size: 20, totalElements: incidents.length}});

describe("IncidentList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        incidentService.find.mockResolvedValue(page([incident(1), incident(2, {status: "RESOLVED", severity: "LOW"})]) as never);
        incidentService.statistics.mockResolvedValue({status: 200, data: {open: 1, critical: 1, overdue: 0, resolvedToday: 1}} as never);
        incidentService.assignToMe.mockResolvedValue({status: 204, data: undefined} as never);
        incidentService.resolve.mockResolvedValue({status: 204, data: undefined} as never);
    });

    it("shows incidents with translated labels and statistics", async () => {
        render(<IncidentList />);

        expect(await screen.findByText("KT1")).toBeInTheDocument();
        const table = within(screen.getByRole("table"));
        expect(table.getAllByText(pl.incidents.categories.DAMAGED)).toHaveLength(2);
        expect(table.getByText(pl.incidents.severities.CRITICAL)).toBeInTheDocument();
        expect(table.getByText(pl.incidents.statuses.RESOLVED)).toBeInTheDocument();
        expect(screen.getByText(pl.incidents.statistics.critical).parentElement).toHaveTextContent("1");
    });

    it("sends selected filters to the backend", async () => {
        render(<IncidentList />);
        await screen.findByText("KT1");

        fireEvent.change(screen.getByLabelText(pl.incidents.columns.severity), {target: {value: "CRITICAL"}});

        await waitFor(() => expect(incidentService.find).toHaveBeenLastCalledWith(
            expect.objectContaining({severity: "CRITICAL"}), 0, 20));
    });

    it("opens the shipment of an incident in a new tab", async () => {
        const onOpenTab = jest.fn();
        render(<IncidentList onOpenTab={onOpenTab} />);

        fireEvent.click(await screen.findByRole("button", {name: pl.incidents.list.openShipment.replace("{trackingNumber}", "KT1")}));

        expect(onOpenTab).toHaveBeenCalledTimes(1);
        expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/shipments/5748961476996084888/edit"}));
    });

    it("opens incident details when a row is clicked", async () => {
        const onOpenTab = jest.fn();
        render(<IncidentList onOpenTab={onOpenTab} />);

        fireEvent.click(await screen.findByText(pl.incidents.severities.CRITICAL, {selector: "[data-ui=chip-label]"}));

        expect(onOpenTab).toHaveBeenCalledWith({label: `${pl.incidents.details.tabTitle} #1`, path: "/incidents/1"});
    });

    it("does not open incident details when an action button is clicked", async () => {
        const onOpenTab = jest.fn();
        render(<IncidentList onOpenTab={onOpenTab} />);
        const row = (await screen.findByText("KT1")).closest("tr") as HTMLElement;

        fireEvent.click(within(row).getByRole("button", {name: pl.incidents.list.assign}));

        await waitFor(() => expect(incidentService.assignToMe).toHaveBeenCalled());
        expect(onOpenTab).not.toHaveBeenCalled();
    });

    it("takes over and resolves an open incident", async () => {
        render(<IncidentList />);
        const row = (await screen.findByText("KT1")).closest("tr") as HTMLElement;

        fireEvent.click(within(row).getByRole("button", {name: pl.incidents.list.assign}));
        await waitFor(() => expect(incidentService.assignToMe).toHaveBeenCalledWith("1"));

        const resolveButton = await waitFor(() => {
            const button = within(screen.getByText("KT1").closest("tr") as HTMLElement).getByRole("button", {name: pl.incidents.list.resolve});
            expect(button).toBeEnabled();
            return button;
        });
        fireEvent.click(resolveButton);
        const dialog = await screen.findByRole("dialog");
        fireEvent.click(await within(dialog).findByRole("button", {name: new RegExp(pl.incidents.resolutions.REFUSED_BY_RECIPIENT)}));
        const submitButton = within(dialog).getByRole("button", {name: pl.incidents.resolveDialog.submit});
        expect(submitButton).toBeDisabled();
        fireEvent.click(within(dialog).getByLabelText(pl.incidents.resolveDialog.confirm));
        fireEvent.click(submitButton);

        await waitFor(() => expect(incidentService.resolve).toHaveBeenCalledWith("1", {resolution: "REFUSED_BY_RECIPIENT", note: null, repackaging: null}));
    });

    it("sends new packaging data when the shipment was repacked", async () => {
        render(<IncidentList />);
        const row = (await screen.findByText("KT1")).closest("tr") as HTMLElement;
        fireEvent.click(within(row).getByRole("button", {name: pl.incidents.list.assign}));
        const resolveButton = await waitFor(() => {
            const button = within(screen.getByText("KT1").closest("tr") as HTMLElement).getByRole("button", {name: pl.incidents.list.resolve});
            expect(button).toBeEnabled();
            return button;
        });
        fireEvent.click(resolveButton);
        const dialog = await screen.findByRole("dialog");

        fireEvent.click(await within(dialog).findByRole("button", {name: new RegExp(pl.incidents.resolutions.REPACKED)}));
        fireEvent.change(within(dialog).getByLabelText(pl.incidents.resolveDialog.repackaging.weight), {target: {value: "2,5"}});
        fireEvent.change(within(dialog).getByLabelText(pl.incidents.resolveDialog.repackaging.length), {target: {value: "40"}});
        const submitButton = within(dialog).getByRole("button", {name: pl.incidents.resolveDialog.submit});
        fireEvent.change(within(dialog).getByLabelText(new RegExp(pl.incidents.resolveDialog.note)), {target: {value: "Nowy karton"}});
        expect(submitButton).toBeDisabled();

        fireEvent.change(within(dialog).getByLabelText(pl.incidents.resolveDialog.repackaging.width), {target: {value: "30"}});
        fireEvent.change(within(dialog).getByLabelText(pl.incidents.resolveDialog.repackaging.height), {target: {value: "20"}});
        fireEvent.click(submitButton);

        await waitFor(() => expect(incidentService.resolve).toHaveBeenCalledWith("1", {
            resolution: "REPACKED",
            note: "Nowy karton",
            repackaging: {
                packagingType: null,
                weightInKilograms: 2.5,
                lengthInCentimeters: 40,
                widthInCentimeters: 30,
                heightInCentimeters: 20,
            },
        }));
    });

    it("shows a conflict message when the incident changed in the meantime", async () => {
        incidentService.assignToMe.mockRejectedValue({status: 409, message: "conflict"});
        render(<IncidentList />);
        const row = (await screen.findByText("KT1")).closest("tr") as HTMLElement;

        fireEvent.click(within(row).getByRole("button", {name: pl.incidents.list.assign}));

        expect(await screen.findByText(pl.incidents.list.conflict)).toBeInTheDocument();
    });

    it("shows the empty state", async () => {
        incidentService.find.mockResolvedValue(page([]) as never);
        render(<IncidentList />);

        expect(await screen.findByText(pl.incidents.list.empty)).toBeInTheDocument();
    });
});
