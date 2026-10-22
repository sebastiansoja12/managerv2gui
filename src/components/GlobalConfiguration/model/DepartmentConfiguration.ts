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

export type DepartmentPolicies = {
    deliveryAreaPolicy: DepartmentDeliveryAreaPolicy;
    connectionPolicy: DepartmentConnectionPolicy;
    lifecyclePolicy: DepartmentLifecyclePolicy;
    capacityPolicy: DepartmentCapacityPolicy;
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
};

export const defaultDepartmentConfiguration: DepartmentConfiguration = {
    autoAssignDeliveryAreas: false,
    autoConnectDepartments: false,
    preventDepartmentDeletion: false,
    preventDepartmentArchiving: false,
    ...defaultDepartmentPolicies,
};

const eventName = "manager:department-configuration-changed";

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
    }
);

export const readDepartmentConfiguration = async (departmentId?: number | string): Promise<DepartmentConfiguration> => (
    normalizeDepartmentConfiguration((departmentId === undefined || departmentId === null
        ? await OperatorConfigurationService.getCurrentDepartmentConfiguration()
        : await OperatorConfigurationService.getDepartmentConfiguration(departmentId)).data)
);

export const readDepartmentConfigurationOverride = async (
    departmentId: number | string,
): Promise<DepartmentConfigurationOverride> => (
    (await OperatorConfigurationService.getDepartmentConfigurationOverride(departmentId)).data || {}
);

export const writeDepartmentConfigurationOverride = async (
    departmentId: number | string,
    override: DepartmentConfigurationOverride,
) => {
    const saved = (await OperatorConfigurationService.updateDepartmentConfigurationOverride(departmentId, override)).data;
    window.dispatchEvent(new Event(eventName));
    return saved;
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
