export const deliveryTargetPath = (target: {targetType: string; targetId: string; shipmentId: string | null}) => {
    if (target.shipmentId) {
        return `/shipments/${encodeURIComponent(target.shipmentId)}/edit`;
    }
    return target.targetType === "PALLET" ? `/pallets/by-id/${encodeURIComponent(target.targetId)}` : null;
};
