import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {ShipmentConfigurationApi} from "../components/GlobalConfiguration/model/ShipmentConfiguration";
import {ShippingCapabilities} from "../components/Operators/model/Operator";

const client = new BackendClient(http);

type CurrentOperatorConfiguration = {
    shippingCapabilities: ShippingCapabilities;
};

const getCurrent = () => client.get<CurrentOperatorConfiguration>("/operator-configurations");

const getCurrentShipmentConfiguration = () => (
    client.get<ShipmentConfigurationApi>("/operator-configurations/shipment")
);

const updateCurrentShipmentConfiguration = (configuration: ShipmentConfigurationApi) => (
    client.put<ShipmentConfigurationApi, ShipmentConfigurationApi>(
        "/operator-configurations/shipment",
        configuration,
    )
);

const OperatorConfigurationService = {
    getCurrent,
    getCurrentShipmentConfiguration,
    updateCurrentShipmentConfiguration,
};

export default OperatorConfigurationService;
