import React from "react";
import {render, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {setAuthenticated, setUnauthenticated} from "../../auth/AuthState";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import DeliveryNetworkService from "../../hooks/DeliveryNetworkService";
import DepartmentService from "../../hooks/DepartmentService";
import ShipmentService from "../../hooks/ShipmentService";
import {OperatorCapabilitiesContext} from "../AppShell/OperatorCapabilitiesContext";
import OperationalDashboard from "./OperationalDashboard";

jest.mock("../../hooks/ShipmentService", () => ({
    __esModule: true,
    default: {search: jest.fn()},
}));

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

jest.mock("../../hooks/DeliveryNetworkService", () => ({
    __esModule: true,
    default: {getCurrentNetwork: jest.fn()},
}));

describe("operational dashboard data", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setAuthenticated({departmentCode: "KAT1"} as CurrentUserDto);
        (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: [
            {departmentId: 3, departmentCode: {value: "KAT1"}},
        ]});
        (DeliveryNetworkService.getCurrentNetwork as jest.Mock).mockResolvedValue({data: []});
        (ShipmentService.search as jest.Mock).mockResolvedValue({data: {
            content: [], page: 0, size: 100, totalElements: 0, totalPages: 0,
        }});
    });

    afterEach(() => {
        setUnauthenticated();
    });

    it("loads department shipments of the dashboard period once", async () => {
        render(
            <React.StrictMode>
                <OperatorCapabilitiesContext.Provider value={{returnsStatus: "unavailable"}}>
                    <MemoryRouter>
                        <OperationalDashboard/>
                    </MemoryRouter>
                </OperatorCapabilitiesContext.Provider>
            </React.StrictMode>,
        );

        await waitFor(() => expect(ShipmentService.search).toHaveBeenCalledTimes(1));
        expect(ShipmentService.search).toHaveBeenCalledWith(expect.objectContaining({
            departmentId: {value: 3},
            createdFrom: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T00:00:00$/),
            page: 0,
        }));
        expect(DepartmentService.getAll).toHaveBeenCalledTimes(1);
        expect(DeliveryNetworkService.getCurrentNetwork).toHaveBeenCalledTimes(1);
    });

    it("waits until operator capabilities are known", () => {
        render(
            <OperatorCapabilitiesContext.Provider value={{returnsStatus: "loading"}}>
                <MemoryRouter>
                    <OperationalDashboard/>
                </MemoryRouter>
            </OperatorCapabilitiesContext.Provider>,
        );

        expect(ShipmentService.search).not.toHaveBeenCalled();
        expect(DepartmentService.getAll).not.toHaveBeenCalled();
    });
});
