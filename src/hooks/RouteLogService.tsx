import http from "../http-common";
import RouteLogRecord from "../components/RouteLog/model/RouteLogRecord";

const get = (shipmentId: string) => {
    return http.get<RouteLogRecord>(`/routes/${shipmentId}`);
};

const getAll = () => {
    return http.get<Array<RouteLogRecord>>(`/routes`);
};


const RouteLogService = {
    get,
    getAll
};

export default RouteLogService;
