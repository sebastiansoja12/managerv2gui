import pl from "../../../i18n/translate";
import {TrackingIntegrationDefinition} from "./TrackingIntegration";

export const trackingIntegrationDefinitions: TrackingIntegrationDefinition[] = [
    {
        provider: "INPOST",
        displayName: "InPost Global Tracking",
        fields: [
            {
                key: "environment",
                label: pl.integrations.fields.environment,
                type: "SELECT",
                required: true,
                defaultValue: "STAGE",
                maxLength: 32,
                options: [
                    {value: "STAGE", label: pl.integrations.environments.stage},
                    {value: "PRODUCTION", label: pl.integrations.environments.production},
                ],
            },
            {
                key: "clientId",
                label: pl.integrations.fields.clientId,
                type: "TEXT",
                required: true,
                defaultValue: "",
                maxLength: 512,
            },
            {
                key: "clientSecret",
                label: pl.integrations.fields.clientSecret,
                type: "SECRET",
                required: true,
                defaultValue: "",
                maxLength: 1024,
            },
        ],
    },
];
