import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {
    DepartmentConfiguration,
    DepartmentConfigurationOverride,
} from "../components/GlobalConfiguration/model/DepartmentConfiguration";
import {
    CommunicationConfigurationApi,
    FleetConfigurationApi,
    PickupPointConfigurationApi,
    RegionalConfigurationApi,
    SortingConfigurationApi,
} from "../components/GlobalConfiguration/model/OperatorSettingsConfiguration";
import {
    ShipmentConfigurationApi,
    ShipmentConfigurationSection,
} from "../components/GlobalConfiguration/model/ShipmentConfiguration";
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

const shipmentConfigurationSectionPaths: Record<ShipmentConfigurationSection, string> = {
    validationConfiguration: "validation",
    labelConfiguration: "labels",
    shipmentLimits: "limits",
    workflowConfiguration: "workflow",
    trackingNumberRule: "tracking-number-rule",
    notificationConfiguration: "notifications",
    deliveryConfiguration: "delivery",
    returnConfiguration: "returns",
    paymentConfiguration: "payments",
    slaConfiguration: "sla",
    dataRetentionConfiguration: "data-retention",
};

const updateCurrentShipmentConfigurationSection = <Section extends ShipmentConfigurationSection>(
    section: Section,
    sectionConfiguration: ShipmentConfigurationApi[Section],
) => (
    client.put<ShipmentConfigurationApi[Section], ShipmentConfigurationApi>(
        `/operator-configurations/shipment/${shipmentConfigurationSectionPaths[section]}`,
        sectionConfiguration,
    )
);

const getCurrentDepartmentConfiguration = () => (
    client.get<DepartmentConfiguration>("/operator-configurations/departments")
);

const getDepartmentConfiguration = (departmentId: number | string) => (
    client.get<DepartmentConfiguration>(`/operator-configurations/departments/${encodeURIComponent(String(departmentId))}`)
);

const getDepartmentConfigurationOverride = (departmentId: number | string) => (
    client.get<DepartmentConfigurationOverride>(
        `/operator-configurations/departments/${encodeURIComponent(String(departmentId))}/override`)
);

const updateDepartmentConfigurationOverride = (departmentId: number | string,
                                               override: DepartmentConfigurationOverride) => (
    client.put<DepartmentConfigurationOverride, DepartmentConfigurationOverride>(
        `/operator-configurations/departments/${encodeURIComponent(String(departmentId))}/override`, override)
);

const updateCurrentDepartmentConfiguration = (configuration: DepartmentConfiguration) => (
    client.put<DepartmentConfiguration, DepartmentConfiguration>("/operator-configurations/departments", configuration)
);

const getCurrentFleetConfiguration = () => (
    client.get<FleetConfigurationApi>("/operator-configurations/fleet")
);

const updateCurrentFleetConfiguration = (configuration: FleetConfigurationApi) => (
    client.put<FleetConfigurationApi, FleetConfigurationApi>("/operator-configurations/fleet", configuration)
);

const getCurrentCommunicationConfiguration = () => (
    client.get<CommunicationConfigurationApi>("/operator-configurations/communication")
);

const updateCurrentCommunicationConfiguration = (configuration: CommunicationConfigurationApi) => (
    client.put<CommunicationConfigurationApi, CommunicationConfigurationApi>("/operator-configurations/communication", configuration)
);

const getCurrentRegionalConfiguration = () => (
    client.get<RegionalConfigurationApi>("/operator-configurations/regional")
);

const updateCurrentRegionalConfiguration = (configuration: RegionalConfigurationApi) => (
    client.put<RegionalConfigurationApi, RegionalConfigurationApi>("/operator-configurations/regional", configuration)
);

const getCurrentSortingConfiguration = () => (
    client.get<SortingConfigurationApi>("/operator-configurations/sorting")
);

const updateCurrentSortingConfiguration = (configuration: SortingConfigurationApi) => (
    client.put<SortingConfigurationApi, SortingConfigurationApi>("/operator-configurations/sorting", configuration)
);

const getCurrentPickupPointConfiguration = () => (
    client.get<PickupPointConfigurationApi>("/operator-configurations/pickup-points")
);

const updateCurrentPickupPointConfiguration = (configuration: PickupPointConfigurationApi) => (
    client.put<PickupPointConfigurationApi, PickupPointConfigurationApi>(
        "/operator-configurations/pickup-points",
        configuration,
    )
);

const OperatorConfigurationService = {
    getCurrent,
    getCurrentShipmentConfiguration,
    updateCurrentShipmentConfiguration,
    updateCurrentShipmentConfigurationSection,
    getCurrentDepartmentConfiguration,
    updateCurrentDepartmentConfiguration,
    getDepartmentConfiguration,
    getDepartmentConfigurationOverride,
    updateDepartmentConfigurationOverride,
    getCurrentFleetConfiguration,
    updateCurrentFleetConfiguration,
    getCurrentCommunicationConfiguration,
    updateCurrentCommunicationConfiguration,
    getCurrentRegionalConfiguration,
    updateCurrentRegionalConfiguration,
    getCurrentSortingConfiguration,
    updateCurrentSortingConfiguration,
    getCurrentPickupPointConfiguration,
    updateCurrentPickupPointConfiguration,
};

export default OperatorConfigurationService;
