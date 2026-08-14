import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import OperatorPrivacyPanel from "./OperatorPrivacyPanel";

jest.mock("../../../hooks/OperatorOperationsService", () => ({
    __esModule: true,
    default: {
        downloadExport: jest.fn(),
        getLastErasure: jest.fn(),
        eraseData: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = OperatorOperationsService as jest.Mocked<typeof OperatorOperationsService>;
const texts = pl.superAdmin.privacy;

const operator = (status: string) => ({operatorId: {value: 20}, companyName: "Acme", status} as unknown as Operator);

describe("OperatorPrivacyPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.getLastErasure.mockResolvedValue(null);
        service.downloadExport.mockResolvedValue("operator-20-export.json");
    });

    test("downloads operator export", async () => {
        render(<OperatorPrivacyPanel operator={operator("ACTIVE")} />);

        fireEvent.click(screen.getByRole("button", {name: texts.export}));

        await waitFor(() => expect(service.downloadExport).toHaveBeenCalledWith("20"));
        expect(await screen.findByText(texts.exported.replace("{file}", "operator-20-export.json"))).toBeInTheDocument();
    });

    test("requires blocked operator before erasure", () => {
        render(<OperatorPrivacyPanel operator={operator("ACTIVE")} />);

        expect(screen.getByText(texts.requiresBlocked)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: texts.erase})).toBeDisabled();
    });

    test("erases data after typing company name and confirming", async () => {
        service.eraseData.mockResolvedValue({operatorId: 20, requestedBy: "owner", executedAt: "2026-10-17T10:00:00Z",
            usersAnonymized: 4, couriersAnonymized: 2, devicesRetired: 3});
        const onErased = jest.fn();
        render(<OperatorPrivacyPanel onErased={onErased} operator={operator("INACTIVE")} />);
        const eraseButton = screen.getByRole("button", {name: texts.erase});

        fireEvent.change(screen.getByLabelText(texts.confirmationLabel.replace("{company}", "Acme")), {target: {value: "acme"}});
        expect(eraseButton).toBeDisabled();
        fireEvent.change(screen.getByLabelText(texts.confirmationLabel.replace("{company}", "Acme")), {target: {value: "Acme"}});
        fireEvent.click(eraseButton);
        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: texts.erase}));

        await waitFor(() => expect(service.eraseData).toHaveBeenCalledWith("20", "Acme"));
        expect(await screen.findByText(texts.erased)).toBeInTheDocument();
        expect(screen.getByText(/4 użytkowników, 2 kurierów, 3 urządzeń/)).toBeInTheDocument();
        expect(onErased).toHaveBeenCalled();
    });
});
