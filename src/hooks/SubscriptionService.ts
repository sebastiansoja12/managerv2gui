import http from "../http-common";
import {CurrentSubscription} from "../components/Subscription/model/Subscription";

const getCurrent = () => (
    http.get<CurrentSubscription>("/subscription").then((response) => response.data)
);

const SubscriptionService = {
    getCurrent,
};

export default SubscriptionService;
