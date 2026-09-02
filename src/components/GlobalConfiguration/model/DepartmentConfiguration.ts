import {useEffect, useState} from "react";

export type DepartmentConfiguration = {
    autoAssignDeliveryAreas: boolean;
    autoConnectDepartments: boolean;
    preventDepartmentDeletion: boolean;
    preventDepartmentArchiving: boolean;
};

export const defaultDepartmentConfiguration: DepartmentConfiguration = {
    autoAssignDeliveryAreas: false,
    autoConnectDepartments: false,
    preventDepartmentDeletion: false,
    preventDepartmentArchiving: false,
};

const eventName = "manager:department-configuration-changed";

export const departmentConfigurationStorageKey = (operatorId?: number) => (
    `manager.department-configuration.v1.${operatorId ?? "unknown"}`
);

export const readDepartmentConfiguration = (operatorId?: number): DepartmentConfiguration => {
    try {
        const raw = window.localStorage.getItem(departmentConfigurationStorageKey(operatorId));
        if (!raw) return {...defaultDepartmentConfiguration};
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return {...defaultDepartmentConfiguration};
        const saved = parsed as Partial<DepartmentConfiguration>;
        return {
            autoAssignDeliveryAreas: saved.autoAssignDeliveryAreas === true,
            autoConnectDepartments: saved.autoConnectDepartments === true,
            preventDepartmentDeletion: saved.preventDepartmentDeletion === true,
            preventDepartmentArchiving: saved.preventDepartmentArchiving === true,
        };
    } catch {
        return {...defaultDepartmentConfiguration};
    }
};

export const writeDepartmentConfiguration = (operatorId: number | undefined, configuration: DepartmentConfiguration) => {
    window.localStorage.setItem(departmentConfigurationStorageKey(operatorId), JSON.stringify(configuration));
    window.dispatchEvent(new Event(eventName));
};

export const useDepartmentConfiguration = (operatorId?: number) => {
    const [configuration, setConfiguration] = useState(() => readDepartmentConfiguration(operatorId));
    useEffect(() => {
        const refresh = () => setConfiguration(readDepartmentConfiguration(operatorId));
        refresh();
        window.addEventListener(eventName, refresh);
        window.addEventListener("storage", refresh);
        return () => {
            window.removeEventListener(eventName, refresh);
            window.removeEventListener("storage", refresh);
        };
    }, [operatorId]);
    return configuration;
};
