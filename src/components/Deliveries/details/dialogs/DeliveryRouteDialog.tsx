import React, {useState} from "react";
import {MenuItem, TextField} from "components/ui";
import Department from "../../../../class/depots/Department";
import pl from "../../../../i18n/translate";
import {pickupMethodLabel} from "../../deliveryLabels";
import {PickupPointDetails} from "../../../PickupPoints/model/PickupPoint";
import {Delivery, DeliveryRouteRequest} from "../../model/Delivery";
import {pickupMethods} from "../deliveryDetails";
import {pickupPointLabel} from "../pickupPointLabels";
import DeliveryDialogFrame from "./DeliveryDialogFrame";
import PickupPointPicker from "./PickupPointPicker";

type DeliveryRouteDialogProps = {
    delivery: Delivery;
    departments: Department[];
    pickupPoints: Record<string, PickupPointDetails>;
    busy: boolean;
    onClose: () => void;
    onSubmit: (request: DeliveryRouteRequest) => void;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function DeliveryRouteDialog({delivery, departments, pickupPoints, busy, onClose, onSubmit}: DeliveryRouteDialogProps) {
    const [origin, setOrigin] = useState(delivery.originDepartmentId || "");
    const [destination, setDestination] = useState(delivery.destinationDepartmentId || "");
    const [pickupMethod, setPickupMethod] = useState(delivery.pickupMethod || "");
    const [pickupPointId, setPickupPointId] = useState(delivery.pickupPointId || "");
    const [deliveryPickupPointId, setDeliveryPickupPointId] = useState(delivery.deliveryPickupPointId || "");
    const [pickupPointName, setPickupPointName] = useState(pickupPointLabel(pickupPoints, delivery.pickupPointId));
    const [deliveryPickupPointName, setDeliveryPickupPointName] =
        useState(pickupPointLabel(pickupPoints, delivery.deliveryPickupPointId));
    const [validationError, setValidationError] = useState<string | null>(null);

    const departmentOptions = (selected: string) => [
        <MenuItem key="" value="">{pl.common.dash}</MenuItem>,
        ...(selected && !departments.some((department) => String(department.departmentId) === selected)
            ? [<MenuItem key={selected} value={selected}>{selected}</MenuItem>] : []),
        ...departments.map((department) => (
            <MenuItem key={department.departmentId} value={String(department.departmentId)}>
                {department.departmentCode?.value || department.departmentId}</MenuItem>
        )),
    ];

    const submit = () => {
        const points = [pickupPointId.trim(), deliveryPickupPointId.trim()];
        if (points.some((point) => point && !uuidPattern.test(point))) {
            setValidationError(pl.deliveries.details.invalidPickupPoint);
            return;
        }
        onSubmit({
            originDepartmentId: origin ? Number(origin) : null,
            destinationDepartmentId: destination ? Number(destination) : null,
            pickupMethod: pickupMethod || null,
            pickupPointId: points[0] || null,
            deliveryPickupPointId: points[1] || null,
        });
    };

    return (
        <DeliveryDialogFrame title={pl.deliveries.details.routeTitle} busy={busy} validationError={validationError}
                             onClose={onClose} onSubmit={submit}>
            <TextField select size="small" label={pl.shipments.summary.originDepartment} value={origin}
                       onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setOrigin(event.target.value)}>
                {departmentOptions(origin)}
            </TextField>
            <TextField select size="small" label={pl.shipments.summary.destination} value={destination}
                       onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setDestination(event.target.value)}>
                {departmentOptions(destination)}
            </TextField>
            <TextField select size="small" label={pl.shipments.form.fields.pickupMethod} value={pickupMethod}
                       onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setPickupMethod(event.target.value)}>
                <MenuItem value="">{pl.common.dash}</MenuItem>
                {pickupMethods.map((value) => <MenuItem key={value} value={value}>{pickupMethodLabel(value)}</MenuItem>)}
            </TextField>
            <PickupPointPicker label={pl.shipments.summary.pickupPoint} value={pickupPointId}
                               selectedLabel={pickupPointName} onChange={(id, name) => {
                                   setPickupPointId(id);
                                   setPickupPointName(name);
                               }}/>
            <PickupPointPicker label={pl.shipments.summary.deliveryPickupPoint} value={deliveryPickupPointId}
                               selectedLabel={deliveryPickupPointName} onChange={(id, name) => {
                                   setDeliveryPickupPointId(id);
                                   setDeliveryPickupPointName(name);
                               }}/>
        </DeliveryDialogFrame>
    );
}

export default DeliveryRouteDialog;
