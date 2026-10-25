import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import pl from "../../i18n/translate";
import GlobalConfiguration from "./GlobalConfiguration";

jest.mock("./ShipmentConfigurationPanel", () => ({__esModule: true, default: () => null}));
jest.mock("./CourierConfigurationPolicyPanel", () => ({__esModule: true, default: () => null}));
jest.mock("./GeocodingConfigurationPanel", () => ({__esModule: true, default: () => null}));
jest.mock("./IntegrationsConfigurationPanel", () => ({__esModule: true, default: () => null}));
jest.mock("./DepartmentConfigurationPanel", () => ({
    __esModule: true,
    default: () => <div>Department rules panel</div>,
}));

it("opens department rules from global configuration", () => {
    render(<GlobalConfiguration />);
    fireEvent.click(screen.getByRole("tab", {name: pl.globalConfiguration.sections.departments.title}));
    expect(screen.getByText("Department rules panel")).toBeInTheDocument();
});
