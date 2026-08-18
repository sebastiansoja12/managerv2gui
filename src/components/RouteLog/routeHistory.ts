import RouteLogRecord from "./model/RouteLogRecord";

export type RouteHistoryDetail = RouteLogRecord["routeLogRecordDetails"]["routeLogRecordDetailSet"][number];

export type RouteHistoryEntry = {
    key: string;
    sourceLabel?: string;
    detail: RouteHistoryDetail;
};

const detailTime = (detail: RouteHistoryDetail) => new Date(detail.timestamp || "").getTime() || 0;

export const routeHistoryEntries = (routeLog: RouteLogRecord | null | undefined, sourceLabel?: string): RouteHistoryEntry[] =>
    (routeLog?.routeLogRecordDetails?.routeLogRecordDetailSet || []).map((detail) => ({
        key: `${sourceLabel || ""}-${detail.id}-${detail.processType}`,
        sourceLabel,
        detail,
    }));

export const sortRouteHistoryEntries = (entries: RouteHistoryEntry[]) =>
    [...entries].sort((left, right) => detailTime(right.detail) - detailTime(left.detail));
