export type PickupPointIdDto = {
    value: string;
};

export type DepartmentIdDto = {
    value: string;
};

export type PickupPointType = "SERVICE_POINT" | "PARCEL_LOCKER";

export type PickupPointStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";

export type PickupPointCapability = "DROP_OFF" | "COLLECTION";

export type PickupPointShipmentSize = "TINY" | "SMALL" | "MEDIUM" | "AVERAGE" | "BIG";

export type DayAvailability = "CLOSED" | "ALL_DAY" | "INTERVALS";

export type OpeningScheduleMode = "ALWAYS_OPEN" | "WEEKLY";

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export type PickupPointAddress = {
    countryCode: string;
    postalCode: string;
    city: string;
    street: string;
    buildingNumber: string;
    unitNumber?: string | null;
};

export type GeoCoordinates = {
    latitude: number;
    longitude: number;
};

export type PickupPointDepartment = {
    departmentId: DepartmentIdDto;
    code: string;
    name?: string;
};

export type PickupPointAvailability = {
    selectable: boolean;
    reasonCodes: string[];
    isOpenNow: boolean | null;
};

export type OpeningInterval = {
    startMinute: number;
    endMinute: number;
};

export type OpeningDay = {
    dayOfWeek: Weekday;
    availability: DayAvailability;
    intervals: OpeningInterval[];
};

export type OpeningScheduleException = {
    date: string;
    availability: DayAvailability;
    intervals: OpeningInterval[];
};

export type OpeningSchedule = {
    timeZone: string;
    mode: OpeningScheduleMode;
    days: OpeningDay[];
    exceptions: OpeningScheduleException[];
};

export type PickupPointServicePolicy = {
    allowedShipmentSizes: PickupPointShipmentSize[];
    acceptsDangerousGoods: boolean;
};

export type PickupPointContact = {
    telephoneNumber?: string | null;
    email?: string | null;
};

export type ExternalPointReference = {
    networkCode: string;
    pointCode: string;
};

export type PickupPointSummary = {
    pickupPointId: PickupPointIdDto;
    code: string;
    name: string;
    type: PickupPointType;
    status: PickupPointStatus;
    capabilities: PickupPointCapability[];
    address?: PickupPointAddress | null;
    coordinates?: GeoCoordinates | null;
    department?: PickupPointDepartment | null;
    availability: PickupPointAvailability;
    version: number;
};

export type PickupPointDetails = PickupPointSummary & {
    contact?: PickupPointContact | null;
    accessInstructions?: string | null;
    openingSchedule?: OpeningSchedule | null;
    servicePolicy?: PickupPointServicePolicy | null;
    externalReference?: ExternalPointReference | null;
    statusReason?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PickupPointPage = {
    items: PickupPointSummary[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    evaluatedAt: string;
};

export type PickupPointSearchQuery = {
    query?: string;
    type?: PickupPointType;
    status?: PickupPointStatus;
    capability?: PickupPointCapability;
    departmentId?: string;
    countryCode?: string;
    city?: string;
    networkCode?: string;
    bbox?: string;
    page?: number;
    size?: number;
    sort?: string;
};

export type EligiblePickupPointQuery = {
    capability: PickupPointCapability;
    type: PickupPointType;
    countryCode: string;
    shipmentSize: PickupPointShipmentSize;
    hasDangerousGoods: boolean;
    query?: string;
    city?: string;
    bbox?: string;
    page?: number;
    size?: number;
};

export type PickupPointConfiguration = {
    name: string;
    type: PickupPointType;
    capabilities: PickupPointCapability[];
    address?: PickupPointAddress | null;
    departmentId?: DepartmentIdDto | null;
    contact?: PickupPointContact | null;
    accessInstructions?: string | null;
    openingSchedule?: OpeningSchedule | null;
    servicePolicy?: PickupPointServicePolicy | null;
    externalReference?: ExternalPointReference | null;
};

export type PickupPointCreateRequest = PickupPointConfiguration & {
    code: string;
};

export type PickupPointUpdateRequest = PickupPointConfiguration;

export type PickupPointStatusRequest = {
    status: "ACTIVE" | "SUSPENDED" | "CLOSED";
    reason?: string | null;
};
