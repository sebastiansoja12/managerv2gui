import React from "react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {defaultSortingConfiguration, SortingConfigurationApi} from "./model/OperatorSettingsConfiguration";
import OperatorSettingsPanel, {OperatorSettingGroup} from "./OperatorSettingsPanel";

const loadSortingConfiguration = async () => (
    await OperatorConfigurationService.getCurrentSortingConfiguration()
).data;

const saveSortingConfiguration = async (configuration: SortingConfigurationApi) => (
    await OperatorConfigurationService.updateCurrentSortingConfiguration(configuration)
).data;

function SortingConfigurationPanel() {
    const labels = pl.globalConfiguration.sortingConfiguration;
    const units = pl.globalConfiguration.operatorSettings.units;
    const groups: OperatorSettingGroup[] = [
        {
            key: "requiredScans",
            fields: [
                {key: "requireInboundScan", kind: "boolean"},
                {key: "requireSortScan", kind: "boolean"},
                {key: "requireOutboundScan", kind: "boolean"},
                {key: "requireDamagePhotoOnInbound", kind: "boolean"},
            ],
        },
        {
            key: "scanErrors",
            fields: [
                {key: "duplicateScanPolicy", kind: "select", options: ["WARN", "BLOCK", "IGNORE"]},
                {key: "scanErrorFeedback", kind: "select", options: ["SOUND_AND_VIBRATION", "SOUND", "VIBRATION", "NONE"]},
            ],
        },
        {
            key: "destinations",
            fields: [
                {key: "unresolvedDestinationPolicy", kind: "select", options: ["ROUTE_TO_EXCEPTION_RAMP", "BLOCK"]},
                {key: "exceptionRampCode", kind: "text", maxLength: 32},
                {key: "missingInWarehouseAfterHours", kind: "number", min: 1, max: 720, unit: units.hours},
            ],
        },
    ];

    return (
        <OperatorSettingsPanel<SortingConfigurationApi>
            defaults={defaultSortingConfiguration}
            groups={groups}
            labels={labels}
            load={loadSortingConfiguration}
            save={saveSortingConfiguration}
        />
    );
}

export default SortingConfigurationPanel;
