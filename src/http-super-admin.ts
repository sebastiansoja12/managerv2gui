import axios from "axios";
import JSONBig from "json-bigint";
import {getSuperAdminAuthToken} from "./auth/SuperAdminAuthTokenStorage";

const jsonBig = JSONBig({storeAsString: true});

const parseJsonWithBigIntegers = (data: string) => {
    if (!data) {
        return data;
    }

    try {
        return jsonBig.parse(data);
    } catch {
        return data;
    }
};

const http = axios.create({
    baseURL: `${process.env.REACT_APP_SERVER_URL}`,
    headers: {
        "Content-type": "application/json",
    },
    transformResponse: [parseJsonWithBigIntegers],
});

http.interceptors.request.use((config) => {
    const token = getSuperAdminAuthToken();
    if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
});

export default http;
