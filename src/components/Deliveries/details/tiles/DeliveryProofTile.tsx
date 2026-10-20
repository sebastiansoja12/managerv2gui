import React from "react";
import pl from "../../../../i18n/translate";
import {SignatureDto} from "../../../Shipment/dto/ShipmentDto";
import {formatDeliveryDateTime} from "../../deliveryLabels";
import {Delivery} from "../../model/Delivery";
import DeliveryTile from "./DeliveryTile";

const signatureImageSource = (signature: string) => {
    const value = signature.trim();
    if (value.startsWith("data:image/")) {
        return value;
    }
    if (value.startsWith("<svg")) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
    }
    return /^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 32 ? `data:image/png;base64,${value}` : null;
};

function DeliveryProofTile({delivery, signature}: {delivery: Delivery; signature: SignatureDto | null}) {
    const source = signature?.signature ? signatureImageSource(signature.signature) : null;
    const signedStep = delivery.steps.find((step) => step.signatureId);
    return (
        <DeliveryTile title={pl.deliveries.details.proofTitle} rows={[
            [pl.deliveries.details.signerLabel, signature?.signerName || pl.common.dash],
            [pl.deliveries.details.signedAtLabel, formatDeliveryDateTime(signature?.signedAt)],
            [pl.deliveries.details.signatureMethodLabel, signature
                ? pl.deliveries.details.signatureMethod[signature.signatureMethod] || signature.signatureMethod
                : pl.common.dash],
            [pl.deliveries.details.signatureIdLabel, signedStep
                ? `${signedStep.signatureId} · ${pl.deliveries.stepNumberLabel} ${signedStep.stepNumber}` : pl.common.dash],
            [pl.deliveries.details.signaturePreviewLabel, source
                ? <img className="deliveries-signature-preview" src={source} alt={pl.deliveries.details.signaturePreviewLabel}/>
                : signature ? pl.deliveries.details.signaturePreviewUnavailable : pl.deliveries.details.noSignature],
        ]}/>
    );
}

export default DeliveryProofTile;
