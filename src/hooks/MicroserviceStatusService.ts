import {MicroserviceDefinition, MicroserviceStatusResult} from "../components/MicroserviceStatus/model/MicroserviceStatusDto";
import gatewayHttp from "../http-gateway";

const REQUEST_TIMEOUT_MS = 3500;
const GATEWAY_URL = process.env.REACT_APP_GATEWAY_URL || process.env.REACT_APP_SERVER_URL;
const GATEWAY_ENVIRONMENT = process.env.REACT_APP_GATEWAY_URL ? "REACT_APP_GATEWAY_URL" : "REACT_APP_SERVER_URL";
const GATEWAY_ENVIRONMENT_FALLBACK = "REACT_APP_GATEWAY_URL or REACT_APP_SERVER_URL";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const buildUrl = (baseUrl: string, path: string) => `${trimTrailingSlash(baseUrl)}${path}`;

type GatewayServiceHealth = {
    httpStatus?: number;
    id: string;
    pathPrefix: string;
    responseTimeMillis: number;
    status: "UP" | "DOWN" | "DISABLED" | string;
};

type GatewayServicesHealthResponse = {
    services: GatewayServiceHealth[];
    status: string;
};

const serviceNames: Record<string, string> = {
    "delivery-protection": "Delivery Protection",
    "manager-api": "Manager API",
    "pallet-handling-manager": "Pallet Handling Manager",
    "returning-track-manager": "Returning Track Manager",
    "route-tracker-flow": "Route Tracker Flow",
    "software-configuration": "Software Configuration",
};

const fallbackServices: MicroserviceDefinition[] = Object.entries(serviceNames).map(([id, name]) => ({
    baseUrl: GATEWAY_URL ? buildUrl(GATEWAY_URL, `/${id}`) : undefined,
    environmentVariable: GATEWAY_ENVIRONMENT,
    healthPaths: ["/actuator/health"],
    id,
    name,
}));

const readGatewayHealth = async () => {
    if (!GATEWAY_URL) {
        throw new Error(`Missing ${GATEWAY_ENVIRONMENT_FALLBACK}`);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = performance.now();

    try {
        const response = await gatewayHttp.get<GatewayServicesHealthResponse>("/services/health", {
            signal: controller.signal,
        });
        const latencyMs = Math.round(performance.now() - startedAt);

        return {
            latencyMs,
            response,
        };
    } finally {
        window.clearTimeout(timeout);
    }
};

const mapGatewayService = (gatewayService: GatewayServiceHealth): MicroserviceStatusResult => {
    const checkedAt = new Date().toISOString();
    const serviceUrl = GATEWAY_URL ? buildUrl(GATEWAY_URL, `/${gatewayService.pathPrefix}`) : undefined;
    const state: MicroserviceStatusResult["state"] = gatewayService.status === "UP"
        ? "online"
        : gatewayService.status === "DISABLED" ? "unknown" : "offline";
    const message = gatewayService.httpStatus
        ? `${gatewayService.status} (HTTP ${gatewayService.httpStatus})`
        : gatewayService.status;

    return {
        checkedAt,
        baseUrl: serviceUrl,
        environmentVariable: GATEWAY_ENVIRONMENT,
        healthPaths: ["/actuator/health"],
        id: gatewayService.id,
        latencyMs: gatewayService.responseTimeMillis,
        message,
        name: serviceNames[gatewayService.id] || gatewayService.id,
        state,
        statusCode: gatewayService.httpStatus,
    };
};

const missingGatewayResults = (): MicroserviceStatusResult[] => fallbackServices.map((service) => ({
    ...service,
    checkedAt: new Date().toISOString(),
    message: `Missing ${GATEWAY_ENVIRONMENT_FALLBACK}`,
    state: "unknown",
}));

const checkAll = async (): Promise<MicroserviceStatusResult[]> => {
    if (!GATEWAY_URL) {
        return missingGatewayResults();
    }

    const {response} = await readGatewayHealth();
    return response.data.services.map(mapGatewayService);
};

const MicroserviceStatusService = {
    checkAll,
};

export default MicroserviceStatusService;
