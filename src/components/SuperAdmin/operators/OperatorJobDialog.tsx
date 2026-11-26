import React, {useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Select} from "components/ui";
import {WebhookOutlined} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import {describeOperatorJobRun, OperatorActionResult, operatorJobDescription, operatorJobLabel} from "./operatorJobLabels";

type OperatorJobDialogProps = {
    open: boolean;
    operatorId: string;
    operatorName: string;
    onClose: () => void;
    onFinished: (result: OperatorActionResult) => void;
};

function OperatorJobDialog({open, operatorId, operatorName, onClose, onFinished}: OperatorJobDialogProps) {
    const texts = pl.superAdmin.adminActions.jobDialog;
    const [jobTypes, setJobTypes] = useState<string[]>([]);
    const [jobType, setJobType] = useState("");
    const [loading, setLoading] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }
        setError("");
        setLoading(true);
        OperatorOperationsService.getOperatorJobs()
            .then((loadedJobTypes) => {
                const availableJobTypes = Array.isArray(loadedJobTypes) ? loadedJobTypes : [];
                setJobTypes(availableJobTypes);
                setJobType((current) => (availableJobTypes.includes(current) ? current : availableJobTypes[0] || ""));
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [open, texts.loadError]);

    const runJob = () => {
        if (!jobType) {
            return;
        }
        setStarting(true);
        setError("");
        OperatorOperationsService.runOperatorJob(operatorId, jobType)
            .then((run) => {
                onFinished(describeOperatorJobRun(run));
                onClose();
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, pl.superAdmin.adminActions.results.error)))
            .finally(() => setStarting(false));
    };

    return (
        <Dialog fullWidth maxWidth="sm" onClose={() => !starting && onClose()} open={open}>
            <DialogTitle>{texts.title}</DialogTitle>
            <DialogContent className="super-admin-job-dialog">
                <DialogContentText>{texts.operator.replace("{operator}", operatorName)}</DialogContentText>
                {error ? <Alert severity="error">{error}</Alert> : null}
                {loading ? <p className="super-admin-form-hint">{texts.loading}</p> : null}
                {!loading && !jobTypes.length && !error ? <p className="super-admin-form-hint">{texts.empty}</p> : null}
                {jobTypes.length ? (
                    <label className="super-admin-job-field">
                        <span>{texts.job}</span>
                        <Select aria-label={texts.job} disabled={starting} onChange={(event) => setJobType(event.target.value)} value={jobType}>
                            {jobTypes.map((type) => <option key={type} value={type}>{operatorJobLabel(type)}</option>)}
                        </Select>
                    </label>
                ) : null}
                {jobType ? <p className="super-admin-job-description">{operatorJobDescription(jobType)}</p> : null}
            </DialogContent>
            <DialogActions>
                <button className="super-admin-secondary-button" disabled={starting} onClick={onClose} type="button">{texts.cancel}</button>
                <button className="super-admin-primary-button" disabled={starting || loading || !jobType} onClick={runJob} type="button">
                    <WebhookOutlined fontSize="small" /><span>{starting ? texts.starting : texts.confirm}</span>
                </button>
            </DialogActions>
        </Dialog>
    );
}

export default OperatorJobDialog;
