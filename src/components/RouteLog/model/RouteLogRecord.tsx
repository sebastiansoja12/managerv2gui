export default interface RouteLogRecord {
    processId: { value: string };
    parcelId?: { value: string };
    shipmentId?: { value: string };
    routeLogRecordDetails: {
        routeLogRecordDetailSet: Array<{
            id: number | string;
            zebraId?: number | string;
            terminalId?: { value: string | number };
            version: string;
            username: string;
            supplierCode?: string;
            depotCode: string;
            departmentCode?: string;
            parcelStatus: string;
            shipmentStatus?: string;
            description: string;
            timestamp: string;
            processType: string;
            request: string;
        }>;
    };
    returnCode: { value: string | null };
    faultDescription: { value: string | null };
}
