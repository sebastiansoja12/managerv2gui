export const mcpModules = [
    "PROFILE", "SHIPMENTS", "PROCESSES", "DEVICES", "DEPARTMENTS", "DELIVERIES", "COURIERS", "CONFIGURATION",
] as const;

export type McpModule = typeof mcpModules[number];
export type McpModuleAccess = "NONE" | "READ" | "WRITE";

export type McpAccessPolicy = {
    enabled: boolean;
    modules: Partial<Record<McpModule, McpModuleAccess>>;
};

export type McpKey = {
    mcpKeyId: {value: string};
    name: string;
    keyPrefix: string;
    status: "ACTIVE" | "REVOKED";
    createdAt: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
};

export type GenerateMcpKeyRequest = {name: string; expiresAt: string | null};
export type GeneratedMcpKey = {mcpKey: McpKey; key: string};

export const mcpKeyStatus = (key: McpKey): "ACTIVE" | "REVOKED" | "EXPIRED" => (
    key.status === "ACTIVE" && key.expiresAt && Date.parse(key.expiresAt) <= Date.now() ? "EXPIRED" : key.status
);
