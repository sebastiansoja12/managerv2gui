import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField} from "components/ui";
import pl from "../../i18n/translate";
import {INCIDENT_RESOLUTIONS, IncidentDto, IncidentResolution} from "./model/Incident";

type IncidentResolveDialogProps = {
    incident: IncidentDto | null;
    resolving: boolean;
    error: string | null;
    onClose: () => void;
    onResolve: (resolution: IncidentResolution, note: string | null) => void;
};

function IncidentResolveDialog({incident, resolving, error, onClose, onResolve}: IncidentResolveDialogProps) {
    const translations = pl.incidents;
    const [resolution, setResolution] = useState<IncidentResolution>("EXPLAINED");
    const [note, setNote] = useState("");

    useEffect(() => {
        if (incident) {
            setResolution("EXPLAINED");
            setNote("");
        }
    }, [incident]);

    return (
        <Dialog open={Boolean(incident)} onClose={() => !resolving && onClose()} fullWidth>
            <DialogTitle>{translations.resolveDialog.title.replace("{incidentId}", String(incident?.incidentId.value ?? ""))}</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                    <TextField select fullWidth label={translations.resolveDialog.resolution} size="small" value={resolution}
                               onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setResolution(event.target.value as IncidentResolution)}>
                        {INCIDENT_RESOLUTIONS.map((option) => (
                            <MenuItem key={option} value={option}>{translations.resolutions[option]}</MenuItem>
                        ))}
                    </TextField>
                    <TextField fullWidth multiline rows={3} label={translations.resolveDialog.note} value={note}
                               inputProps={{maxLength: 2000}}
                               onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" disabled={resolving} onClick={onClose}>{pl.common.cancel}</Button>
                <Button disabled={resolving} startIcon={resolving ? <CircularProgress size={16} /> : undefined}
                        onClick={() => onResolve(resolution, note.trim() || null)}>
                    {translations.resolveDialog.submit}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default IncidentResolveDialog;
