const mockPost = jest.fn();

jest.mock("../http-common", () => ({
    __esModule: true,
    default: {
        post: (...args: unknown[]) => mockPost(...args),
    },
}));

import ShipmentCollectService, {
    buildCollectRequestEnvelope,
    CollectFaultError,
    parseCollectResponseEnvelope,
} from "./ShipmentCollectService";
import {CollectRequest} from "../components/ShipmentScanner/model/ShipmentCollect";

const collectRequest: CollectRequest = {
    deviceInformation: {
        version: "1.3.0",
        deviceId: "SC:1",
        responsibleUser: "courier",
        departmentCode: "KT1",
        pairKey: "pair-key",
        deviceUserType: "SUPPLIER",
        deviceType: "SCANNER",
    },
    trackingNumbers: ["TRK-001", "A&B<1>"],
};

const collectResponseEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Body>
        <ns2:CollectResponse xmlns:ns2="http://warehouse.com/logistics/terminal">
            <ns2:ProcessId>6f0f3a5e-2d0c-4b8e-9a39-2f7d0d3c1a11</ns2:ProcessId>
            <ns2:Success>false</ns2:Success>
            <ns2:CollectResponseDetails>
                <ns2:CollectResponseDetail>
                    <ns2:TrackingNumber>TRK-001</ns2:TrackingNumber>
                    <ns2:ShipmentID>100</ns2:ShipmentID>
                    <ns2:Success>true</ns2:Success>
                </ns2:CollectResponseDetail>
                <ns2:CollectResponseDetail>
                    <ns2:TrackingNumber>TRK-002</ns2:TrackingNumber>
                    <ns2:Success>false</ns2:Success>
                    <ns2:ErrorMessage>Shipment was not found</ns2:ErrorMessage>
                </ns2:CollectResponseDetail>
            </ns2:CollectResponseDetails>
        </ns2:CollectResponse>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

const faultEnvelope = `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Body>
        <SOAP-ENV:Fault>
            <faultcode>SOAP-ENV:Server</faultcode>
            <faultstring xml:lang="en">Invalid device pair key</faultstring>
        </SOAP-ENV:Fault>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

describe("ShipmentCollectService", () => {
    beforeEach(() => mockPost.mockReset());

    it("builds a SOAP CollectRequest with device information and escaped tracking numbers", () => {
        const document = new DOMParser().parseFromString(buildCollectRequestEnvelope(collectRequest), "text/xml");
        const namespace = "http://warehouse.com/logistics/terminal";

        const collect = document.getElementsByTagNameNS(namespace, "CollectRequest")[0];
        const trackingNumbers = Array.from(collect.getElementsByTagNameNS(namespace, "TrackingNumber"))
            .map((element) => element.textContent);

        expect(collect.getElementsByTagNameNS(namespace, "PairKey")[0].textContent).toBe("pair-key");
        expect(collect.getElementsByTagNameNS(namespace, "DeviceType")[0].textContent).toBe("SCANNER");
        expect(trackingNumbers).toEqual(["TRK-001", "A&B<1>"]);
    });

    it("parses process id, overall status and per-shipment results", () => {
        const response = parseCollectResponseEnvelope(collectResponseEnvelope);

        expect(response).toEqual({
            processId: "6f0f3a5e-2d0c-4b8e-9a39-2f7d0d3c1a11",
            success: false,
            details: [
                {trackingNumber: "TRK-001", shipmentId: "100", success: true, errorMessage: null},
                {trackingNumber: "TRK-002", shipmentId: null, success: false, errorMessage: "Shipment was not found"},
            ],
        });
    });

    it("posts the envelope to the SOAP endpoint as XML", async () => {
        mockPost.mockResolvedValue({data: collectResponseEnvelope, status: 200});

        const response = await ShipmentCollectService.collect(collectRequest);

        expect(mockPost).toHaveBeenCalledWith("/ws", expect.stringContaining("<CollectRequest"), expect.objectContaining({
            headers: expect.objectContaining({"Content-Type": "text/xml; charset=utf-8"}),
            responseType: "text",
        }));
        expect(mockPost.mock.calls[0][2].headers).not.toHaveProperty("SOAPAction");
        expect(response.details).toHaveLength(2);
    });

    it("turns a SOAP fault into a readable error", async () => {
        mockPost.mockRejectedValue({isAxiosError: true, response: {status: 500, data: faultEnvelope}});

        await expect(ShipmentCollectService.collect(collectRequest))
            .rejects.toEqual(new CollectFaultError("Invalid device pair key"));
    });
});
