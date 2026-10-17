import axios from "axios";
import {configureAuthenticatedClient} from "./auth/configureAuthenticatedClient";

const httpPublic = axios.create({
    baseURL: `${process.env.REACT_APP_SERVER_URL}`,
    headers: {
        "Content-type": "application/json"
    },
    withCredentials: true,
});

export default configureAuthenticatedClient(httpPublic, {
    refreshSession: false,
    onUnauthenticated: () => undefined,
});
