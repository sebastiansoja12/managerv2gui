import React, {useState} from "react";
import {Alert, Menu, MenuItem} from "components/ui";
import {
    AdminPanelSettings,
    DevicesOther,
    FileDownload,
    History,
    KeyboardArrowDown,
    SecurityOutlined,
    SupportAgent,
    SyncAlt,
    WebhookOutlined,
} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import Department from "../../../class/depots/Department";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import CourierAssignmentRunsDialog from "./CourierAssignmentRunsDialog";
import OperatorJobDialog from "./OperatorJobDialog";
import {OperatorActionResult} from "./operatorJobLabels";

export type OperatorAdminActionTab = "readModels" | "devices" | "privacy";

type OperatorAdminActionsProps = {
    operatorId: string;
    operatorName: string;
    active: boolean;
    departments: Department[];
    onImpersonate: () => void;
    onOpenTab: (tab: OperatorAdminActionTab) => void;
};

function OperatorAdminActions({operatorId, operatorName, active, departments, onImpersonate, onOpenTab}: OperatorAdminActionsProps) {
    const texts = pl.superAdmin.adminActions;
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [jobDialogOpen, setJobDialogOpen] = useState(false);
    const [runsDialogOpen, setRunsDialogOpen] = useState(false);
    const [result, setResult] = useState<OperatorActionResult | null>(null);

    const closeMenuAnd = (action: () => void) => () => {
        setMenuAnchor(null);
        setResult(null);
        action();
    };

    const exportData = () => {
        OperatorOperationsService.downloadExport(operatorId)
            .then((fileName) => setResult({severity: "success", message: texts.exported.replace("{file}", fileName)}))
            .catch((requestError) => setResult({severity: "error", message: getBackendErrorMessage(requestError, texts.exportError)}));
    };

    return (
        <div className="super-admin-admin-actions">
            <button
                aria-expanded={Boolean(menuAnchor)}
                aria-haspopup="menu"
                className="super-admin-secondary-button super-admin-compact-button"
                onClick={(event: React.MouseEvent<HTMLElement>) => setMenuAnchor(event.currentTarget)}
                type="button"
            >
                <AdminPanelSettings fontSize="small" /><span>{texts.button}</span><KeyboardArrowDown fontSize="small" />
            </button>
            <Menu anchorEl={menuAnchor} aria-label={texts.menuLabel} onClose={() => setMenuAnchor(null)} open={Boolean(menuAnchor)}>
                <MenuItem disabled={!active} onClick={closeMenuAnd(() => setJobDialogOpen(true))}>
                    <WebhookOutlined fontSize="small" />
                    <span className="super-admin-admin-action-label">
                        <strong>{texts.runJob}</strong>
                        <small>{active ? texts.runJobHint : texts.inactiveHint}</small>
                    </span>
                </MenuItem>
                <MenuItem onClick={closeMenuAnd(() => setRunsDialogOpen(true))}>
                    <History fontSize="small" />
                    <span className="super-admin-admin-action-label">
                        <strong>{texts.runHistory}</strong>
                        <small>{texts.runHistoryHint}</small>
                    </span>
                </MenuItem>
                <MenuItem onClick={closeMenuAnd(onImpersonate)}>
                    <SupportAgent fontSize="small" /><span className="super-admin-admin-action-label"><strong>{texts.impersonate}</strong></span>
                </MenuItem>
                <MenuItem onClick={closeMenuAnd(exportData)}>
                    <FileDownload fontSize="small" /><span className="super-admin-admin-action-label"><strong>{texts.exportData}</strong></span>
                </MenuItem>
                <div className="super-admin-admin-action-group" role="presentation">{texts.goTo}</div>
                <MenuItem onClick={closeMenuAnd(() => onOpenTab("readModels"))}>
                    <SyncAlt fontSize="small" /><span className="super-admin-admin-action-label"><strong>{pl.superAdmin.workspace.readModelsTab}</strong></span>
                </MenuItem>
                <MenuItem onClick={closeMenuAnd(() => onOpenTab("devices"))}>
                    <DevicesOther fontSize="small" /><span className="super-admin-admin-action-label"><strong>{pl.superAdmin.workspace.devicesTab}</strong></span>
                </MenuItem>
                <MenuItem onClick={closeMenuAnd(() => onOpenTab("privacy"))}>
                    <SecurityOutlined fontSize="small" /><span className="super-admin-admin-action-label"><strong>{pl.superAdmin.workspace.privacyTab}</strong></span>
                </MenuItem>
            </Menu>
            {result ? (
                <Alert className="super-admin-admin-action-result" onClose={() => setResult(null)} severity={result.severity}>
                    {result.message}
                </Alert>
            ) : null}
            <OperatorJobDialog
                onClose={() => setJobDialogOpen(false)}
                onFinished={setResult}
                open={jobDialogOpen}
                operatorId={operatorId}
                operatorName={operatorName}
            />
            <CourierAssignmentRunsDialog
                departments={departments}
                onClose={() => setRunsDialogOpen(false)}
                open={runsDialogOpen}
                operatorId={operatorId}
            />
        </div>
    );
}

export default OperatorAdminActions;
