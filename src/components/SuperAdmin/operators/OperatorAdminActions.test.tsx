import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import Department from "../../../class/depots/Department";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import OperatorAdminActions from "./OperatorAdminActions";

jest.mock("../../../hooks/OperatorOperationsService", () => ({
    __esModule: true,
    default: {
        getOperatorJobs: jest.fn(),
        runOperatorJob: jest.fn(),
        getCourierAssignmentRuns: jest.fn(),
        downloadExport: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = OperatorOperationsService as jest.Mocked<typeof OperatorOperationsService>;
const texts = pl.superAdmin.adminActions;
const departments = [{departmentId: 1, departmentCode: {value: "KT1"}}] as unknown as Department[];

const renderActions = (active = true, onImpersonate = jest.fn(), onOpenTab = jest.fn()) => render(
    <OperatorAdminActions
        active={active}
        departments={departments}
        onImpersonate={onImpersonate}
        onOpenTab={onOpenTab}
        operatorId="20"
        operatorName="Acme"
    />,
);

const openMenu = () => fireEvent.click(screen.getByRole("button", {name: new RegExp(texts.button)}));

describe("OperatorAdminActions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.getOperatorJobs.mockResolvedValue(["COURIER_ASSIGNMENT_ORCHESTRATION", "COURIER_ASSIGNMENT_RECOVERY",
            "DRIVER_LICENSE_VALIDATION"]);
    });

    it("lists all admin actions in the menu", () => {
        renderActions();

        openMenu();

        expect(screen.getByText(texts.runJob)).toBeInTheDocument();
        expect(screen.getByText(texts.runHistory)).toBeInTheDocument();
        expect(screen.getByText(texts.impersonate)).toBeInTheDocument();
        expect(screen.getByText(texts.exportData)).toBeInTheDocument();
        expect(screen.getByText(pl.superAdmin.workspace.readModelsTab)).toBeInTheDocument();
        expect(screen.getByText(pl.superAdmin.workspace.devicesTab)).toBeInTheDocument();
        expect(screen.getByText(pl.superAdmin.workspace.privacyTab)).toBeInTheDocument();
    });

    it("runs job selected from the list loaded from backend", async () => {
        service.runOperatorJob.mockResolvedValue({jobType: "COURIER_ASSIGNMENT_RECOVERY", asynchronous: true, affected: 2});
        renderActions();

        openMenu();
        fireEvent.click(screen.getByText(texts.runJob));
        await screen.findByText(texts.jobs.COURIER_ASSIGNMENT_ORCHESTRATION.description);
        fireEvent.click(screen.getByRole("combobox", {name: texts.jobDialog.job}));
        fireEvent.click(screen.getByRole("option", {name: texts.jobs.COURIER_ASSIGNMENT_RECOVERY.label}));
        expect(screen.getByText(texts.jobs.COURIER_ASSIGNMENT_RECOVERY.description)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: texts.jobDialog.confirm}));

        await waitFor(() => expect(service.runOperatorJob).toHaveBeenCalledWith("20", "COURIER_ASSIGNMENT_RECOVERY"));
        expect(await screen.findByText(texts.results.recovered.replace("{affected}", "2"))).toBeInTheDocument();
        expect(screen.queryByText(texts.jobDialog.title)).not.toBeInTheDocument();
    });

    it("shows orchestration result with triggered departments", async () => {
        service.runOperatorJob.mockResolvedValue({
            jobType: "COURIER_ASSIGNMENT_ORCHESTRATION", asynchronous: true, affected: 2, total: 3,
        });
        renderActions();

        openMenu();
        fireEvent.click(screen.getByText(texts.runJob));
        await screen.findByText(texts.jobs.COURIER_ASSIGNMENT_ORCHESTRATION.description);
        fireEvent.click(screen.getByRole("button", {name: texts.jobDialog.confirm}));

        expect(await screen.findByText(texts.results.orchestrated.replace("{affected}", "2").replace("{total}", "3")))
            .toBeInTheDocument();
    });

    it("keeps job dialog open and shows error when job fails", async () => {
        service.runOperatorJob.mockRejectedValue(new Error("conflict"));
        renderActions();

        openMenu();
        fireEvent.click(screen.getByText(texts.runJob));
        await screen.findByText(texts.jobs.COURIER_ASSIGNMENT_ORCHESTRATION.description);
        fireEvent.click(screen.getByRole("button", {name: texts.jobDialog.confirm}));

        expect(await screen.findByText(texts.results.error)).toBeInTheDocument();
        expect(screen.getByText(texts.jobDialog.title)).toBeInTheDocument();
    });

    it("shows run history with department codes and statuses", async () => {
        service.getCourierAssignmentRuns.mockResolvedValue([{
            runId: "run-1", departmentId: 1, windowFrom: "2026-11-24T07:00:00Z", windowTo: "2026-11-24T11:00:00Z",
            backlogFrom: "2026-11-21T07:00:00Z", status: "ERROR", retries: 3, discovered: 10, eligible: 9,
            assigned: 8, noCourier: 1, skippedNotAtDepartment: 1, skippedConcurrent: 0, batches: 2,
            error: "timeout", createdAt: "2026-11-24T11:00:00Z", updatedAt: "2026-11-24T11:05:00Z",
        }]);
        renderActions();

        openMenu();
        fireEvent.click(screen.getByText(texts.runHistory));

        expect(await screen.findByText("KT1")).toBeInTheDocument();
        expect(screen.getByText(texts.runs.statuses.ERROR)).toBeInTheDocument();
        expect(screen.getByText(texts.runs.retries.replace("{retries}", "3"))).toBeInTheDocument();
        expect(service.getCourierAssignmentRuns).toHaveBeenCalledWith("20");
    });

    it("shows empty run history", async () => {
        service.getCourierAssignmentRuns.mockResolvedValue([]);
        renderActions();

        openMenu();
        fireEvent.click(screen.getByText(texts.runHistory));

        expect(await screen.findByText(texts.runs.empty)).toBeInTheDocument();
    });

    it("does not open job dialog for inactive operator", () => {
        renderActions(false);

        openMenu();
        fireEvent.click(screen.getByText(texts.runJob));

        expect(screen.getByText(texts.inactiveHint)).toBeInTheDocument();
        expect(screen.queryByText(texts.jobDialog.title)).not.toBeInTheDocument();
        expect(service.getOperatorJobs).not.toHaveBeenCalled();
    });

    it("exports operator data", async () => {
        service.downloadExport.mockResolvedValue("operator-20-export.json");
        renderActions();

        openMenu();
        fireEvent.click(screen.getByText(texts.exportData));

        expect(await screen.findByText(texts.exported.replace("{file}", "operator-20-export.json"))).toBeInTheDocument();
    });

    it("delegates impersonation and tab shortcuts", () => {
        const onImpersonate = jest.fn();
        const onOpenTab = jest.fn();
        renderActions(true, onImpersonate, onOpenTab);

        openMenu();
        fireEvent.click(screen.getByText(texts.impersonate));
        openMenu();
        fireEvent.click(screen.getByText(pl.superAdmin.workspace.devicesTab));

        expect(onImpersonate).toHaveBeenCalled();
        expect(onOpenTab).toHaveBeenCalledWith("devices");
    });
});
