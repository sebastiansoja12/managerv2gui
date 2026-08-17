import {PendingShipment} from "./model/ShipmentCollect";

const STORAGE_PREFIX = "manager.shipmentCollect.";

export type ShipmentCollectSession = {
    pendingShipments: PendingShipment[];
    selectedDeviceKey: string;
};

const emptySession: ShipmentCollectSession = {pendingShipments: [], selectedDeviceKey: ""};

export const readShipmentCollectSession = (userId: string | number): ShipmentCollectSession => {
    try {
        const storedValue = window.sessionStorage.getItem(`${STORAGE_PREFIX}${userId}`);
        if (!storedValue) {
            return emptySession;
        }
        const parsed = JSON.parse(storedValue) as Partial<ShipmentCollectSession>;
        return {
            pendingShipments: Array.isArray(parsed.pendingShipments) ? parsed.pendingShipments : [],
            selectedDeviceKey: parsed.selectedDeviceKey || "",
        };
    } catch (error) {
        return emptySession;
    }
};

export const saveShipmentCollectSession = (userId: string | number, session: ShipmentCollectSession) => {
    try {
        window.sessionStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(session));
    } catch (error) {
        // Storage can be unavailable; the list then lives only until the view is closed.
    }
};
