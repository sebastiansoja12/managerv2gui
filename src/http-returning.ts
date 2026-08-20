import axios from "axios";
import JSONBig from "json-bigint";
import {configureAuthenticatedClient} from "./auth/configureAuthenticatedClient";

const jsonBig = JSONBig({storeAsString: true});
const gatewayUrl = process.env.REACT_APP_GATEWAY_URL?.replace(/\/$/, "");
const returningBaseUrl = gatewayUrl
    ? `${gatewayUrl}/returning-track-manager`
    : process.env.REACT_APP_RETURNING_TRACK_MANAGER_URL;

const normalizeReturnIdentifiers = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(normalizeReturnIdentifiers);
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    const record = value as Record<string, unknown>;
    ["returnPackageId", "shipmentId", "assignedTo", "processedBy"].forEach((key) => {
        const identifier = record[key];
        if (identifier && typeof identifier === "object" && "value" in identifier) {
            const identifierRecord = identifier as Record<string, unknown>;
            if (identifierRecord.value !== null && identifierRecord.value !== undefined) {
                identifierRecord.value = String(identifierRecord.value);
            }
        }
    });

    Object.keys(record).forEach((key) => {
        record[key] = normalizeReturnIdentifiers(record[key]);
    });

    return record;
};

const parseJsonWithBigIntegers = (data: string) => {
    if (!data) {
        return data;
    }

    try {
        return normalizeReturnIdentifiers(jsonBig.parse(data));
    } catch (error) {
        return data;
    }
};

const http = axios.create({
    baseURL: returningBaseUrl,
    headers: {
        "Content-type": "application/json",
    },
    transformResponse: [parseJsonWithBigIntegers],
    withCredentials: true,
});

export default configureAuthenticatedClient(http);
