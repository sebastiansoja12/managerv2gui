export default interface RouteLogRecord {
    processId: { value: string };
    parcelId: { value: number };
    routeLogRecordDetails: {
        routeLogRecordDetailSet: Array<{
            id: number;
            zebraId: number;
            version: string;
            username: string;
            depotCode: string;
            parcelStatus: string;
            description: string;
            timestamp: string;
            processType: string;
            request: string;
        }>;
    };
    returnCode: { value: string | null };
    faultDescription: { value: string | null };
}