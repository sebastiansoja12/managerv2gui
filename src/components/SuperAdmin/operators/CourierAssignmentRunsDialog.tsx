import React, {useCallback, useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {Refresh} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import Department from "../../../class/depots/Department";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import {DepartmentAssignmentRun} from "./model/OperatorOperations";

type CourierAssignmentRunsDialogProps = {
    open: boolean;
    operatorId: string;
    departments: Department[];
    onClose: () => void;
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

function CourierAssignmentRunsDialog({open, operatorId, departments, onClose}: CourierAssignmentRunsDialogProps) {
    const texts = pl.superAdmin.adminActions.runs;
    const [runs, setRuns] = useState<DepartmentAssignmentRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const departmentLabel = (departmentId: number) => departments
        .find((department) => String(department.departmentId) === String(departmentId))?.departmentCode?.value
        || String(departmentId);
    const statusLabel = (status: string) => (texts.statuses as Record<string, string>)[status] || status;

    const loadRuns = useCallback(() => {
        setLoading(true);
        setError("");
        OperatorOperationsService.getCourierAssignmentRuns(operatorId)
            .then((loadedRuns) => setRuns(Array.isArray(loadedRuns) ? loadedRuns : []))
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [operatorId, texts.loadError]);

    useEffect(() => {
        if (open) {
            loadRuns();
        }
    }, [loadRuns, open]);

    return (
        <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open}>
            <DialogTitle>{texts.title}</DialogTitle>
            <DialogContent className="super-admin-assignment-runs">
                {error ? <Alert severity="error">{error}</Alert> : null}
                {loading ? <p className="super-admin-form-hint">{texts.loading}</p> : null}
                {!loading && !error && !runs.length ? <div className="super-admin-directory-empty">{texts.empty}</div> : null}
                {runs.length ? (
                    <div className="super-admin-directory-table super-admin-member-table">
                        <div className="super-admin-directory-row super-admin-directory-head super-admin-assignment-run-row">
                            <span>{texts.columns.department}</span>
                            <span>{texts.columns.window}</span>
                            <span>{texts.columns.status}</span>
                            <span>{texts.columns.discovered}</span>
                            <span>{texts.columns.assigned}</span>
                            <span>{texts.columns.noCourier}</span>
                            <span>{texts.columns.notAtDepartment}</span>
                            <span>{texts.columns.created}</span>
                        </div>
                        {runs.map((run) => (
                            <div className="super-admin-directory-row super-admin-assignment-run-row" key={run.runId}>
                                <span><strong>{departmentLabel(run.departmentId)}</strong></span>
                                <span className="super-admin-audit-time">{formatDateTime(run.windowFrom)} → {formatDateTime(run.windowTo)}</span>
                                <span>
                                    <em className={`super-admin-job-status super-admin-job-status-${run.status.toLowerCase()}`}>{statusLabel(run.status)}</em>
                                    {run.retries > 0 ? <small>{texts.retries.replace("{retries}", String(run.retries))}</small> : null}
                                    {run.error ? <small className="super-admin-job-error" title={run.error}>{run.error}</small> : null}
                                </span>
                                <span>{run.discovered}</span>
                                <span>{run.assigned}</span>
                                <span>{run.noCourier}</span>
                                <span>{run.skippedNotAtDepartment}</span>
                                <span className="super-admin-audit-time">{formatDateTime(run.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                ) : null}
            </DialogContent>
            <DialogActions>
                <button aria-label={texts.refresh} className="super-admin-icon-button" disabled={loading} onClick={loadRuns} type="button">
                    <Refresh fontSize="small" />
                </button>
                <button className="super-admin-secondary-button" onClick={onClose} type="button">{texts.close}</button>
            </DialogActions>
        </Dialog>
    );
}

export default CourierAssignmentRunsDialog;
