import React from "react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {
    CommunicationConfigurationApi,
    defaultCommunicationConfiguration,
} from "./model/OperatorSettingsConfiguration";
import OperatorSettingsPanel, {OperatorSettingGroup} from "./OperatorSettingsPanel";

const loadCommunicationConfiguration = async () => (
    await OperatorConfigurationService.getCurrentCommunicationConfiguration()
).data;

const saveCommunicationConfiguration = async (configuration: CommunicationConfigurationApi) => (
    await OperatorConfigurationService.updateCurrentCommunicationConfiguration(configuration)
).data;

function CommunicationConfigurationPanel() {
    const labels = pl.globalConfiguration.communicationConfiguration;
    const units = pl.globalConfiguration.operatorSettings.units;
    const groups: OperatorSettingGroup[] = [
        {
            key: "email",
            fields: [
                {key: "senderName", kind: "text", maxLength: 120},
                {key: "replyToEmail", kind: "text", inputType: "email", maxLength: 255},
                {key: "emailFooter", kind: "text", maxLength: 1000, multiline: true},
                {key: "defaultCustomerLanguage", kind: "select", options: ["PL", "EN", "DE"]},
            ],
        },
        {
            key: "branding",
            fields: [
                {key: "logoUrl", kind: "text", inputType: "url", maxLength: 500},
                {key: "accentColor", kind: "color"},
            ],
        },
        {
            key: "chat",
            fields: [
                {key: "chatMessageRetentionDays", kind: "number", min: 1, max: 3650, unit: units.days},
                {key: "chatAttachmentsAllowed", kind: "boolean"},
                {key: "chatMaxAttachmentSizeMb", kind: "number", min: 1, max: 100, unit: units.megabytes},
            ],
        },
    ];

    return (
        <OperatorSettingsPanel<CommunicationConfigurationApi>
            defaults={defaultCommunicationConfiguration}
            groups={groups}
            labels={labels}
            load={loadCommunicationConfiguration}
            save={saveCommunicationConfiguration}
        />
    );
}

export default CommunicationConfigurationPanel;
