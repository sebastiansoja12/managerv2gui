import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Stack, TextField} from "components/ui";
import {ReportProblemOutlined} from "components/ui/icons";
import {ApiErrorResponse} from "../../api/ApiResult";
import IncidentService from "../../hooks/IncidentService";
import pl from "../../i18n/translate";
import {INCIDENT_CATEGORIES, INCIDENT_SEVERITIES, IncidentCategory, IncidentSeverity} from "./model/Incident";

type IncidentReportDialogProps = {
    open: boolean;
    shipmentId: string | null;
    onClose: () => void;
    onReported: (incidentId: string) => void;
};

function IncidentReportDialog({open, shipmentId, onClose, onReported}: IncidentReportDialogProps) {
    const translations = pl.incidents;
    const [category, setCategory] = useState<IncidentCategory>("DAMAGED");
    const [severity, setSeverity] = useState<IncidentSeverity>("MEDIUM");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setCategory("DAMAGED");
            setSeverity("MEDIUM");
            setDescription("");
            setError(null);
        }
    }, [open]);

    const descriptionMissing = category === "OTHER" && !description.trim();

    const submit = async () => {
        if (!shipmentId || descriptionMissing) {
            setError(descriptionMissing ? translations.report.detailsRequired : translations.report.error);
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const response = await IncidentService.report({
                shipmentId: {value: shipmentId},
                category,
                severity,
                description: description.trim() || null,
            });
            onReported(String(response.data.value));
        } catch (reportError) {
            setError((reportError as ApiErrorResponse | undefined)?.status === 409
                ? translations.report.conflict
                : translations.report.error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => !submitting && onClose()} fullWidth>
            <DialogTitle>{translations.report.title}</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <DialogContentText>{translations.report.description}</DialogContentText>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                    <TextField select fullWidth label={translations.columns.category} size="small" value={category}
                               onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setCategory(event.target.value as IncidentCategory)}>
                        {INCIDENT_CATEGORIES.map((option) => (
                            <MenuItem key={option} value={option}>{translations.categories[option]}</MenuItem>
                        ))}
                    </TextField>
                    <TextField select fullWidth label={translations.columns.severity} size="small" value={severity}
                               onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSeverity(event.target.value as IncidentSeverity)}>
                        {INCIDENT_SEVERITIES.map((option) => (
                            <MenuItem key={option} value={option}>{translations.severities[option]}</MenuItem>
                        ))}
                    </TextField>
                    <TextField fullWidth multiline rows={4} label={translations.report.details} value={description}
                               required={category === "OTHER"} inputProps={{maxLength: 2000}}
                               onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" disabled={submitting} onClick={onClose}>{pl.common.cancel}</Button>
                <Button color="error" disabled={submitting || !shipmentId}
                        startIcon={submitting ? <CircularProgress size={16} /> : <ReportProblemOutlined fontSize="small" />}
                        onClick={submit}>
                    {translations.report.submit}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default IncidentReportDialog;
