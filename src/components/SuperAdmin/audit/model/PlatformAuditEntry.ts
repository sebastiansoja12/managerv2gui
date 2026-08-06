export type PlatformAuditEntry = {
    id: number;
    platformOwnerId: number;
    platformOwnerUsername: string;
    operatorId?: number | null;
    impersonatedUserId?: number | null;
    impersonation: boolean;
    httpMethod: string;
    path: string;
    statusCode: number;
    success: boolean;
    createdAt: string;
};
