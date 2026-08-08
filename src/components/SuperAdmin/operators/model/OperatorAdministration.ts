export type OperatorAccess = {
    operatorId: number;
    activeSessions: number;
};

export type ReadModelJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type ReadModelRebuildJob = {
    jobId: string;
    readModelType: string;
    status: ReadModelJobStatus | string;
    dateFrom: string;
    dateTo: string;
    operatorId?: number | null;
    createdAt?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    error?: string | null;
};

export type StartReadModelRebuildRequest = {
    dateFrom: string;
    dateTo: string;
};

export const isReadModelJobRunning = (job: ReadModelRebuildJob) => (
    job.status === "PENDING" || job.status === "RUNNING"
);
