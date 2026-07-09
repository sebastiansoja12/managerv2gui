import axios from "axios";
import JSONBig from "json-bigint";
import {configureAuthenticatedClient} from "./auth/configureAuthenticatedClient";

const jsonBig = JSONBig({storeAsString: true});

const normalizeShipmentIdentifiers = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(normalizeShipmentIdentifiers);
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    const record = value as Record<string, unknown>;
    ["shipmentId", "shipmentRelatedId", "parcelId", "departmentId"].forEach((key) => {
        const identifier = record[key];
        if (identifier && typeof identifier === "object" && "value" in identifier) {
            const identifierRecord = identifier as Record<string, unknown>;
            if (identifierRecord.value !== null && identifierRecord.value !== undefined) {
                identifierRecord.value = String(identifierRecord.value);
            }
        }
    });

    Object.keys(record).forEach((key) => {
        record[key] = normalizeShipmentIdentifiers(record[key]);
    });

    return record;
};

const parseJsonWithBigIntegers = (data: string) => {
    if (!data) {
        return data;
    }

    try {
        return normalizeShipmentIdentifiers(jsonBig.parse(data));
    } catch (error) {
        return data;
    }
};

const http = axios.create({
    baseURL: `${process.env.REACT_APP_SERVER_URL}`,
    headers: {
        "Content-type": "application/json"
    },
    transformResponse: [parseJsonWithBigIntegers],
    withCredentials: true,
});

export default configureAuthenticatedClient(http);
