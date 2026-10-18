import {useMemo, useState} from "react";
import pl from "../../i18n/translate";

export type SortDirection = "asc" | "desc";

export function useTableSort<T, K extends string>(rows: T[], initialKey: K, value: (row: T, key: K) => string | number) {
    const [sortKey, setSortKey] = useState<K>(initialKey);
    const [direction, setDirection] = useState<SortDirection>("asc");

    const sorted = useMemo(() => {
        const factor = direction === "asc" ? 1 : -1;
        return [...rows].sort((left, right) => {
            const leftValue = value(left, sortKey);
            const rightValue = value(right, sortKey);
            const result = typeof leftValue === "number" && typeof rightValue === "number"
                ? leftValue - rightValue
                : String(leftValue).localeCompare(String(rightValue), pl.common.locale, {numeric: true});
            return result * factor;
        });
    }, [direction, rows, sortKey, value]);

    const changeSort = (key: K) => {
        if (key === sortKey) {
            setDirection((current) => current === "asc" ? "desc" : "asc");
            return;
        }
        setSortKey(key);
        setDirection("asc");
    };

    const ariaSort = (key: K) => key === sortKey ? (direction === "asc" ? "ascending" : "descending") : "none";
    const indicator = (key: K) => key === sortKey ? (direction === "asc" ? "▲" : "▼") : "↕";

    return {sorted, changeSort, ariaSort, indicator};
}
