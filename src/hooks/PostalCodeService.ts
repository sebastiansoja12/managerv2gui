import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {PostalCodeDto} from "../components/Shipment/dto/PostalCode";

const client = new BackendClient(http);

const search = (query: string) => {
    return client.get<PostalCodeDto[]>("/postal-codes", {params: {query}});
};

const PostalCodeService = {
    search,
};

export default PostalCodeService;
