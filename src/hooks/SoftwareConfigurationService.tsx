import Software from "../components/SoftwareConfiguration/model/Software";
import http from "../http-software-common";
import SoftwareProperty from "../components/SoftwareConfiguration/model/SoftwareProperty";

const getAll = () => {
    return http.get<Software[]>(`http://localhost:8081/software-configurations`);
};

const update = (id: string, software: SoftwareProperty) => {
    return http.put<Software>(`http://localhost:8081/software-configurations/${id}`, software);
}


const SoftwareConfigurationService = {
    getAll,
    update
};

export default SoftwareConfigurationService;