import React, {useState} from "react";
import {TextField} from "components/ui";
import pl from "../../../../i18n/translate";
import {DeliveryStep} from "../../model/Delivery";
import DeliveryDialogFrame from "./DeliveryDialogFrame";

type DeliveryStepCommentDialogProps = {
    step: DeliveryStep;
    busy: boolean;
    onClose: () => void;
    onSubmit: (comment: string | null) => void;
};

function DeliveryStepCommentDialog({step, busy, onClose, onSubmit}: DeliveryStepCommentDialogProps) {
    const [comment, setComment] = useState(step.comment || "");

    return (
        <DeliveryDialogFrame title={`${pl.deliveries.details.stepComment} · ${pl.deliveries.stepNumberLabel} ${step.stepNumber}`}
                             busy={busy} submitDisabled={(comment.trim() || null) === step.comment}
                             onClose={onClose} onSubmit={() => onSubmit(comment.trim() || null)}>
            <TextField multiline rows={4} label={pl.deliveries.commentLabel} value={comment}
                       onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setComment(event.target.value)}/>
        </DeliveryDialogFrame>
    );
}

export default DeliveryStepCommentDialog;
