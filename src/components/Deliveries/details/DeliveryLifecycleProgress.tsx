import React from "react";
import pl from "../../../i18n/translate";
import {Delivery} from "../model/Delivery";
import {deliveryLifecycleStage, deliveryLifecycleStages} from "./deliveryDetails";

function DeliveryLifecycleProgress({delivery}: {delivery: Delivery}) {
    const canceled = delivery.lifecycleStatus === "CANCELED";
    const currentIndex = deliveryLifecycleStages.indexOf(deliveryLifecycleStage(delivery));
    return (
        <nav className="deliveries-card deliveries-progress" aria-label={pl.deliveries.details.progressTitle}>
            <ol>
                {deliveryLifecycleStages.map((stage, index) => {
                    const state = canceled ? (index <= currentIndex ? "canceled" : "pending")
                        : index < currentIndex ? "done" : index === currentIndex ? "current" : "pending";
                    return (
                        <li key={stage} data-state={state} aria-current={state === "current" ? "step" : undefined}>
                            <span className="deliveries-progress-dot">{index + 1}</span>
                            <span>{pl.deliveries.details.stage[stage]}</span>
                        </li>
                    );
                })}
            </ol>
            {canceled && <span className="deliveries-badge deliveries-badge-danger">{pl.deliveries.lifecycle.CANCELED}</span>}
        </nav>
    );
}

export default DeliveryLifecycleProgress;
