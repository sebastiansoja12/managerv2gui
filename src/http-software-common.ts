import axios from "axios";
import {configureAuthenticatedClient} from "./auth/configureAuthenticatedClient";

const http = axios.create({
    baseURL: `${process.env.SOFTWARE_APP_SERVER_URL}`,
    headers: {
        "Content-type": "application/json"
    },
    withCredentials: true,
});

export default configureAuthenticatedClient(http);
