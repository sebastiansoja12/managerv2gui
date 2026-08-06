import http from "../http-super-admin";
import {PlatformAuditEntry} from "../components/SuperAdmin/audit/model/PlatformAuditEntry";

const getLatest = (operatorId?: string, limit = 200) => (
    http.get<PlatformAuditEntry[]>("/platform/audit-log", {
        params: {operatorId: operatorId || undefined, limit},
    }).then((response) => response.data)
);

const PlatformAuditService = {
    getLatest,
};

export default PlatformAuditService;
