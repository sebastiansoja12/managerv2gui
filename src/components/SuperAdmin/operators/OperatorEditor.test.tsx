import "@testing-library/jest-dom";
import {fireEvent, render, screen} from "@testing-library/react";
import React from "react";
import {createEmptyOperatorDraft} from "../../Operators/model/Operator";
import OperatorEditor from "./OperatorEditor";

const renderCreateEditor = () => render(
    <OperatorEditor
        createMode
        draft={createEmptyOperatorDraft("GEOAPIFY")}
        geocodingProviders={[{
            provider: "GEOAPIFY",
            url: "https://example.test",
            activeFields: ["API_KEY"],
            providerApis: ["GEOCODING_API"],
        }]}
        onCreate={jest.fn()}
        onSave={jest.fn()}
        onToggleCapability={jest.fn()}
        onToggleStatus={jest.fn()}
        onUpdateDraft={jest.fn()}
        saving={false}
    />,
);

describe("OperatorEditor create wizard", () => {
    it("shows operator data, configuration and department in separate tabs", () => {
        renderCreateEditor();

        expect(screen.getByLabelText("Nazwa firmy")).toBeVisible();
        expect(screen.getByLabelText("Dostawca geokodowania")).not.toBeVisible();
        expect(screen.getByLabelText("Kod oddziału")).not.toBeVisible();

        fireEvent.click(screen.getByRole("tab", {name: /Konfiguracja/}));
        expect(screen.getByLabelText("Dostawca geokodowania")).toBeVisible();
        expect(screen.getByLabelText("Nazwa firmy")).not.toBeVisible();

        fireEvent.click(screen.getByRole("tab", {name: /Pierwszy oddział/}));
        expect(screen.getByLabelText("Kod oddziału")).toBeVisible();
        expect(screen.getByLabelText("Dostawca geokodowania")).not.toBeVisible();
    });

    it("blocks moving forward until the current step is complete", () => {
        renderCreateEditor();

        expect(screen.getByRole("button", {name: /Dalej/})).toBeDisabled();
    });
});
