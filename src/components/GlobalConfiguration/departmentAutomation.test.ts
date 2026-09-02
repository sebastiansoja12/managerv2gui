import Department from "../../class/depots/Department";
import DeliveryNetworkService from "../../hooks/DeliveryNetworkService";
import {applyDepartmentAutomations} from "./departmentAutomation";
import {defaultDepartmentConfiguration} from "./model/DepartmentConfiguration";

jest.mock("../../hooks/DeliveryNetworkService", () => ({
    __esModule: true,
    default: {getCurrentNetwork: jest.fn(), replaceCurrentNetwork: jest.fn()},
}));

const department = (id: number, code: string, type: string, latitude: number, longitude: number): Department => ({
    departmentId: id,
    departmentCode: {value: code},
    departmentType: type,
    address: {city: code, street: "", postalCode: "", countryCode: "PL"},
    coordinates: {latitude, longitude},
    status: "ACTIVE",
    taxId: "", telephoneNumber: "", openingHours: "", email: "", createdAt: "", updatedAt: "",
});

const network = DeliveryNetworkService as jest.Mocked<typeof DeliveryNetworkService>;

describe("department automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
        network.getCurrentNetwork.mockResolvedValue({data: []} as never);
        network.replaceCurrentNetwork.mockResolvedValue({data: []} as never);
    });

    it("connects only the new department to its nearest sorting facility", async () => {
        const departments = [
            department(1, "NEW", "BRANCH", 50, 19),
            department(2, "NEAR", "SORTING_FACILITY", 50.1, 19.1),
            department(3, "FAR", "SORTING_FACILITY", 53, 21),
            department(4, "OTHER", "BRANCH", 51, 20),
        ];
        const configuration = {...defaultDepartmentConfiguration, autoConnectDepartments: true};
        const result = await applyDepartmentAutomations(configuration, departments, 7, "NEW");
        expect(result.createdConnections).toBe(1);
        expect(result.connectionSkipped).toBe(false);
        expect(network.replaceCurrentNetwork).toHaveBeenCalledWith([
            {sourceDepartmentId: "1", targetDepartmentId: "2"},
        ]);

        jest.clearAllMocks();
        await applyDepartmentAutomations(configuration, departments, 7);
        expect(network.getCurrentNetwork).not.toHaveBeenCalled();
    });

    it("assigns local delivery drafts to all eligible departments", async () => {
        const configuration = {...defaultDepartmentConfiguration, autoAssignDeliveryAreas: true};
        const result = await applyDepartmentAutomations(configuration, [
            department(1, "KT1", "BRANCH", 50.26, 19.02),
            department(2, "WA1", "BRANCH", 52.23, 21.01),
        ], 7);
        expect(result.assignedAreas).toBe(2);
        expect(JSON.parse(window.localStorage.getItem("manager.delivery-area-draft.v1.7.1") || "{}").areas.length)
            .toBeGreaterThan(0);
        expect(JSON.parse(window.localStorage.getItem("manager.delivery-area-draft.v1.7.2") || "{}").areas.length)
            .toBeGreaterThan(0);
    });

    it("reports that a new department cannot be connected without a sorting facility", async () => {
        const configuration = {...defaultDepartmentConfiguration, autoConnectDepartments: true};
        const result = await applyDepartmentAutomations(configuration,
            [department(1, "NEW", "BRANCH", 50, 19)], 7, "NEW");
        expect(result.connectionSkipped).toBe(true);
        expect(network.replaceCurrentNetwork).not.toHaveBeenCalled();
    });
});
