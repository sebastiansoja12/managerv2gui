import React from "react";
import Department from "../../../../class/depots/Department";
import pl from "../../../../i18n/translate";
import {PickupPointDetails} from "../../../PickupPoints/model/PickupPoint";
import {departmentCodeLabel, pickupMethodLabel} from "../../deliveryLabels";
import {Delivery} from "../../model/Delivery";
import {pickupPointAddress, pickupPointLabel} from "../pickupPointLabels";
import DeliveryTile from "./DeliveryTile";

type DeliveryRouteTileProps = {
    delivery: Delivery;
    departments: Department[];
    pickupPoints: Record<string, PickupPointDetails>;
    onEdit: () => void;
    editDisabled: boolean;
};

const pointValue = (pickupPoints: Record<string, PickupPointDetails>, pickupPointId: string | null) => {
    const point = pickupPointId ? pickupPoints[pickupPointId] : undefined;
    return <>
        {pickupPointLabel(pickupPoints, pickupPointId)}
        {point && <small className="deliveries-tile-note">{pickupPointAddress(point)}</small>}
    </>;
};

function DeliveryRouteTile({delivery, departments, pickupPoints, onEdit, editDisabled}: DeliveryRouteTileProps) {
    return <DeliveryTile onEdit={onEdit} editDisabled={editDisabled} title={pl.deliveries.details.routeTitle} rows={[
        [pl.shipments.summary.originDepartment, departmentCodeLabel(departments, delivery.originDepartmentId)],
        [pl.shipments.summary.destination, departmentCodeLabel(departments, delivery.destinationDepartmentId)],
        [pl.shipments.form.fields.pickupMethod, pickupMethodLabel(delivery.pickupMethod)],
        [pl.shipments.summary.pickupPoint, pointValue(pickupPoints, delivery.pickupPointId)],
        [pl.shipments.summary.deliveryPickupPoint, pointValue(pickupPoints, delivery.deliveryPickupPointId)],
    ]}/>;
}

export default DeliveryRouteTile;
