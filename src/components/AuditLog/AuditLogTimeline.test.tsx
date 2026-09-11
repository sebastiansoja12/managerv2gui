import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import AuditLogService from "../../hooks/AuditLogService";
import pl from "../../i18n/translate";
import AuditLogTimeline from "./AuditLogTimeline";
import {AuditLogEntryDto} from "./model/AuditLogEntry";

jest.mock("../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock("../../hooks/AuditLogService", () => ({
    __esModule: true,
    default: {findByResource: jest.fn()},
}));

const entry: AuditLogEntryDto = {
    id: 1,
    resourceType: "SHIPMENT",
    resourceId: "42",
    action: "RECIPIENT_CHANGED",
    changes: [{field: "recipient.city", previousValue: "Katowice", currentValue: "Gliwice"}],
    userId: 7,
    username: "jan.kowalski",
    system: false,
    departmentId: 3,
    occurredAt: "2026-10-31T12:00:00Z",
};

const findByResource = AuditLogService.findByResource as jest.Mock;

describe("AuditLogTimeline", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows what changed and who changed it", async () => {
        findByResource.mockResolvedValue({data: {content: [entry], page: 0, size: 20, totalElements: 1}, status: 200});

        render(<AuditLogTimeline departmentLabel={() => "KT1"} resourceId="42" resourceType="SHIPMENT" />);

        expect(await screen.findByText(pl.auditLog.actions.SHIPMENT.RECIPIENT_CHANGED)).toBeInTheDocument();
        expect(findByResource).toHaveBeenCalledWith("SHIPMENT", "42", 0, 20);
        expect(screen.getByText("jan.kowalski")).toBeInTheDocument();
        expect(screen.getByText("KT1")).toBeInTheDocument();
        expect(screen.getByText(`${pl.auditLog.fields.recipient} · ${pl.auditLog.fields.city}`)).toBeInTheDocument();
        expect(screen.getByText("Katowice")).toBeInTheDocument();
        expect(screen.getByText("Gliwice")).toBeInTheDocument();
    });

    it("translates status values and hides an unknown previous value", async () => {
        findByResource.mockResolvedValue({
            data: {
                content: [{...entry, action: "SENT",
                    changes: [{field: "shipmentStatus", previousValue: null, currentValue: "SENT"}]}],
                page: 0,
                size: 20,
                totalElements: 1,
            },
            status: 200,
        });

        render(<AuditLogTimeline resourceId="42" resourceType="SHIPMENT" />);

        expect(await screen.findByText(pl.shipments.status.SENT)).toBeInTheDocument();
        expect(screen.queryByText("SENT")).not.toBeInTheDocument();
        expect(screen.queryByText(pl.common.dash)).not.toBeInTheDocument();
    });

    it("shows the empty state when nothing was recorded", async () => {
        findByResource.mockResolvedValue({data: {content: [], page: 0, size: 20, totalElements: 0}, status: 200});

        render(<AuditLogTimeline resourceId="42" resourceType="SHIPMENT" />);

        expect(await screen.findByText(pl.auditLog.empty)).toBeInTheDocument();
    });

    it("shows the error and retries loading", async () => {
        findByResource
            .mockRejectedValueOnce({message: "Backend request failed"})
            .mockResolvedValueOnce({data: {content: [entry], page: 0, size: 20, totalElements: 1}, status: 200});

        render(<AuditLogTimeline resourceId="42" resourceType="SHIPMENT" />);

        expect(await screen.findByText(pl.auditLog.loadError)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.auditLog.retry}));

        expect(await screen.findByText(pl.auditLog.actions.SHIPMENT.RECIPIENT_CHANGED)).toBeInTheDocument();
        expect(findByResource).toHaveBeenCalledTimes(2);
    });

    it("loads the next page on demand", async () => {
        findByResource
            .mockResolvedValueOnce({data: {content: [entry], page: 0, size: 1, totalElements: 2}, status: 200})
            .mockResolvedValueOnce({
                data: {content: [{...entry, id: 2, action: "SENDER_CHANGED", changes: []}], page: 1, size: 1, totalElements: 2},
                status: 200,
            });

        render(<AuditLogTimeline pageSize={1} resourceId="42" resourceType="SHIPMENT" />);

        fireEvent.click(await screen.findByRole("button", {name: pl.auditLog.loadMore.replace("{count}", "1")}));

        expect(await screen.findByText(pl.auditLog.actions.SHIPMENT.SENDER_CHANGED)).toBeInTheDocument();
        expect(findByResource).toHaveBeenLastCalledWith("SHIPMENT", "42", 1, 1);
    });
});
