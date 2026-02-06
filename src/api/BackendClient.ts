import {AxiosError, AxiosInstance, AxiosRequestConfig} from "axios";
import {ApiErrorResponse, ApiResult, QueryParams} from "./ApiResult";
import {ShipmentCreateRequestApi} from "../components/Shipment/dto/ShipmentDto";

class BackendClient {
    private readonly http: AxiosInstance;

    constructor(http: AxiosInstance) {
        this.http = http;
    }

    async get<TResponse>(
        url: string,
        config?: {
            params?: QueryParams;
            headers?: {
                Authorization: string;
            };
        }
    ): Promise<ApiResult<TResponse>> {
        return this.request<TResponse>({
            method: "GET",
            url,
            params: config?.params,
            headers: config?.headers,
        });
    }

    async post<TRequest, TResponse>(
        url: string,
        data: TRequest,
        config?: AxiosRequestConfig
    ): Promise<ApiResult<TResponse>> {
        return this.request<TResponse>({
            method: "POST",
            url,
            data,
            ...config,
        });
    }

    async put<TRequest, TResponse>(url: string, data?: TRequest, params?: QueryParams): Promise<ApiResult<TResponse>> {
        return this.request<TResponse>({
            method: "PUT",
            url,
            data,
            params,
        });
    }

    private async request<TResponse>(config: AxiosRequestConfig): Promise<ApiResult<TResponse>> {
        try {
            const response = await this.http.request<TResponse>(config);

            return {
                data: response.data,
                status: response.status,
            };
        } catch (error) {
            throw this.toApiError(error);
        }
    }

    private toApiError(error: unknown): ApiErrorResponse {
        const axiosError = error as AxiosError<unknown>;
        if (!axiosError.response) {
            return {
                message: axiosError.message || "Backend request failed",
            };
        }

        const responseData = axiosError.response.data;
        const message = typeof responseData === "string"
            ? responseData
            : axiosError.message || "Backend request failed";

        return {
            status: axiosError.response.status,
            message,
            details: responseData,
        };
    }
}

export default BackendClient;
