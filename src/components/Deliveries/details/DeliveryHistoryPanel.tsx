import React, {useState} from "react";
import Department from "../../../class/depots/Department";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import pl from "../../../i18n/translate";
import {PickupPointDetails} from "../../PickupPoints/model/PickupPoint";
import {Delivery, DeliveryHistoryEntry, DeliveryStep} from "../model/Delivery";
import DeliveryChangeHistory from "./DeliveryChangeHistory";
import DeliveryStepsTimeline from "./DeliveryStepsTimeline";
import {DeliveryStepAction, isDeliveryActive} from "./deliveryDetails";

type DeliveryHistoryPanelProps = {
    delivery: Delivery;
    history: DeliveryHistoryEntry[];
    departments: Department[];
    couriers: CourierDto[];
    pickupPoints: Record<string, PickupPointDetails>;
    busy: boolean;
    onStepAction: (action: DeliveryStepAction, step: DeliveryStep) => void;
};

type HistoryTab = "attempts" | "changes";

function DeliveryHistoryPanel({delivery, history, departments, couriers, pickupPoints, busy,
                                  onStepAction}: DeliveryHistoryPanelProps) {
    const [tab, setTab] = useState<HistoryTab>("attempts");
    const tabs: Array<[HistoryTab, string]> = [
        ["attempts", pl.deliveries.historyTitle],
        ["changes", pl.deliveries.details.changeHistoryTitle],
    ];
    return (
        <section className="deliveries-card deliveries-history-card">
            <div className="deliveries-tabs" role="tablist">
                {tabs.map(([value, label]) => (
                    <button key={value} type="button" role="tab" aria-selected={tab === value}
                            className={tab === value ? "deliveries-tab deliveries-tab-active" : "deliveries-tab"}
                            onClick={() => setTab(value)}>{label}</button>
                ))}
            </div>
            {tab === "attempts"
                ? <DeliveryStepsTimeline steps={delivery.steps} departments={departments} couriers={couriers}
                                         active={isDeliveryActive(delivery)} busy={busy} onAction={onStepAction}/>
                : <section aria-label={pl.deliveries.details.changeHistoryTitle}>
                    <DeliveryChangeHistory history={history} departments={departments} couriers={couriers}
                                           pickupPoints={pickupPoints}/>
                </section>}
        </section>
    );
}

export default DeliveryHistoryPanel;
