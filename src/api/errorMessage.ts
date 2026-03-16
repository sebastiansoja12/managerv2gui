import axios from "axios";

type ErrorPayload = {
    message?: unknown;
    error?: unknown;
    details?: unknown;
    errors?: unknown;
};

const stringifyValue = (value: unknown): string => {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(stringifyValue).filter(Boolean).join(", ");
    }

    if (typeof value === "object") {
        const record = value as ErrorPayload;
        return stringifyValue(record.message)
            || stringifyValue(record.error)
            || stringifyValue(record.errors)
            || stringifyValue(record.details);
    }

    return String(value);
};

export const getBackendErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const responseMessage = stringifyValue(error.response?.data);
        if (responseMessage) {
            return responseMessage;
        }

        return fallback;
    }

    if (error instanceof Error) {
        return error.message || fallback;
    }

    return stringifyValue(error) || fallback;
};
