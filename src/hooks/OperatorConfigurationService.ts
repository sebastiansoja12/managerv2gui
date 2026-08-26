import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {ShipmentConfigurationApi} from "../components/GlobalConfiguration/model/ShipmentConfiguration";

const client = new BackendClient(http);

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
    getCurrentShipmentConfiguration,
    updateCurrentShipmentConfiguration,
};

export default OperatorConfigurationService;
