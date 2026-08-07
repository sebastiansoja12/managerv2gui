import http from "../http-common";
import {ImpersonationInfo} from "../components/Impersonation/model/ImpersonationInfo";

const getCurrent = () => (
    http.get<ImpersonationInfo | "">("/auth/me/impersonation")
        .then((response) => (response.status === 200 && response.data ? response.data : null))
);

const ImpersonationService = {
    getCurrent,
};

export default ImpersonationService;
