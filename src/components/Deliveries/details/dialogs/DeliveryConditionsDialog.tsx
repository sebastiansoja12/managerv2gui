import React, {useState} from "react";
import {Checkbox, FormControlLabel, MenuItem, TextField} from "components/ui";
import pl from "../../../../i18n/translate";
import {deliveryMethodLabel} from "../../deliveryLabels";
import {Delivery, DeliveryConditionsRequest} from "../../model/Delivery";
import {deliveryMethods, fromDateTimeInput, toDateTimeInput} from "../deliveryDetails";
import DeliveryDialogFrame from "./DeliveryDialogFrame";

type DeliveryConditionsDialogProps = {
    delivery: Delivery;
    busy: boolean;
    onClose: () => void;
    onSubmit: (request: DeliveryConditionsRequest) => void;
};

function DeliveryConditionsDialog({delivery, busy, onClose, onSubmit}: DeliveryConditionsDialogProps) {
    const [method, setMethod] = useState(delivery.method || "");
    const [signatureRequired, setSignatureRequired] = useState(Boolean(delivery.signatureRequired));
    const [instructions, setInstructions] = useState(delivery.instructions || "");
    const [plannedAt, setPlannedAt] = useState(toDateTimeInput(delivery.plannedAt));

    return (
        <DeliveryDialogFrame title={pl.deliveries.details.conditionsTitle} busy={busy} submitDisabled={!method}
                             validationError={method ? null : pl.deliveries.methodRequired} onClose={onClose}
                             onSubmit={() => onSubmit({
                                 method,
                                 signatureRequired,
                                 instructions: instructions.trim() || null,
                                 plannedAt: fromDateTimeInput(plannedAt),
                             })}>
            <TextField select size="small" label={pl.deliveries.methodLabel} value={method}
                       onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setMethod(event.target.value)}>
                <MenuItem value="">{pl.common.dash}</MenuItem>
                {deliveryMethods.map((value) => <MenuItem key={value} value={value}>{deliveryMethodLabel(value)}</MenuItem>)}
            </TextField>
            <FormControlLabel label={pl.deliveries.details.signatureRequiredLabel} control={
                <Checkbox checked={signatureRequired}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSignatureRequired(event.target.checked)}/>
            }/>
            <TextField multiline rows={3} label={pl.deliveries.details.instructionsLabel} value={instructions}
                       onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setInstructions(event.target.value)}/>
            <TextField size="small" type="datetime-local" label={pl.deliveries.plannedLabel} value={plannedAt}
                       onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPlannedAt(event.target.value)}/>
        </DeliveryDialogFrame>
    );
}

export default DeliveryConditionsDialog;
