import React, {useState} from "react";
import {TextField} from "components/ui";
import pl from "../../../../i18n/translate";
import {DeliveryStep} from "../../model/Delivery";
import {parseOptionalId} from "../deliveryDetails";
import DeliveryDialogFrame from "./DeliveryDialogFrame";

type DeliveryStepSignatureDialogProps = {
    step: DeliveryStep;
    busy: boolean;
    onClose: () => void;
    onSubmit: (signatureId: string) => void;
};

function DeliveryStepSignatureDialog({step, busy, onClose, onSubmit}: DeliveryStepSignatureDialogProps) {
    const [signatureId, setSignatureId] = useState(step.signatureId || "");
    const [validationError, setValidationError] = useState<string | null>(null);

    const submit = () => {
        const parsed = parseOptionalId(signatureId);
        if (!parsed) {
            setValidationError(pl.deliveries.details.invalidNumber);
            return;
        }
        onSubmit(parsed);
    };

    return (
        <DeliveryDialogFrame title={`${pl.deliveries.details.stepSignature} · ${pl.deliveries.stepNumberLabel} ${step.stepNumber}`}
                             busy={busy} validationError={validationError} onClose={onClose} onSubmit={submit}>
            <TextField size="small" label={pl.deliveries.details.signatureIdLabel} value={signatureId} inputMode="numeric"
                       onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSignatureId(event.target.value)}/>
        </DeliveryDialogFrame>
    );
}

export default DeliveryStepSignatureDialog;
