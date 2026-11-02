import React from "react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {defaultRegionalConfiguration, RegionalConfigurationApi} from "./model/OperatorSettingsConfiguration";
import OperatorSettingsPanel, {OperatorSettingGroup} from "./OperatorSettingsPanel";

const TIME_ZONES = [
    "Europe/Warsaw",
    "Europe/Berlin",
    "Europe/Prague",
    "Europe/Vienna",
    "Europe/Paris",
    "Europe/London",
    "Europe/Kyiv",
    "Europe/Vilnius",
    "UTC",
];

const loadRegionalConfiguration = async () => (
    await OperatorConfigurationService.getCurrentRegionalConfiguration()
).data;

const saveRegionalConfiguration = async (configuration: RegionalConfigurationApi) => (
    await OperatorConfigurationService.updateCurrentRegionalConfiguration(configuration)
).data;

export const validateRegionalConfiguration = (configuration: RegionalConfigurationApi) => (
    configuration.workingDayStart >= configuration.workingDayEnd
        ? pl.globalConfiguration.regionalConfiguration.workingHoursOrderError
        : null
);

function RegionalConfigurationPanel() {
    const labels = pl.globalConfiguration.regionalConfiguration;
    const groups: OperatorSettingGroup[] = [
        {
            key: "locale",
            fields: [
                {key: "timeZone", kind: "select", options: TIME_ZONES},
                {key: "dateFormat", kind: "select", options: ["DD_MM_YYYY", "YYYY_MM_DD", "MM_DD_YYYY"]},
                {key: "currency", kind: "select", options: ["PLN", "EUR", "USD", "CZK", "GBP"]},
                {key: "weightUnit", kind: "select", options: ["KG", "LB"]},
                {key: "lengthUnit", kind: "select", options: ["CM", "IN"]},
            ],
        },
        {
            key: "workingHours",
            fields: [
                {key: "workingDayStart", kind: "time"},
                {key: "workingDayEnd", kind: "time"},
                {key: "saturdayWorkingDay", kind: "boolean"},
                {key: "sundayWorkingDay", kind: "boolean"},
            ],
        },
    ];

    return (
        <OperatorSettingsPanel<RegionalConfigurationApi>
            defaults={defaultRegionalConfiguration}
            groups={groups}
            labels={labels}
            load={loadRegionalConfiguration}
            save={saveRegionalConfiguration}
            validate={validateRegionalConfiguration}
        />
    );
}

export default RegionalConfigurationPanel;
