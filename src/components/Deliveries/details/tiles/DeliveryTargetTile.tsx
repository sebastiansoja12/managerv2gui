import React from "react";
import {Link} from "react-router-dom";
import pl from "../../../../i18n/translate";
import {ShipmentDto} from "../../../Shipment/dto/ShipmentDto";
import {deliveryTargetLabel} from "../../deliveryLabels";
import {Delivery} from "../../model/Delivery";
import {deliveryTargetPath} from "../deliveryTargetLinks";
import DeliveryTile from "./DeliveryTile";

function DeliveryTargetTile({delivery, shipment}: {delivery: Delivery; shipment: ShipmentDto | null}) {
    const recipient = shipment?.recipient;
    return <DeliveryTile title={pl.deliveries.destinationCardTitle} rows={[
        [pl.deliveries.columns.target, delivery.targetType === "PALLET"
            ? <Link className="deliveries-shipment-link" to={deliveryTargetPath(delivery) as string}>
                {`${deliveryTargetLabel(delivery.targetType)} · ${delivery.targetId}`} ↗</Link>
            : `${deliveryTargetLabel(delivery.targetType)} · ${delivery.targetId}`],
        [pl.deliveries.columns.shipment, delivery.shipmentId
            ? <Link className="deliveries-shipment-link"
                    to={`/shipments/${encodeURIComponent(delivery.shipmentId)}/edit`}>{delivery.shipmentId} ↗</Link>
            : pl.common.dash],
        [pl.deliveries.details.trackingNumberLabel, shipment?.trackingNumber?.value || pl.common.dash],
        [pl.deliveries.details.shipmentStatusLabel, shipment
            ? pl.shipments.status[shipment.shipmentStatus] || shipment.shipmentStatus : pl.common.dash],
        [pl.deliveries.details.recipientLabel, recipient
            ? <>{`${recipient.firstName} ${recipient.lastName}`}
                <small className="deliveries-tile-note">{`${recipient.street}, ${recipient.postalCode} ${recipient.city}`}</small></>
            : pl.common.dash],
        [pl.deliveries.details.weightLabel, shipment?.weight
            ? `${shipment.weight.value} ${shipment.weight.unit}` : pl.common.dash],
    ]}/>;
}

export default DeliveryTargetTile;
