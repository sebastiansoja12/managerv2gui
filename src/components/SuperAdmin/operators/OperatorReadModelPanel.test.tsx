import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import OperatorAdministrationService from "../../../hooks/OperatorAdministrationService";
import pl from "../../../i18n/translate";
import OperatorReadModelPanel from "./OperatorReadModelPanel";

jest.mock("../../../hooks/OperatorAdministrationService", () => ({
    __esModule: true,
    default: {
        getReadModelTypes: jest.fn(),
        getReadModelJobs: jest.fn(),
        startReadModelRebuild: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = OperatorAdministrationService as jest.Mocked<typeof OperatorAdministrationService>;

describe("OperatorReadModelPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.getReadModelTypes.mockResolvedValue(["SHIPMENT", "DEPARTMENT"]);
        service.getReadModelJobs.mockResolvedValue([{
            jobId: "job-1",
            readModelType: "DEPARTMENT",
            status: "FAILED",
            dateFrom: "2026-09-01",
            dateTo: "2026-09-30",
            error: "Department read model failed",
        }]);
    });

    test("lists latest jobs with translated status", async () => {
        render(<OperatorReadModelPanel operatorId="20" />);

        expect(await screen.findByText(pl.superAdmin.readModels.statuses.FAILED)).toBeInTheDocument();
        expect(screen.getByText("Department read model failed")).toBeInTheDocument();
        expect(service.getReadModelJobs).toHaveBeenCalledWith("20");
    });

    test("starts rebuild for selected model and range", async () => {
        service.startReadModelRebuild.mockResolvedValue({
            jobId: "job-2",
            readModelType: "SHIPMENT",
            status: "COMPLETED",
            dateFrom: "2026-10-01",
            dateTo: "2026-10-17",
        });
        render(<OperatorReadModelPanel operatorId="20" />);
        await waitFor(() => expect(screen.getByRole("button", {name: pl.superAdmin.readModels.start})).toBeEnabled());

        fireEvent.change(screen.getByLabelText(pl.superAdmin.readModels.dateFrom), {target: {value: "2026-10-01"}});
        fireEvent.change(screen.getByLabelText(pl.superAdmin.readModels.dateTo), {target: {value: "2026-10-17"}});
        fireEvent.click(screen.getByRole("button", {name: pl.superAdmin.readModels.start}));

        await waitFor(() => expect(service.startReadModelRebuild).toHaveBeenCalledWith("20", "SHIPMENT", {
            dateFrom: "2026-10-01",
            dateTo: "2026-10-17",
        }));
        expect(await screen.findByText(pl.superAdmin.readModels.statuses.COMPLETED)).toBeInTheDocument();
    });

    test("blocks inverted date range", async () => {
        render(<OperatorReadModelPanel operatorId="20" />);
        await waitFor(() => expect(screen.getByRole("button", {name: pl.superAdmin.readModels.start})).toBeEnabled());

        fireEvent.change(screen.getByLabelText(pl.superAdmin.readModels.dateFrom), {target: {value: "2026-10-17"}});
        fireEvent.change(screen.getByLabelText(pl.superAdmin.readModels.dateTo), {target: {value: "2026-10-01"}});

        expect(screen.getByRole("button", {name: pl.superAdmin.readModels.start})).toBeDisabled();
        expect(screen.getByText(pl.superAdmin.readModels.rangeInvalid)).toBeInTheDocument();
    });
});
