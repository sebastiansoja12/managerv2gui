import Department from "../../class/depots/Department";
import DeliveryAreaService from "../../hooks/DeliveryAreaService";
import {applyDepartmentAutomations} from "./departmentAutomation";
import {defaultDepartmentConfiguration} from "./model/DepartmentConfiguration";

jest.mock("../../hooks/DeliveryAreaService", () => ({
    __esModule: true,
    default: {applyAutomatic: jest.fn()},
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

const deliveryAreas = DeliveryAreaService as jest.Mocked<typeof DeliveryAreaService>;

describe("department automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("skips the server when boundaries are not assigned automatically", async () => {
        const result = await applyDepartmentAutomations(defaultDepartmentConfiguration,
            [department(1, "KT1", "BRANCH", 50.26, 19.02)]);
        expect(result.assignedAreas).toBe(0);
        expect(deliveryAreas.applyAutomatic).not.toHaveBeenCalled();
    });

    it("asks the server to assign boundaries to all eligible departments", async () => {
        deliveryAreas.applyAutomatic.mockResolvedValue({data: [
            {departmentId: 1, departmentCode: "KT1", areas: []},
            {departmentId: 2, departmentCode: "WA1", areas: []},
        ], status: 200});
        const configuration = {...defaultDepartmentConfiguration, autoAssignDeliveryAreas: true};
        const result = await applyDepartmentAutomations(configuration, [
            department(1, "KT1", "BRANCH", 50.26, 19.02),
            department(2, "WA1", "BRANCH", 52.23, 21.01),
            department(3, "BER", "BRANCH", 52.52, 13.4),
        ]);
        expect(result.assignedAreas).toBe(2);
        expect(deliveryAreas.applyAutomatic).toHaveBeenCalledWith([1, 2]);
    });
});
