import React, {useState} from "react";
import {Construction, MonitorHeartOutlined, TableView} from "components/ui/icons";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import FeatureMatrixPanel from "./FeatureMatrixPanel";
import MaintenancePanel from "./MaintenancePanel";
import SystemStatusPanel from "./SystemStatusPanel";

type SystemTab = "features" | "status" | "maintenance";

type SystemPanelProps = {
    operators?: Operator[];
    onOperatorSaved?: (operator: Operator) => void;
};

function SystemPanel({operators, onOperatorSaved}: SystemPanelProps) {
    const [tab, setTab] = useState<SystemTab>("features");
    const tabs = [
        ["features", pl.superAdmin.system.tabs.features, TableView],
        ["status", pl.superAdmin.system.tabs.status, MonitorHeartOutlined],
        ["maintenance", pl.superAdmin.system.tabs.maintenance, Construction],
    ] as const;

    return (
        <div className="super-admin-system-panel">
            <div className="super-admin-workspace-tabs" role="tablist" aria-label={pl.superAdmin.system.title}>
                {tabs.map(([value, label, Icon]) => (
                    <button aria-selected={tab === value} className={tab === value ? "super-admin-workspace-tab-active" : ""} key={value} onClick={() => setTab(value)} role="tab" type="button">
                        <Icon fontSize="small" /><span>{label}</span>
                    </button>
                ))}
            </div>
            {tab === "features" ? <FeatureMatrixPanel onOperatorSaved={onOperatorSaved} operators={operators} /> : null}
            {tab === "status" ? <SystemStatusPanel /> : null}
            {tab === "maintenance" ? <MaintenancePanel /> : null}
        </div>
    );
}

export default SystemPanel;
