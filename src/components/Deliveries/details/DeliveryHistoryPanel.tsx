import React from "react";
import {Typography} from "components/ui";
import {History} from "components/ui/icons";
import Department from "../../../class/depots/Department";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import pl from "../../../i18n/translate";
import {Delivery, DeliveryStep} from "../model/Delivery";
import DeliveryStepsTimeline from "./DeliveryStepsTimeline";
import {DeliveryStepAction, isDeliveryActive} from "./deliveryDetails";

type DeliveryHistoryPanelProps = {
    delivery: Delivery;
    departments: Department[];
    couriers: CourierDto[];
    busy: boolean;
    onStepAction: (action: DeliveryStepAction, step: DeliveryStep) => void;
};

function DeliveryHistoryPanel({delivery, departments, couriers, busy, onStepAction}: DeliveryHistoryPanelProps) {
    return (
        <div className="shipment-dashboard-card dlv-detail-history">
            <div className="shipment-dashboard-card-header">
                <div className="shipment-dashboard-card-title">
                    <span><History fontSize="small"/></span>
                    <Typography variant="h6">{pl.deliveries.historyTitle}</Typography>
                </div>
                <span className="deliveries-badge">{delivery.steps.length}</span>
            </div>
            <div className="dlv-detail-history-body">
                <DeliveryStepsTimeline steps={delivery.steps} departments={departments} couriers={couriers}
                                       active={isDeliveryActive(delivery)} busy={busy} onAction={onStepAction}/>
            </div>
        </div>
    );
}

export default DeliveryHistoryPanel;
