import React from "react";
import Department from "../../../class/depots/Department";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import pl from "../../../i18n/translate";
import {DeliveryStep} from "../model/Delivery";
import DeliveryStepCard from "./DeliveryStepCard";
import {DeliveryStepAction, sortSteps} from "./deliveryDetails";

type DeliveryStepsTimelineProps = {
    steps: DeliveryStep[];
    departments: Department[];
    couriers: CourierDto[];
    active: boolean;
    busy: boolean;
    onAction: (action: DeliveryStepAction, step: DeliveryStep) => void;
};

function DeliveryStepsTimeline({steps, departments, couriers, active, busy, onAction}: DeliveryStepsTimelineProps) {
    return (
        <section aria-label={pl.deliveries.historyTitle}>
            {steps.length === 0 ? <div className="deliveries-state">{pl.deliveries.noSteps}</div> : (
                <ol className="deliveries-timeline">
                    {sortSteps(steps).map((step) => <DeliveryStepCard key={step.stepNumber} step={step}
                                                                      departments={departments} couriers={couriers}
                                                                      active={active} busy={busy}
                                                                      onAction={onAction}/>)}
                </ol>
            )}
        </section>
    );
}

export default DeliveryStepsTimeline;
