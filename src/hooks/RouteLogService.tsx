import http from "../http-common";
import RouteLogRecord from "../components/RouteLog/model/RouteLogRecord";

const get = (parcelId: number) => {
    return http.get<RouteLogRecord>(`/routes/test/${parcelId}`);
};

const getAll = () => {
    return http.get<Array<RouteLogRecord>>(`/routes/test`);
};


const RouteLogService = {
    get,
    getAll
};

export default RouteLogService;