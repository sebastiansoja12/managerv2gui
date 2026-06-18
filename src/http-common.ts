import axios from "axios";
import {getAuthToken} from "./auth/AuthTokenStorage";

const http = axios.create({
    baseURL: `${process.env.REACT_APP_SERVER_URL}`,
    headers: {
        "Content-type": "application/json"
    }
});

http.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
});

export default http;
