import React from "react";
import {DialogContentText} from "components/ui";
import pl from "../../../../i18n/translate";
import DeliveryDialogFrame from "./DeliveryDialogFrame";

type DeliveryConfirmDialogProps = {
    title: string;
    message: string;
    busy: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

function DeliveryConfirmDialog({title, message, busy, onClose, onConfirm}: DeliveryConfirmDialogProps) {
    return (
        <DeliveryDialogFrame title={title} busy={busy} submitLabel={pl.deliveries.details.confirm} onClose={onClose}
                             onSubmit={onConfirm}>
            <DialogContentText>{message}</DialogContentText>
        </DeliveryDialogFrame>
    );
}

export default DeliveryConfirmDialog;
