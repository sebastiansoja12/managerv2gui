import React from "react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {defaultFleetConfiguration, FleetConfigurationApi} from "./model/OperatorSettingsConfiguration";
import OperatorSettingsPanel, {OperatorSettingGroup} from "./OperatorSettingsPanel";

const loadFleetConfiguration = async () => (await OperatorConfigurationService.getCurrentFleetConfiguration()).data;

const saveFleetConfiguration = async (configuration: FleetConfigurationApi) => (
    await OperatorConfigurationService.updateCurrentFleetConfiguration(configuration)
).data;

function FleetConfigurationPanel() {
    const labels = pl.globalConfiguration.fleetConfiguration;
    const units = pl.globalConfiguration.operatorSettings.units;
    const groups: OperatorSettingGroup[] = [
        {
            key: "vehicles",
            fields: [
                {key: "vehicleInspectionReminderDays", kind: "number", min: 0, max: 365, unit: units.days},
                {key: "vehicleInsuranceReminderDays", kind: "number", min: 0, max: 365, unit: units.days},
                {key: "defaultVehiclePalletCapacity", kind: "number", min: 1, max: 66, unit: units.pallets},
            ],
        },
        {
            key: "drivers",
            fields: [
                {key: "maxDriverShiftHours", kind: "number", min: 1, max: 24, unit: units.hours},
                {key: "requiredBreakMinutes", kind: "number", min: 0, max: 240, step: 5, unit: units.minutes},
                {key: "requirePreTripChecklist", kind: "boolean"},
            ],
        },
        {
            key: "tracking",
            fields: [
                {key: "gpsPositionIntervalSeconds", kind: "number", min: 5, max: 3600, unit: units.seconds},
            ],
        },
    ];

    return (
        <OperatorSettingsPanel<FleetConfigurationApi>
            defaults={defaultFleetConfiguration}
            groups={groups}
            labels={labels}
            load={loadFleetConfiguration}
            save={saveFleetConfiguration}
        />
    );
}

export default FleetConfigurationPanel;
