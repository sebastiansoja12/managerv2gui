import React from "react";
import pl from "../../../../i18n/translate";
import {deliveryLifecycleLabel, deliveryStatusLabel, deliveryTypeLabel} from "../../deliveryLabels";
import {Delivery} from "../../model/Delivery";
import DeliveryLifecycleMenu from "../DeliveryLifecycleMenu";
import {attemptLimitReached, DeliveryDialogState, failedAttempts} from "../deliveryDetails";
import DeliveryTile from "./DeliveryTile";

type DeliveryStatusTileProps = {
    delivery: Delivery;
    editDisabled: boolean;
    onOpen: (dialog: DeliveryDialogState) => void;
};

function DeliveryStatusTile({delivery, editDisabled, onOpen}: DeliveryStatusTileProps) {
    const limitReached = attemptLimitReached(delivery);
    return <DeliveryTile wide title={pl.deliveries.deliveryCardTitle}
                         action={<DeliveryLifecycleMenu disabled={editDisabled} onOpen={onOpen}/>} rows={[
        [pl.deliveries.columns.id, delivery.id],
        [pl.deliveries.columns.type, deliveryTypeLabel(delivery.type)],
        [pl.deliveries.columns.status, deliveryStatusLabel(delivery.deliveryStatus)],
        [pl.deliveries.lifecycleLabel, deliveryLifecycleLabel(delivery.lifecycleStatus)],
        [pl.deliveries.details.failedAttemptsLabel,
            <span className={limitReached ? "deliveries-badge deliveries-badge-danger" : "deliveries-badge"}>
                {`${failedAttempts(delivery)} / ${delivery.attemptLimit}`}
                {limitReached && ` · ${pl.deliveries.details.attemptLimitReached}`}
            </span>],
    ]}/>;
}

export default DeliveryStatusTile;
