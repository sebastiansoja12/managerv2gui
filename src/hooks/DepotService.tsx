import Depot from "../class/depots/Depot";
import http from "../http-common";
const getAll = () => {
    return http.get<Array<Depot>>("/depots");
};
const get = (depotCode: any) => {
    return http.get<Depot>(`/depots/${depotCode}`);
};

const create = (data: Depot) => {
    return http.post<Depot>("/depots", data);
};

const DepotService = {
    getAll,
    get,
    create,
};

export default DepotService;