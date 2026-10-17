export type OnboardingStepType = "DEPARTMENT" | "SUPERADMIN" | "GEOCODING" | "COURIER" | "TEST_SHIPMENT";

export type OperatorOnboarding = {
    operatorId: number;
    completedSteps: number;
    totalSteps: number;
    complete: boolean;
    steps: Array<{
        type: OnboardingStepType;
        completed: boolean;
        count: number;
    }>;
};

export type OperatorDevice = {
    deviceId: string;
    deviceType?: string | null;
    status?: string | null;
    userId?: number | null;
    departmentCode?: string | null;
    version?: string | null;
    lastUpdate?: string | null;
    paired: boolean;
    pairKeyExpiresAt?: string | null;
    lastLoginAt?: string | null;
};

export type OperatorApiKey = {
    userId: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
    departmentCode?: string | null;
};

export type OperatorDataErasure = {
    operatorId: number;
    requestedBy: string;
    executedAt: string;
    usersAnonymized: number;
    couriersAnonymized: number;
    devicesRetired: number;
};

export const isPairKeyActive = (device: OperatorDevice, now = Date.now()) => (
    device.paired && Boolean(device.pairKeyExpiresAt) && new Date(device.pairKeyExpiresAt as string).getTime() > now
);
