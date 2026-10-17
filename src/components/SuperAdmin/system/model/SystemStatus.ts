export type MaintenanceMode = {
    enabled: boolean;
    message?: string | null;
    updatedBy?: string | null;
    updatedAt?: string | null;
};

export type ChangeMaintenanceModeRequest = {
    enabled: boolean;
    message: string;
};

export type SystemStatus = {
    runtime: {
        applicationName: string;
        version: string;
        javaVersion: string;
        startedAt: string;
        uptimeSeconds: number;
        activeProfiles: string[];
        usedMemoryMegabytes: number;
        maxMemoryMegabytes: number;
        availableProcessors: number;
    };
    database: {
        available: boolean;
        product?: string | null;
        version?: string | null;
        responseTimeMillis: number;
    };
    migrations: {
        executedChangeSets: number;
        lastChangeSetId?: string | null;
        lastAuthor?: string | null;
        lastExecutedAt?: string | null;
    };
    maintenance: MaintenanceMode;
};

export const formatUptime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const days = Math.floor(safeSeconds / 86400);
    const hours = Math.floor((safeSeconds % 86400) / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};
