import React from "react";
import pl from "../../../../i18n/translate";
import {deliveryMethodLabel, formatDeliveryDateTime} from "../../deliveryLabels";
import {Delivery} from "../../model/Delivery";
import {deliverySla, formatDuration} from "../deliveryDetails";
import DeliveryTile from "./DeliveryTile";

type DeliveryConditionsTileProps = {
    delivery: Delivery;
    onEdit: () => void;
    editDisabled: boolean;
    now?: Date;
};

const slaClass = {
    UNPLANNED: "deliveries-badge",
    ON_TIME: "deliveries-badge deliveries-badge-success",
    AT_RISK: "deliveries-badge deliveries-badge-warning",
    OVERDUE: "deliveries-badge deliveries-badge-danger",
    DELIVERED_ON_TIME: "deliveries-badge deliveries-badge-success",
    DELIVERED_LATE: "deliveries-badge deliveries-badge-danger",
};

function DeliveryConditionsTile({delivery, onEdit, editDisabled, now = new Date()}: DeliveryConditionsTileProps) {
    const sla = deliverySla(delivery, now);
    const planned = delivery.plannedAt ? new Date(delivery.plannedAt).getTime() : null;
    const reference = delivery.deliveredAt ? new Date(delivery.deliveredAt).getTime() : now.getTime();
    const difference = planned === null ? null : planned - reference;
    return <DeliveryTile onEdit={onEdit} editDisabled={editDisabled}
                         title={pl.deliveries.details.conditionsScheduleTitle} rows={[
        [pl.deliveries.methodLabel, deliveryMethodLabel(delivery.method)],
        [pl.deliveries.details.signatureRequiredLabel,
            delivery.signatureRequired ? pl.deliveries.details.yes : pl.deliveries.details.no],
        [pl.deliveries.columns.created, formatDeliveryDateTime(delivery.createdAt)],
        [pl.deliveries.plannedLabel, formatDeliveryDateTime(delivery.plannedAt)],
        [pl.deliveries.deliveredLabel, formatDeliveryDateTime(delivery.deliveredAt)],
        [pl.deliveries.columns.steps, delivery.steps.length],
        [pl.deliveries.details.slaLabel, <span className={slaClass[sla]}>{pl.deliveries.details.sla[sla]}</span>],
        [difference !== null && difference < 0 ? pl.deliveries.details.delayLabel : pl.deliveries.details.remainingLabel,
            difference === null ? pl.common.dash : formatDuration(difference)],
        [pl.deliveries.details.instructionsLabel, delivery.instructions || pl.common.dash],
    ]}/>;
}

export default DeliveryConditionsTile;
