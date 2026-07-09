export type MicroserviceStatusState = "checking" | "online" | "offline" | "unknown";

export type MicroserviceDefinition = {
    baseUrl?: string;
    environmentVariable: string;
    id: string;
    name: string;
    healthPaths: string[];
};

export type MicroserviceStatusResult = MicroserviceDefinition & {
    checkedAt: string;
    latencyMs?: number;
    message: string;
    state: MicroserviceStatusState;
    statusCode?: number;
};
