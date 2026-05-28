import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import TrackingService from "../../hooks/TrackingService";
import pl from "../../i18n/translate";
import IntegrationsConfigurationPanel from "./IntegrationsConfigurationPanel";

test("renders provider fields from the GUI registry and tests current form values", async () => {
    jest.spyOn(TrackingService, "getIntegrations").mockResolvedValue({data: []} as never);
    const testIntegration = jest.spyOn(TrackingService, "testIntegration").mockResolvedValue({} as never);

    render(<IntegrationsConfigurationPanel />);

    const addButton = await screen.findByRole("button", {name: pl.integrations.actions.add});
    await waitFor(() => expect(addButton).toBeEnabled());
    fireEvent.click(addButton);
    fireEvent.mouseDown(screen.getByLabelText(pl.integrations.dialog.providerLabel));
    fireEvent.click(await screen.findByRole("option", {name: "InPost Global Tracking"}));
    fireEvent.change(await screen.findByRole("textbox", {name: pl.integrations.fields.clientId}), {
        target: {value: "client-id"},
    });
    const secretInput = document.querySelector(`input[type="password"]`);
    expect(secretInput).not.toBeNull();
    fireEvent.change(secretInput as HTMLInputElement, {target: {value: "client-secret"}});
    fireEvent.click(screen.getByRole("button", {name: pl.integrations.actions.testConnection}));

    await waitFor(() => expect(testIntegration).toHaveBeenCalledWith("INPOST", {
        enabled: true,
        values: {
            environment: "STAGE",
            clientId: "client-id",
            clientSecret: "client-secret",
        },
    }));
    expect(await screen.findByText(pl.integrations.messages.connectionSuccess)).toBeInTheDocument();
});
