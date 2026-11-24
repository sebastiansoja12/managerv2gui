export type UnloadShipment = {
    shipmentId: string;
    trackingNumber: string | null;
};

export type UnloadScanResult =
    | {state: "invalidCode"}
    | {state: "notOnPallet"; code: string}
    | {state: "duplicate"; shipment: UnloadShipment}
    | {state: "scanned"; shipment: UnloadShipment};

export const normalizeUnloadCode = (value: string) => value.trim().toUpperCase();

// A scanner reads the tracking number; typing the shipment ID still works for a damaged label.
export const resolveUnloadScan = (
    rawCode: string,
    shipments: UnloadShipment[],
    scannedShipmentIds: ReadonlySet<string>,
): UnloadScanResult => {
    const code = normalizeUnloadCode(rawCode);
    if (!code) {
        return {state: "invalidCode"};
    }
    const shipment = shipments.find((candidate) => candidate.shipmentId === code
        || normalizeUnloadCode(candidate.trackingNumber || "") === code);
    if (!shipment) {
        return {state: "notOnPallet", code};
    }
    return scannedShipmentIds.has(shipment.shipmentId) ? {state: "duplicate", shipment} : {state: "scanned", shipment};
};

export const missingShipments = (shipments: UnloadShipment[], scannedShipmentIds: ReadonlySet<string>) =>
    shipments.filter((shipment) => !scannedShipmentIds.has(shipment.shipmentId));
