export type GeoPointDto = {
    latitude: number;
    longitude: number;
};

export type DeliveryAreaSource = "MANUAL" | "AUTOMATIC";

export type DeliveryAreaIdentifier = number | string;

export type DeliveryAreaDto = {
    deliveryAreaId: DeliveryAreaIdentifier;
    departmentId: DeliveryAreaIdentifier;
    name: string;
    source: DeliveryAreaSource;
    points: GeoPointDto[];
    updatedAt: string;
};

export type DeliveryAreaRequestDto = {
    deliveryAreaId: string | null;
    name: string;
    points: GeoPointDto[];
};

export type DepartmentDeliveryAreasDto = {
    departmentId: DeliveryAreaIdentifier;
    departmentCode: string;
    areas: DeliveryAreaDto[];
};
