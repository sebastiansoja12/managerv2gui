import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import pl from "../../i18n/translate";
import GlobalConfiguration from "./GlobalConfiguration";

jest.mock("./ShipmentConfigurationPanel", () => ({__esModule: true, default: () => null}));
jest.mock("./CourierConfigurationPolicyPanel", () => ({__esModule: true, default: () => null}));
jest.mock("./GeocodingConfigurationPanel", () => ({__esModule: true, default: () => null}));
jest.mock("./IntegrationsConfigurationPanel", () => ({__esModule: true, default: () => null}));
jest.mock("./PickupPointConfigurationPanel", () => ({
    __esModule: true,
    default: () => <div>Pickup points panel</div>,
}));
jest.mock("./SortingConfigurationPanel", () => ({__esModule: true, default: () => <div>Sorting panel</div>}));
jest.mock("./FleetConfigurationPanel", () => ({__esModule: true, default: () => <div>Fleet panel</div>}));
jest.mock("./CommunicationConfigurationPanel", () => ({
    __esModule: true,
    default: () => <div>Communication panel</div>,
}));
jest.mock("./RegionalConfigurationPanel", () => ({__esModule: true, default: () => <div>Regional panel</div>}));
jest.mock("./DepartmentConfigurationPanel", () => ({
    __esModule: true,
    default: () => <div>Department rules panel</div>,
}));

it("opens department rules from global configuration", () => {
    render(<GlobalConfiguration />);
    fireEvent.click(screen.getByRole("tab", {name: pl.globalConfiguration.sections.departments.title}));
    expect(screen.getByText("Department rules panel")).toBeInTheDocument();
});

it.each([
    ["sorting", "Sorting panel"],
    ["pickupPoints", "Pickup points panel"],
    ["fleet", "Fleet panel"],
    ["communication", "Communication panel"],
    ["regional", "Regional panel"],
] as const)("opens the %s configuration tab", (section, panelText) => {
    render(<GlobalConfiguration />);
    fireEvent.click(screen.getByRole("tab", {name: pl.globalConfiguration.sections[section].title}));
    expect(screen.getByText(panelText)).toBeInTheDocument();
});
