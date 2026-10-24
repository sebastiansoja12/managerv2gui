import React from "react";
import Department from "../../../class/depots/Department";
import {CarrierDto} from "../../Carriers/model/Carrier";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import DeliveryService from "../../../hooks/DeliveryService";
import pl from "../../../i18n/translate";
import {ApiResult} from "../../../api/ApiResult";
import {PickupPointDetails} from "../../PickupPoints/model/PickupPoint";
import {Delivery} from "../model/Delivery";
import {DeliveryDialogState} from "./deliveryDetails";
import DeliveryCarrierDialog from "./dialogs/DeliveryCarrierDialog";
import DeliveryConditionsDialog from "./dialogs/DeliveryConditionsDialog";
import DeliveryConfirmDialog from "./dialogs/DeliveryConfirmDialog";
import DeliveryRouteDialog from "./dialogs/DeliveryRouteDialog";
import DeliveryStatusDialog from "./dialogs/DeliveryStatusDialog";
import DeliveryStepCommentDialog from "./dialogs/DeliveryStepCommentDialog";
import DeliveryStepSignatureDialog from "./dialogs/DeliveryStepSignatureDialog";

type DeliveryDialogHostProps = {
    dialog: DeliveryDialogState | null;
    delivery: Delivery;
    departments: Department[];
    couriers: CourierDto[];
    carriers: CarrierDto[];
    pickupPoints: Record<string, PickupPointDetails>;
    busy: boolean;
    onClose: () => void;
    onRun: (operation: () => Promise<ApiResult<Delivery | void>>) => void;
};

function DeliveryDialogHost({dialog, delivery, departments, couriers, carriers, pickupPoints, busy, onClose, onRun}: DeliveryDialogHostProps) {
    if (!dialog) {
        return null;
    }
    const id = delivery.id;
    switch (dialog.kind) {
        case "carrier":
            return <DeliveryCarrierDialog title={pl.deliveries.details.carrierTitle} couriers={couriers} carriers={carriers}
                                          supplierId={delivery.supplierId} vehicleId={delivery.vehicleId} busy={busy}
                                          onClose={onClose}
                                          onSubmit={(request) => onRun(() => DeliveryService.assignSupplier(id, request))}
                                          onUnassign={() => onRun(() => DeliveryService.unassignSupplier(id))}/>;
        case "route":
            return <DeliveryRouteDialog delivery={delivery} departments={departments} pickupPoints={pickupPoints} busy={busy} onClose={onClose}
                                        onSubmit={(request) => onRun(() => DeliveryService.changeRoute(id, request))}/>;
        case "conditions":
            return <DeliveryConditionsDialog delivery={delivery} busy={busy} onClose={onClose}
                                             onSubmit={(request) => onRun(() => DeliveryService.changeConditions(id, request))}/>;
        case "attempt":
            return <DeliveryStatusDialog title={pl.deliveries.details.registerAttempt} initialStatus={null} withComment
                                         busy={busy} onClose={onClose}
                                         onSubmit={(status, comment) =>
                                             onRun(() => DeliveryService.registerAttempt(id, status, comment))}/>;
        case "complete":
            return <DeliveryConfirmDialog title={pl.deliveries.details.completeDelivery}
                                          message={pl.deliveries.details.completeConfirmation.replace("{id}", id)}
                                          busy={busy} onClose={onClose}
                                          onConfirm={() => onRun(() => DeliveryService.complete(id))}/>;
        case "cancel":
            return <DeliveryConfirmDialog title={pl.deliveries.cancelTitle}
                                          message={pl.deliveries.cancelConfirmation.replace("{id}", id)}
                                          busy={busy} onClose={onClose}
                                          onConfirm={() => onRun(() => DeliveryService.cancel(id))}/>;
        case "stepComment": {
            const step = dialog.step;
            return <DeliveryStepCommentDialog step={step} busy={busy} onClose={onClose}
                                              onSubmit={(comment) => onRun(() =>
                                                  DeliveryService.commentStep(id, step.stepNumber, comment))}/>;
        }
        case "stepStatus": {
            const step = dialog.step;
            return <DeliveryStatusDialog title={`${pl.deliveries.details.stepCorrectStatus} · ${pl.deliveries.stepNumberLabel} ${step.stepNumber}`}
                                         initialStatus={step.deliveryStatus} withComment={false} busy={busy}
                                         onClose={onClose}
                                         onSubmit={(status) => onRun(() =>
                                             DeliveryService.correctStepStatus(id, step.stepNumber, status))}/>;
        }
        case "stepSignature": {
            const step = dialog.step;
            return <DeliveryStepSignatureDialog step={step} busy={busy} onClose={onClose}
                                                onSubmit={(signatureId) => onRun(() =>
                                                    DeliveryService.attachStepSignature(id, step.stepNumber, signatureId))}/>;
        }
        case "stepCarrier": {
            const step = dialog.step;
            return <DeliveryCarrierDialog title={`${pl.deliveries.details.stepCarrier} · ${pl.deliveries.stepNumberLabel} ${step.stepNumber}`}
                                          couriers={couriers} carriers={carriers} supplierId={step.supplierId}
                                          vehicleId={step.vehicleId} busy={busy} onClose={onClose}
                                          onSubmit={(request) => onRun(() =>
                                              DeliveryService.reassignStepCarrier(id, step.stepNumber, request))}/>;
        }
        default:
            return null;
    }
}

export default DeliveryDialogHost;
