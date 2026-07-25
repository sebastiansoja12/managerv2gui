import axios from "axios";
import {configureAuthenticatedClient} from "./auth/configureAuthenticatedClient";

const gatewayBaseUrl = process.env.REACT_APP_GATEWAY_URL || process.env.REACT_APP_SERVER_URL;

const http = axios.create({
    baseURL: gatewayBaseUrl,
    withCredentials: true,
});

export default configureAuthenticatedClient(http);
