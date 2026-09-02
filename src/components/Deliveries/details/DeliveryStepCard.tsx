import React, {useState} from "react";
import {IconButton, Menu, MenuItem} from "components/ui";
import {ChatBubbleOutline, DirectionsCar, EditOutlined, MoreVert, TaskAlt} from "components/ui/icons";
import Department from "../../../class/depots/Department";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import pl from "../../../i18n/translate";
import {departmentCodeLabel, deliveryOutcomeLabel, deliveryStatusLabel, formatDeliveryDateTime} from "../deliveryLabels";
import {DeliveryStep} from "../model/Delivery";
import {courierLabel, DeliveryStepAction} from "./deliveryDetails";
import {useDeliveryPeople} from "./useDeliveryPeople";

type DeliveryStepCardProps = {
    step: DeliveryStep;
    departments: Department[];
    couriers: CourierDto[];
    active: boolean;
    busy: boolean;
    onAction: (action: DeliveryStepAction, step: DeliveryStep) => void;
};

function DeliveryStepCard({step, departments, couriers, active, busy, onAction}: DeliveryStepCardProps) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const {userName} = useDeliveryPeople();

    const select = (action: DeliveryStepAction) => {
        setAnchor(null);
        onAction(action, step);
    };

    return (
        <li>
            <span className="deliveries-step-number">{step.stepNumber}</span>
            <div>
                <div className="deliveries-step-heading">
                    <strong>{deliveryStatusLabel(step.deliveryStatus)}</strong>
                    <IconButton size="small" disabled={busy}
                                aria-label={pl.deliveries.details.stepActions.replace("{step}", String(step.stepNumber))}
                                onClick={(event: React.MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}>
                        <MoreVert/></IconButton>
                    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                        <MenuItem onClick={() => select("stepComment")}>
                            <ChatBubbleOutline/>{pl.deliveries.details.stepComment}</MenuItem>
                        <MenuItem disabled={!active} onClick={() => select("stepStatus")}>
                            <EditOutlined/>{pl.deliveries.details.stepCorrectStatus}</MenuItem>
                        <MenuItem disabled={!active || step.outcome !== "SUCCEEDED"} onClick={() => select("stepSignature")}>
                            <TaskAlt/>{pl.deliveries.details.stepSignature}</MenuItem>
                        <MenuItem disabled={!active} onClick={() => select("stepCarrier")}>
                            <DirectionsCar/>{pl.deliveries.details.stepCarrier}</MenuItem>
                    </Menu>
                </div>
                <p>{deliveryOutcomeLabel(step.outcome)}</p>
                <dl className="deliveries-attempt-details">
                    <div><dt>{pl.deliveries.userLabel}</dt><dd>{userName(step.userId)}</dd></div>
                    <div><dt>{pl.deliveries.departmentLabel}</dt><dd>{departmentCodeLabel(departments, step.departmentId)}</dd></div>
                    <div><dt>{pl.deliveries.courierLabel}</dt><dd>{courierLabel(couriers, step.supplierId)}</dd></div>
                    <div><dt>{pl.deliveries.attemptDateLabel}</dt><dd>{formatDeliveryDateTime(step.attemptedAt)}</dd></div>
                </dl>
                {step.vehicleId && <p>{pl.deliveries.vehicleLabel}: {step.vehicleId}</p>}
                {step.signatureId && <p>{pl.deliveries.details.signatureIdLabel}: {step.signatureId}</p>}
                {step.comment && <p>{step.comment}</p>}
                {step.failureReason && step.failureReason !== step.comment && <p>{step.failureReason}</p>}
            </div>
        </li>
    );
}

export default DeliveryStepCard;
