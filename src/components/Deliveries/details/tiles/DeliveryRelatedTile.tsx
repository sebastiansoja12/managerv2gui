import React from "react";
import {Link} from "react-router-dom";
import pl from "../../../../i18n/translate";
import {deliveryLifecycleLabel, deliveryTargetLabel} from "../../deliveryLabels";
import {DeliveryRelation} from "../../model/Delivery";
import {DeliveryCard} from "./DeliveryTile";

function DeliveryRelatedTile({relations}: {relations: DeliveryRelation[]}) {
    const title = pl.deliveries.details.relatedTitle;
    return (
        <DeliveryCard wide title={title}>
            {relations.length === 0 ? <p className="deliveries-tile-empty">{pl.deliveries.details.noRelated}</p> : (
                <ul className="deliveries-related-list">
                    {relations.map(({relation, delivery}) => (
                        <li key={`${relation}-${delivery.id}`}>
                            <span className="deliveries-badge">{pl.deliveries.details.relation[relation]}</span>
                            <Link className="deliveries-shipment-link" to={`/deliveries/${encodeURIComponent(delivery.id)}/edit`}>
                                {`${deliveryTargetLabel(delivery.targetType)} · ${delivery.shipmentId || delivery.targetId}`}</Link>
                            <span>{deliveryLifecycleLabel(delivery.lifecycleStatus)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </DeliveryCard>
    );
}

export default DeliveryRelatedTile;
