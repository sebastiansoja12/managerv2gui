import http from "../http-common";
import {ImpersonationInfo} from "../components/Impersonation/model/ImpersonationInfo";

let pendingCurrent: Promise<ImpersonationInfo | null> | null = null;

const getCurrent = () => {
    if (!pendingCurrent) {
        pendingCurrent = http.get<ImpersonationInfo | "">("/auth/me/impersonation")
            .then((response) => (response.status === 200 && response.data ? response.data : null))
            .finally(() => {
                pendingCurrent = null;
            });
    }
    return pendingCurrent;
};

const ImpersonationService = {
    getCurrent,
};

export default ImpersonationService;
