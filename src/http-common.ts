import axios from "axios";

export default axios.create({
    baseURL: "http://localhost:8080/v2/api",
    headers: {
        "Content-type": "application/json"
    }
});