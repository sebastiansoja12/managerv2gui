import {AxiosError} from "axios";
import http from "../http-common";
import {CollectRequest, CollectResponse, CollectResponseDetail} from "../components/ShipmentScanner/model/ShipmentCollect";

const TERMINAL_NAMESPACE = "http://warehouse.com/logistics/terminal";
const SOAP_ENVELOPE_NAMESPACE = "http://schemas.xmlsoap.org/soap/envelope/";

export class CollectFaultError extends Error {
}

const escapeXml = (value: string) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const xmlElement = (name: string, value: string) => `<${name}>${escapeXml(value)}</${name}>`;

export const buildCollectRequestEnvelope = (request: CollectRequest) => {
    const device = request.deviceInformation;
    const collectDetails = request.trackingNumbers
        .map((trackingNumber) => `<CollectDetail>${xmlElement("TrackingNumber", trackingNumber)}</CollectDetail>`)
        .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>`
        + `<soapenv:Envelope xmlns:soapenv="${SOAP_ENVELOPE_NAMESPACE}">`
        + `<soapenv:Body>`
        + `<CollectRequest xmlns="${TERMINAL_NAMESPACE}">`
        + `<DeviceInformation>`
        + xmlElement("Version", device.version)
        + xmlElement("DeviceID", device.deviceId)
        + xmlElement("ResponsibleUser", device.responsibleUser)
        + xmlElement("DepartmentCode", device.departmentCode)
        + xmlElement("PairKey", device.pairKey)
        + xmlElement("DeviceUserType", device.deviceUserType)
        + xmlElement("DeviceType", device.deviceType)
        + `</DeviceInformation>`
        + `<CollectDetails>${collectDetails}</CollectDetails>`
        + `</CollectRequest>`
        + `</soapenv:Body>`
        + `</soapenv:Envelope>`;
};

const childText = (parent: Element, localName: string): string | null => {
    const child = Array.from(parent.children).find((element) => element.localName === localName);
    const text = child?.textContent?.trim();
    return text ? text : null;
};

const parseXml = (xml: string) => new DOMParser().parseFromString(xml, "text/xml");

const findFaultMessage = (document: Document): string | null => {
    const fault = document.getElementsByTagNameNS(SOAP_ENVELOPE_NAMESPACE, "Fault")[0];
    if (!fault) {
        return null;
    }
    return childText(fault, "faultstring") || fault.textContent?.trim() || null;
};

export const parseCollectResponseEnvelope = (xml: string): CollectResponse => {
    const document = parseXml(xml);
    const faultMessage = findFaultMessage(document);
    if (faultMessage) {
        throw new CollectFaultError(faultMessage);
    }

    const collectResponse = document.getElementsByTagNameNS(TERMINAL_NAMESPACE, "CollectResponse")[0];
    if (!collectResponse) {
        throw new CollectFaultError("Missing CollectResponse");
    }

    const details: CollectResponseDetail[] = Array.from(
        collectResponse.getElementsByTagNameNS(TERMINAL_NAMESPACE, "CollectResponseDetail"))
        .map((detail) => ({
            trackingNumber: childText(detail, "TrackingNumber") || "",
            shipmentId: childText(detail, "ShipmentID"),
            success: childText(detail, "Success") === "true",
            errorMessage: childText(detail, "ErrorMessage"),
        }));

    return {
        processId: childText(collectResponse, "ProcessId") || "",
        success: childText(collectResponse, "Success") === "true",
        details,
    };
};

const resolveErrorMessage = (error: unknown): string | null => {
    const responseBody = (error as AxiosError<string>)?.response?.data;
    if (typeof responseBody !== "string" || !responseBody.trim().startsWith("<")) {
        return null;
    }
    return findFaultMessage(parseXml(responseBody));
};

const collect = async (request: CollectRequest): Promise<CollectResponse> => {
    try {
        const response = await http.post<string>("/ws", buildCollectRequestEnvelope(request), {
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
            },
            responseType: "text",
            transformResponse: [(data) => data],
        });
        return parseCollectResponseEnvelope(response.data);
    } catch (error) {
        if (error instanceof CollectFaultError) {
            throw error;
        }
        const faultMessage = resolveErrorMessage(error);
        if (faultMessage) {
            throw new CollectFaultError(faultMessage);
        }
        throw error;
    }
};

const ShipmentCollectService = {
    collect,
};

export default ShipmentCollectService;
