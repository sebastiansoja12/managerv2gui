import axios from "axios";
import {configureAuthenticatedClient} from "./auth/configureAuthenticatedClient";

const http = axios.create({
    baseURL: process.env.REACT_APP_GATEWAY_URL,
    withCredentials: true,
});

export default configureAuthenticatedClient(http);
