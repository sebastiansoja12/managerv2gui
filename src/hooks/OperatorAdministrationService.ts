import http from "../http-super-admin";
import {ShipmentConfigurationApi} from "../components/GlobalConfiguration/model/ShipmentConfiguration";
import {AssignSubscriptionRequest, OperatorSubscription} from "../components/Subscription/model/Subscription";
import {
    OperatorAccess,
    ReadModelRebuildJob,
    StartReadModelRebuildRequest,
} from "../components/SuperAdmin/operators/model/OperatorAdministration";

const operatorPath = (operatorId: string) => `/operators/${encodeURIComponent(operatorId)}`;

const getAccess = (operatorId: string) => (
    http.get<OperatorAccess>(`${operatorPath(operatorId)}/access`).then((response) => response.data)
);

const revokeSessions = (operatorId: string) => (
    http.post<void>(`${operatorPath(operatorId)}/access/sessions/revoke`).then(() => undefined)
);

const getShipmentSettings = (operatorId: string) => (
    http.get<ShipmentConfigurationApi>(`${operatorPath(operatorId)}/settings/shipment`).then((response) => response.data)
);

const updateShipmentSettings = (operatorId: string, configuration: ShipmentConfigurationApi) => (
    http.put<ShipmentConfigurationApi>(`${operatorPath(operatorId)}/settings/shipment`, configuration)
        .then((response) => response.data)
);

const getReadModelTypes = () => (
    http.get<string[]>("/platform/read-models/types").then((response) => response.data)
);

const getReadModelJobs = (operatorId: string) => (
    http.get<ReadModelRebuildJob[]>(`${operatorPath(operatorId)}/read-models/jobs`).then((response) => response.data)
);

const startReadModelRebuild = (operatorId: string, readModelType: string, request: StartReadModelRebuildRequest) => (
    http.post<ReadModelRebuildJob>(
        `${operatorPath(operatorId)}/read-models/${encodeURIComponent(readModelType)}/rebuild`,
        request,
    ).then((response) => response.data)
);

const getSubscription = (operatorId: string) => (
    http.get<OperatorSubscription | "">(`${operatorPath(operatorId)}/subscription`)
        .then((response) => response.data || null)
);

const assignSubscription = (operatorId: string, request: AssignSubscriptionRequest) => (
    http.put<OperatorSubscription>(`${operatorPath(operatorId)}/subscription`, request)
        .then((response) => response.data)
);

const OperatorAdministrationService = {
    getAccess,
    revokeSessions,
    getShipmentSettings,
    updateShipmentSettings,
    getReadModelTypes,
    getReadModelJobs,
    startReadModelRebuild,
    getSubscription,
    assignSubscription,
};

export default OperatorAdministrationService;
