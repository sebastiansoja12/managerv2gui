import BackendClient from "../api/BackendClient";
import {AuditLogEntryPageDto, AuditLogResourceType} from "../components/AuditLog/model/AuditLogEntry";
import http from "../http-common";

const client = new BackendClient(http);

const findByResource = (resourceType: AuditLogResourceType, resourceId: string, page = 0, size = 20) => (
    client.get<AuditLogEntryPageDto>(
        `/audit-log/${resourceType}/${encodeURIComponent(resourceId)}`,
        {params: {page, size}},
    )
);

const AuditLogService = {findByResource};

export default AuditLogService;
