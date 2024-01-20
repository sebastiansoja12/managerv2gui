import React, {useEffect, useState} from 'react';
import RouteLogRecordDto from "./dto/RouteLogRecordDto";
import RouteLogService from "../../hooks/RouteLogService";
import RouteLogRecordDetailDto from "./dto/RouteLogRecordDetailDto";
import RouteLogRecordTable from "./RouteLogComponent";
import RouteLogRecord from "./model/RouteLogRecord";

const RouteLogs: React.FC = () =>  {


    const [routeLogRecord, setRouteLogRecord] = useState<Array<RouteLogRecord> | null>(null);

    useEffect(() => {
        // Function to fetch route log record by parcel ID
        const fetchRouteLogRecord = async () => {
            try {
                const response = await RouteLogService.getAll();
                console.log(response.data)
                setRouteLogRecord(response.data);
            } catch (error) {
                console.error('Error fetching route log record:', error);
            }
        };

        fetchRouteLogRecord();
    }, []);

    const [searchTerm, setSearchTerm] = useState<string>('');


    return (
        <div>
            {routeLogRecord ? (
                <RouteLogRecordTable data={routeLogRecord} />
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};
export default RouteLogs;
