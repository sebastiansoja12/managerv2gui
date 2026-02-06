export interface ApiErrorResponse {
    status?: number;
    message: string;
    details?: unknown;
}

export interface ApiResult<T> {
    data: T;
    status: number;
}

export type QueryPrimitive = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryPrimitive>;
