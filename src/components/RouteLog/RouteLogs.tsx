import React, {useEffect, useState} from 'react';
import RouteLogService from "../../hooks/RouteLogService";
import RouteLogRecordTable from "./RouteLogComponent";
import RouteLogRecord from "./model/RouteLogRecord";
import pl from "../../i18n/translate";

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
                console.error(pl.routeLogs.messages.loadError, error);
            }
        };

        fetchRouteLogRecord();
    }, []);

    return (
        <div>
            {routeLogRecord ? (
                <RouteLogRecordTable data={routeLogRecord} />
            ) : (
                <p>{pl.routeLogs.loading}</p>
            )}
        </div>
    );
};
export default RouteLogs;
