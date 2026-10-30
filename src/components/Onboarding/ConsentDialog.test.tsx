import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import pl from "../../i18n/translate";
import ConsentDialog from "./ConsentDialog";
import {UserOnboarding} from "./model/UserOnboarding";

const onboarding: UserOnboarding = {
    consentsRequired: true,
    consentVersion: "2026-11",
    tutorialStatus: "PENDING",
    consents: [
        {type: "TERMS_OF_SERVICE", required: true, accepted: false},
        {type: "PRIVACY_POLICY", required: true, accepted: false},
        {type: "PERSONAL_DATA_PROCESSING", required: true, accepted: false},
        {type: "PRODUCT_UPDATES", required: false, accepted: false},
    ],
};

describe("ConsentDialog", () => {
    it("submits only after every required consent is checked", () => {
        const onAccept = jest.fn();
        render(<ConsentDialog onAccept={onAccept} onLogout={jest.fn()} onboarding={onboarding} saving={false}/>);
        const acceptButton = screen.getByRole("button", {name: pl.onboarding.consents.accept});

        expect(acceptButton).toBeDisabled();
        fireEvent.click(screen.getByLabelText(new RegExp(pl.onboarding.consents.types.TERMS_OF_SERVICE.title)));
        fireEvent.click(screen.getByLabelText(new RegExp(pl.onboarding.consents.types.PRIVACY_POLICY.title)));
        expect(acceptButton).toBeDisabled();
        fireEvent.click(screen.getByLabelText(new RegExp(pl.onboarding.consents.types.PERSONAL_DATA_PROCESSING.title)));
        fireEvent.click(acceptButton);

        expect(onAccept).toHaveBeenCalledWith(["TERMS_OF_SERVICE", "PRIVACY_POLICY", "PERSONAL_DATA_PROCESSING"]);
    });
});
