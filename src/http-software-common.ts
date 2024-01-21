import axios from "axios";

export default axios.create({
    baseURL: `${process.env.SOFTWARE_APP_SERVER_URL}`,
    headers: {
        "Content-type": "application/json"
    }
});