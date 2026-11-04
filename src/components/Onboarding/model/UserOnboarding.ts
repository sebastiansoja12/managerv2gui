export type ConsentType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "PERSONAL_DATA_PROCESSING" | "PRODUCT_UPDATES";

export type TutorialStatus = "PENDING" | "COMPLETED" | "SKIPPED" | "NOT_REQUIRED";

export type ConsentRequirement = {
    type: ConsentType;
    required: boolean;
    accepted: boolean;
};

export type UserOnboarding = {
    consentsRequired: boolean;
    consentVersion: string;
    consents: ConsentRequirement[];
    tutorialStatus: TutorialStatus;
};

export type AcceptConsentsRequest = {
    acceptedConsents: ConsentType[];
    version: string;
};
