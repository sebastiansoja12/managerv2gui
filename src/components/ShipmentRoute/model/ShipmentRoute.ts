export type ShipmentRouteDepartment = {
    departmentId: string;
    departmentCode: string;
    departmentType: string;
};

export type ShipmentRoute = {
    shipmentId: string;
    trackingNumber: string;
    departments: ShipmentRouteDepartment[];
    distanceInKilometers: number | null;
};
