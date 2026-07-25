export type ValueObject<T = string | number | null> = T | { value?: T } | null | undefined;

export const valueObjectValue = (value: ValueObject): string => {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "object") {
        const nestedValue = value.value;
        return nestedValue === null || nestedValue === undefined ? "" : String(nestedValue);
    }

    return String(value);
};
