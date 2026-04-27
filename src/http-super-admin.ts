import axios from "axios";
import JSONBig from "json-bigint";
import {configureAuthenticatedClient} from "./auth/configureAuthenticatedClient";

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
    withCredentials: true,
});

export default configureAuthenticatedClient(http);
