import React, {useState} from "react";
import {MenuItem, TextField} from "components/ui";
import pl from "../../../../i18n/translate";
import {deliveryStatusLabel} from "../../deliveryLabels";
import {deliveryStatuses} from "../deliveryDetails";
import DeliveryDialogFrame from "./DeliveryDialogFrame";

type DeliveryStatusDialogProps = {
    title: string;
    initialStatus: string | null;
    withComment: boolean;
    busy: boolean;
    onClose: () => void;
    onSubmit: (deliveryStatus: string, comment: string | null) => void;
};

function DeliveryStatusDialog({title, initialStatus, withComment, busy, onClose, onSubmit}: DeliveryStatusDialogProps) {
    const [status, setStatus] = useState(initialStatus || "");
    const [comment, setComment] = useState("");

    return (
        <DeliveryDialogFrame title={title} busy={busy} submitDisabled={!status || status === initialStatus}
                             onClose={onClose} onSubmit={() => onSubmit(status, comment.trim() || null)}>
            <TextField select size="small" label={pl.deliveries.details.attemptStatus} value={status}
                       onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value)}>
                <MenuItem value="">{pl.common.dash}</MenuItem>
                {deliveryStatuses.map((value) => <MenuItem key={value} value={value}>{deliveryStatusLabel(value)}</MenuItem>)}
            </TextField>
            {withComment && <TextField multiline rows={3} label={pl.deliveries.commentLabel} value={comment}
                                       onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                                           setComment(event.target.value)}/>}
        </DeliveryDialogFrame>
    );
}

export default DeliveryStatusDialog;
