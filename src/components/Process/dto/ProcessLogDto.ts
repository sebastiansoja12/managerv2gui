export interface DeviceInformationDto {
    deviceId?: string | null;
    departmentCode?: string | null;
    userId?: number | null;
    deviceType?: string | null;
    deviceUserType?: string | null;
    version?: string | null;
}

export interface CommunicationLogDto {
    id?: number | null;
    deviceId?: string | null;
    processType?: string | null;
    serviceType?: string | null;
    createdBy?: number | null;
    updatedBy?: number | null;
    departmentCode?: string | null;
    sourceService?: string | null;
    targetService?: string | null;
    request?: string | null;
    response?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    faultDescription?: string | null;
}

export interface ProcessLogDto {
    processId: string;
    request?: string | null;
    response?: string | null;
    createdAt?: string | null;
    modifiedAt?: string | null;
    status?: string | null;
    faultDescription?: string | null;
    deviceInformation?: DeviceInformationDto | null;
    communicationLogs: CommunicationLogDto[];
}

export interface PageDto<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
}
