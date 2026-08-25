import React from "react";
import Department from "../../../class/depots/Department";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import pl from "../../../i18n/translate";
import {PickupPointDetails} from "../../PickupPoints/model/PickupPoint";
import {
    deliveryLifecycleLabel,
    deliveryMethodLabel,
    deliveryStatusLabel,
    departmentCodeLabel,
    formatDeliveryDateTime,
    pickupMethodLabel,
} from "../deliveryLabels";
import {DeliveryHistoryEntry} from "../model/Delivery";
import {courierLabel} from "./deliveryDetails";
import {pickupPointLabel} from "./pickupPointLabels";

type DeliveryChangeHistoryProps = {
    history: DeliveryHistoryEntry[];
    departments: Department[];
    couriers: CourierDto[];
    pickupPoints: Record<string, PickupPointDetails>;
};

export type DeliveryFieldChange = {
    label: string;
    from: string;
    to: string;
};

type TrackedField = {
    label: string;
    value: (entry: DeliveryHistoryEntry) => string;
};

export const describeChanges = (previous: DeliveryHistoryEntry, current: DeliveryHistoryEntry,
                                fields: TrackedField[]): DeliveryFieldChange[] => fields
    .map((field) => ({label: field.label, from: field.value(previous), to: field.value(current)}))
    .filter((change) => change.from !== change.to);

const sortByOccurrence = (history: DeliveryHistoryEntry[]) =>
    [...history].sort((left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime());

function DeliveryChangeHistory({history, departments, couriers, pickupPoints}: DeliveryChangeHistoryProps) {
    if (history.length === 0) {
        return <div className="deliveries-state">{pl.deliveries.details.noHistory}</div>;
    }
    const fields: TrackedField[] = [
        {label: pl.deliveries.columns.status, value: (entry) => deliveryStatusLabel(entry.deliveryStatus)},
        {label: pl.deliveries.lifecycleLabel, value: (entry) => deliveryLifecycleLabel(entry.lifecycleStatus)},
        {label: pl.shipments.summary.originDepartment, value: (entry) => departmentCodeLabel(departments, entry.originDepartmentId)},
        {label: pl.shipments.summary.destination, value: (entry) => departmentCodeLabel(departments, entry.destinationDepartmentId)},
        {label: pl.shipments.form.fields.pickupMethod, value: (entry) => pickupMethodLabel(entry.pickupMethod)},
        {label: pl.deliveries.methodLabel, value: (entry) => deliveryMethodLabel(entry.method)},
        {label: pl.shipments.summary.pickupPoint, value: (entry) => pickupPointLabel(pickupPoints, entry.pickupPointId)},
        {label: pl.shipments.summary.deliveryPickupPoint,
            value: (entry) => pickupPointLabel(pickupPoints, entry.deliveryPickupPointId)},
        {label: pl.deliveries.supplierLabel, value: (entry) => courierLabel(couriers, entry.supplierId)},
        {label: pl.deliveries.vehicleLabel, value: (entry) => entry.vehicleId || pl.common.dash},
        {label: pl.deliveries.details.signatureRequiredLabel,
            value: (entry) => entry.signatureRequired ? pl.deliveries.details.yes : pl.deliveries.details.no},
        {label: pl.deliveries.details.instructionsLabel, value: (entry) => entry.instructions || pl.common.dash},
        {label: pl.deliveries.plannedLabel, value: (entry) => formatDeliveryDateTime(entry.plannedAt)},
        {label: pl.deliveries.columns.steps, value: (entry) => String(entry.stepCount)},
    ];
    const ordered = sortByOccurrence(history);
    return (
        <ol className="deliveries-change-history">
            {ordered.map((entry, index) => {
                const changes = index === 0 ? [] : describeChanges(ordered[index - 1], entry, fields);
                return (
                    <li key={`${entry.occurredAt}-${index}`}>
                        <div className="deliveries-step-heading">
                            <strong>{pl.deliveries.details.historyEvent[entry.eventType]}</strong>
                            <small>{formatDeliveryDateTime(entry.occurredAt)}</small>
                        </div>
                        <p>{pl.deliveries.userLabel}: {entry.userId || pl.common.dash}</p>
                        {changes.length > 0 && (
                            <dl className="deliveries-change-list">
                                {changes.map((change) => (
                                    <div key={change.label}>
                                        <dt>{change.label}</dt>
                                        <dd><s>{change.from}</s> → <b>{change.to}</b></dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </li>
                );
            }).reverse()}
        </ol>
    );
}

export default DeliveryChangeHistory;
