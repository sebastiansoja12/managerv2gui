import React from "react";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import pl from "../../../../i18n/translate";

type DeliveryDialogFrameProps = {
    title: string;
    busy: boolean;
    submitLabel?: string;
    submitDisabled?: boolean;
    validationError?: string | null;
    extraAction?: React.ReactNode;
    onClose: () => void;
    onSubmit: () => void;
    children: React.ReactNode;
};

function DeliveryDialogFrame({title, busy, submitLabel, submitDisabled, validationError, extraAction, onClose, onSubmit,
                                 children}: DeliveryDialogFrameProps) {
    return (
        <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth aria-label={title}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <div className="deliveries-dialog-fields">
                    {validationError && <Alert severity="error">{validationError}</Alert>}
                    {children}
                </div>
            </DialogContent>
            <DialogActions>
                {extraAction}
                <Button variant="outlined" disabled={busy} onClick={onClose}>{pl.deliveries.details.close}</Button>
                <Button variant="contained" disabled={busy || submitDisabled} onClick={onSubmit}>
                    {submitLabel || pl.deliveries.save}</Button>
            </DialogActions>
        </Dialog>
    );
}

export default DeliveryDialogFrame;
