import React, {useMemo} from "react";
import OperatorAdministrationService from "../../../hooks/OperatorAdministrationService";
import pl from "../../../i18n/translate";
import ShipmentConfigurationPanel, {ShipmentConfigurationSource} from "../../GlobalConfiguration/ShipmentConfigurationPanel";
import "../../GlobalConfiguration/styles/global-configuration.css";

type OperatorSettingsPanelProps = {
    operatorId: string;
};

function OperatorSettingsPanel({operatorId}: OperatorSettingsPanelProps) {
    const source = useMemo<ShipmentConfigurationSource>(() => ({
        load: () => OperatorAdministrationService.getShipmentSettings(operatorId),
        save: (configuration) => OperatorAdministrationService.updateShipmentSettings(operatorId, configuration),
    }), [operatorId]);

    return (
        <div className="super-admin-configuration-workspace super-admin-operator-settings">
            <div className="super-admin-directory-list-header">
                <div>
                    <strong>{pl.superAdmin.operatorSettings.title}</strong>
                    <span>{pl.superAdmin.operatorSettings.subtitle}</span>
                </div>
            </div>
            <ShipmentConfigurationPanel departmentCode="" key={operatorId} persistLocally={false} source={source} />
        </div>
    );
}

export default OperatorSettingsPanel;
