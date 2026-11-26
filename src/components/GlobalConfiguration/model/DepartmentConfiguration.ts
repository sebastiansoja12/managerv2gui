import {useEffect, useState} from "react";
import OperatorConfigurationService from "../../../hooks/OperatorConfigurationService";

export type DeliveryAreaMode = "COUNTRY_PARTITION" | "RADIUS";

export type UncoveredPostalCodePolicy = "WARN" | "ASSIGN_NEAREST" | "BLOCK";

export type DepartmentWorkTransferMode = "MANUAL" | "AUTOMATIC";

export type DepartmentDeliveryAreaPolicy = {
    deliveryAreaMode: DeliveryAreaMode;
    maxDeliveryRadiusKm: number;
    allowManualDeliveryAreaEdit: boolean;
    recalculateAreasOnStatusChange: boolean;
    uncoveredPostalCodePolicy: UncoveredPostalCodePolicy;
};

export type DepartmentConnectionPolicy = {
    sortingCenterConnectionCount: number;
    maxAutoConnectionDistanceKm: number;
    requireSortingConnectionForActivation: boolean;
    bidirectionalConnectionsByDefault: boolean;
};

export type DepartmentLifecyclePolicy = {
    requireStatusChangeReason: boolean;
    blockDeactivationWithActiveWork: boolean;
    workTransferOnDeactivation: DepartmentWorkTransferMode;
    autoArchiveInactiveAfterDays: number;
};

export type DepartmentCapacityPolicy = {
    defaultDailyCapacity: number;
    capacityWarningThresholdPercent: number;
    redirectOverflowToNeighbour: boolean;
    maxCouriersPerDepartment: number;
};

export type CourierAssignmentDateField = "DESTINATION_ARRIVAL" | "CREATION";

export type CourierAssignmentWindowType = "TIME_OF_DAY" | "PREVIOUS_OPERATIONAL_DAY" | "ROLLING";

export type DepartmentCourierAssignmentPolicy = {
    enabled: boolean;
    dateField: CourierAssignmentDateField;
    windowType: CourierAssignmentWindowType;
    windowStart: string;
    windowEnd: string;
    timeZone: string;
    processingDelayMinutes: number;
    overlapMinutes: number;
    maxWindowHours: number;
    lookbackDays: number;
    batchSize: number;
};

export type DepartmentPolicies = {
    deliveryAreaPolicy: DepartmentDeliveryAreaPolicy;
    connectionPolicy: DepartmentConnectionPolicy;
    lifecyclePolicy: DepartmentLifecyclePolicy;
    capacityPolicy: DepartmentCapacityPolicy;
    courierAssignmentPolicy: DepartmentCourierAssignmentPolicy;
};

export type DepartmentPolicyKey = keyof DepartmentPolicies;

export type DepartmentConfiguration = {
    autoAssignDeliveryAreas: boolean;
    autoConnectDepartments: boolean;
    preventDepartmentDeletion: boolean;
    preventDepartmentArchiving: boolean;
} & Partial<DepartmentPolicies>;

export type DepartmentSettingKey = "autoAssignDeliveryAreas" | "autoConnectDepartments"
    | "preventDepartmentDeletion" | "preventDepartmentArchiving";

type Nullable<T> = {[Key in keyof T]?: T[Key] | null};

export type DepartmentConfigurationOverride = Nullable<Record<DepartmentSettingKey, boolean>> & {
    [Policy in DepartmentPolicyKey]?: Nullable<DepartmentPolicies[Policy]> | null;
};

export const defaultDepartmentPolicies: DepartmentPolicies = {
    deliveryAreaPolicy: {
        deliveryAreaMode: "COUNTRY_PARTITION",
        maxDeliveryRadiusKm: 50,
        allowManualDeliveryAreaEdit: true,
        recalculateAreasOnStatusChange: false,
        uncoveredPostalCodePolicy: "WARN",
    },
    connectionPolicy: {
        sortingCenterConnectionCount: 1,
        maxAutoConnectionDistanceKm: 300,
        requireSortingConnectionForActivation: false,
        bidirectionalConnectionsByDefault: true,
    },
    lifecyclePolicy: {
        requireStatusChangeReason: false,
        blockDeactivationWithActiveWork: true,
        workTransferOnDeactivation: "MANUAL",
        autoArchiveInactiveAfterDays: 0,
    },
    capacityPolicy: {
        defaultDailyCapacity: 1000,
        capacityWarningThresholdPercent: 85,
        redirectOverflowToNeighbour: false,
        maxCouriersPerDepartment: 0,
    },
    courierAssignmentPolicy: {
        enabled: false,
        dateField: "DESTINATION_ARRIVAL",
        windowType: "ROLLING",
        windowStart: "00:00",
        windowEnd: "00:00",
        timeZone: "",
        processingDelayMinutes: 5,
        overlapMinutes: 15,
        maxWindowHours: 24,
        lookbackDays: 3,
        batchSize: 500,
    },
};

export const defaultDepartmentConfiguration: DepartmentConfiguration = {
    autoAssignDeliveryAreas: false,
    autoConnectDepartments: false,
    preventDepartmentDeletion: false,
    preventDepartmentArchiving: false,
    ...defaultDepartmentPolicies,
};

const eventName = "manager:department-configuration-changed";

const toTimeOfDay = (value: unknown, fallback: string) => (
    typeof value === "string" && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : fallback
);

const normalizeCourierAssignmentPolicy = (
    saved?: Partial<Record<keyof DepartmentCourierAssignmentPolicy, unknown>> | null,
): DepartmentCourierAssignmentPolicy => {
    const defaults = defaultDepartmentPolicies.courierAssignmentPolicy;
    const policy = {...defaults, ...saved} as DepartmentCourierAssignmentPolicy;
    return {
        ...policy,
        windowStart: toTimeOfDay(saved?.windowStart, defaults.windowStart),
        windowEnd: toTimeOfDay(saved?.windowEnd, defaults.windowEnd),
        timeZone: typeof saved?.timeZone === "string" ? saved.timeZone : "",
    };
};

export const toDepartmentOverridePayload = (
    override: DepartmentConfigurationOverride,
    inherited: DepartmentConfiguration,
): DepartmentConfigurationOverride => {
    if (override.courierAssignmentPolicy === undefined) {
        return override;
    }
    const overridden = Object.entries(override.courierAssignmentPolicy || {})
        .filter(([, value]) => value !== null && value !== undefined);
    return {
        ...override,
        courierAssignmentPolicy: overridden.length === 0 ? null : {
            ...normalizeCourierAssignmentPolicy(inherited.courierAssignmentPolicy),
            ...Object.fromEntries(overridden),
        },
    };
};

const normalizeDepartmentConfiguration = (saved?: Partial<DepartmentConfiguration> | null): DepartmentConfiguration => (
    {
        autoAssignDeliveryAreas: saved?.autoAssignDeliveryAreas === true,
        autoConnectDepartments: saved?.autoConnectDepartments === true,
        preventDepartmentDeletion: saved?.preventDepartmentDeletion === true,
        preventDepartmentArchiving: saved?.preventDepartmentArchiving === true,
        deliveryAreaPolicy: {...defaultDepartmentPolicies.deliveryAreaPolicy, ...saved?.deliveryAreaPolicy},
        connectionPolicy: {...defaultDepartmentPolicies.connectionPolicy, ...saved?.connectionPolicy},
        lifecyclePolicy: {...defaultDepartmentPolicies.lifecyclePolicy, ...saved?.lifecyclePolicy},
        capacityPolicy: {...defaultDepartmentPolicies.capacityPolicy, ...saved?.capacityPolicy},
        courierAssignmentPolicy: normalizeCourierAssignmentPolicy(saved?.courierAssignmentPolicy),
    }
);

export const readDepartmentConfiguration = async (departmentId?: number | string): Promise<DepartmentConfiguration> => (
    normalizeDepartmentConfiguration((departmentId === undefined || departmentId === null
        ? await OperatorConfigurationService.getCurrentDepartmentConfiguration()
        : await OperatorConfigurationService.getDepartmentConfiguration(departmentId)).data)
);

const normalizeDepartmentConfigurationOverride = (
    saved?: DepartmentConfigurationOverride | null,
): DepartmentConfigurationOverride => {
    if (!saved?.courierAssignmentPolicy) {
        return saved || {};
    }
    return {
        ...saved,
        courierAssignmentPolicy: normalizeCourierAssignmentPolicy(saved.courierAssignmentPolicy),
    };
};

export const readDepartmentConfigurationOverride = async (
    departmentId: number | string,
): Promise<DepartmentConfigurationOverride> => (
    normalizeDepartmentConfigurationOverride(
        (await OperatorConfigurationService.getDepartmentConfigurationOverride(departmentId)).data)
);

export const writeDepartmentConfigurationOverride = async (
    departmentId: number | string,
    override: DepartmentConfigurationOverride,
) => {
    const saved = (await OperatorConfigurationService.updateDepartmentConfigurationOverride(departmentId, override)).data;
    window.dispatchEvent(new Event(eventName));
    return normalizeDepartmentConfigurationOverride(saved);
};

export const writeDepartmentConfiguration = async (configuration: DepartmentConfiguration) => {
    const saved = (await OperatorConfigurationService.updateCurrentDepartmentConfiguration(configuration)).data;
    window.dispatchEvent(new Event(eventName));
    return saved;
};

export const useDepartmentConfiguration = (operatorId?: number, departmentId?: number | string | null) => {
    const [configuration, setConfiguration] = useState<DepartmentConfiguration>(defaultDepartmentConfiguration);
    useEffect(() => {
        let active = true;
        const refresh = () => {
            readDepartmentConfiguration(departmentId ?? undefined)
                .then((loaded) => {
                    if (active) setConfiguration(loaded);
                })
                .catch(() => {
                    if (active) setConfiguration(defaultDepartmentConfiguration);
                });
        };
        refresh();
        window.addEventListener(eventName, refresh);
        return () => {
            active = false;
            window.removeEventListener(eventName, refresh);
        };
    }, [departmentId, operatorId]);
    return configuration;
};
