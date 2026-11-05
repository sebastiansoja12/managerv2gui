const mockManagerRequest = jest.fn();

jest.mock("../http-common", () => ({
    __esModule: true,
    default: {
        request: (...args: unknown[]) => mockManagerRequest(...args),
    },
}));

import DeliveryNetworkService from "./DeliveryNetworkService";

describe("DeliveryNetworkService", () => {
    beforeEach(() => {
        mockManagerRequest.mockReset();
    });

    it("loads typed backend connections as GUI relations", async () => {
        mockManagerRequest.mockResolvedValue({
            data: {
                connections: [{
                    firstDepartmentId: {value: "1"},
                    secondDepartmentId: {value: "7037389207610229000"},
                }],
            },
            status: 200,
        });

        const response = await DeliveryNetworkService.getCurrentNetwork();

        expect(response.data).toEqual([{
            sourceDepartmentId: "1",
            targetDepartmentId: "7037389207610229000",
            bidirectional: true,
        }]);
        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/delivery-networks/current",
            params: undefined,
            headers: undefined,
        });
    });

    it("keeps the direction of one-way connections", async () => {
        mockManagerRequest.mockResolvedValue({data: {connections: []}, status: 200});

        await DeliveryNetworkService.replaceCurrentNetwork([{
            sourceDepartmentId: "7",
            targetDepartmentId: "1",
            bidirectional: false,
        }]);

        expect(mockManagerRequest).toHaveBeenCalledWith(expect.objectContaining({
            method: "PUT",
            data: {
                connections: [{
                    firstDepartmentId: {value: "7"},
                    secondDepartmentId: {value: "1"},
                    bidirectional: false,
                }],
            },
        }));
    });

    it("replaces the whole network with canonical typed department pairs", async () => {
        mockManagerRequest.mockResolvedValue({
            data: {
                connections: [{
                    firstDepartmentId: {value: "1"},
                    secondDepartmentId: {value: "7037389207610229000"},
                }],
            },
            status: 200,
        });

        await DeliveryNetworkService.replaceCurrentNetwork([{
            sourceDepartmentId: "7037389207610229000",
            targetDepartmentId: "1",
        }]);

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "PUT",
            url: "/delivery-networks/current",
            data: {
                connections: [{
                    firstDepartmentId: {value: "1"},
                    secondDepartmentId: {value: "7037389207610229000"},
                }],
            },
            params: undefined,
        });
    });

    it("exports the network as an Excel workbook with the backend filename", async () => {
        const blob = new Blob(["workbook"], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        mockManagerRequest.mockResolvedValue({
            data: blob,
            headers: {"content-disposition": "attachment; filename=\"relations.xlsx\""},
            status: 200,
        });

        const workbook = await DeliveryNetworkService.exportCurrentNetwork();

        expect(workbook).toEqual({blob, filename: "relations.xlsx"});
        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/delivery-networks/current/export",
            responseType: "blob",
        });
    });

    it("imports an Excel workbook and returns the persisted relations", async () => {
        const file = new File(["workbook"], "delivery-network.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        mockManagerRequest.mockResolvedValue({
            data: {
                connections: [{
                    firstDepartmentId: {value: "1"},
                    secondDepartmentId: {value: "7037389207610229000"},
                }],
            },
            status: 200,
        });

        const response = await DeliveryNetworkService.importCurrentNetwork(file);

        expect(response.data).toEqual([{
            sourceDepartmentId: "1",
            targetDepartmentId: "7037389207610229000",
            bidirectional: true,
        }]);
        const request = mockManagerRequest.mock.calls[0][0];
        expect(request).toMatchObject({
            method: "PUT",
            url: "/delivery-networks/current/import",
            headers: {"Content-Type": "multipart/form-data"},
        });
        expect(request.data).toBeInstanceOf(FormData);
        expect(request.data.get("file")).toBe(file);
    });
    it("loads the shipment delivery route by tracking number", async () => {
        mockManagerRequest.mockResolvedValue({
            data: {
                shipmentId: 7037389207610229001,
                trackingNumber: "TN 1/2",
                departments: [
                    {departmentId: {value: "1"}, departmentCode: "KT1", departmentType: "BRANCH"},
                    {departmentId: {value: "2"}, departmentCode: "NCS", departmentType: "SORTING_FACILITY"},
                ],
                distanceInKilometers: null,
            },
            status: 200,
        });

        const response = await DeliveryNetworkService.getShipmentRoute("TN 1/2");

        expect(response.data.departments).toEqual([
            {departmentId: "1", departmentCode: "KT1", departmentType: "BRANCH"},
            {departmentId: "2", departmentCode: "NCS", departmentType: "SORTING_FACILITY"},
        ]);
        expect(response.data.distanceInKilometers).toBeNull();
        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/delivery-networks/current/shipment-routes/TN%201%2F2",
            params: undefined,
            headers: undefined,
        });
    });
    it("downloads the shipment handling plan PDF with the backend file name", async () => {
        const pdf = new Blob(["%PDF-"], {type: "application/pdf"});
        mockManagerRequest.mockResolvedValue({
            data: pdf,
            status: 200,
            headers: {"content-disposition": 'attachment; filename="plan-przeladunkow-TN-1.pdf"'},
        });

        const document = await DeliveryNetworkService.getShipmentRouteDocument("TN-1", "handling-plan");

        expect(document).toEqual({blob: pdf, filename: "plan-przeladunkow-TN-1.pdf"});
        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/delivery-networks/current/shipment-routes/TN-1/documents/handling-plan",
            params: {language: "pl"},
            responseType: "blob",
        });
    });
});
