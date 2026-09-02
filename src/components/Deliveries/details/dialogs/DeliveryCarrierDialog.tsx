import React, {useState} from "react";
import {Button, MenuItem, TextField} from "components/ui";
import {CarrierDto} from "../../../Carriers/model/Carrier";
import {courierVehicleOptions, vehicleLabel} from "../../../Couriers/courierOperationalData";
import {CourierDto} from "../../../Couriers/dto/CourierDto";
import pl from "../../../../i18n/translate";
import {DeliveryCarrierRequest} from "../../model/Delivery";
import {courierName, courierSupplierId, findCourier, parseOptionalId} from "../deliveryDetails";
import DeliveryDialogFrame from "./DeliveryDialogFrame";

type DeliveryCarrierDialogProps = {
    title: string;
    couriers: CourierDto[];
    carriers: CarrierDto[];
    supplierId: string | null;
    vehicleId: string | null;
    busy: boolean;
    onClose: () => void;
    onSubmit: (request: DeliveryCarrierRequest) => void;
    onUnassign?: () => void;
};

// The vehicle is not chosen here: it is the one assigned to the selected courier.
const courierVehicleId = (couriers: CourierDto[], supplierId: string, fallback: string | null) => {
    if (!supplierId) {
        return null;
    }
    const courier = findCourier(couriers, supplierId);
    if (!courier) {
        return fallback;
    }
    const value = courier.vehicleId?.value;
    return value === null || value === undefined ? null : String(value);
};

function DeliveryCarrierDialog({title, couriers, carriers, supplierId, vehicleId, busy, onClose, onSubmit,
                                   onUnassign}: DeliveryCarrierDialogProps) {
    const [selectedSupplier, setSelectedSupplier] = useState(supplierId || "");
    const [validationError, setValidationError] = useState<string | null>(null);
    const vehicle = courierVehicleId(couriers, selectedSupplier, vehicleId);
    const vehicleDescription = vehicle
        ? vehicleLabel(courierVehicleOptions(carriers, vehicle), vehicle)
        : selectedSupplier ? pl.deliveries.details.courierHasNoVehicle : pl.common.dash;

    const submit = () => {
        const parsedSupplier = parseOptionalId(selectedSupplier);
        const parsedVehicle = vehicle ? parseOptionalId(vehicle) : null;
        if (parsedSupplier === undefined || parsedVehicle === undefined) {
            setValidationError(pl.deliveries.details.invalidNumber);
            return;
        }
        onSubmit({supplierId: parsedSupplier, vehicleId: parsedVehicle});
    };

    return (
        <DeliveryDialogFrame title={title} busy={busy} validationError={validationError} onClose={onClose}
                             onSubmit={submit} submitDisabled={Boolean(onUnassign) && !selectedSupplier}
                             extraAction={onUnassign && supplierId
                                 ? <Button variant="outlined" color="error" disabled={busy} onClick={onUnassign}>
                                     {pl.deliveries.details.unassignCarrier}</Button>
                                 : undefined}>
            <TextField select size="small" label={pl.deliveries.details.courierSelect} value={selectedSupplier}
                       onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSelectedSupplier(event.target.value)}>
                <MenuItem value="">{pl.common.dash}</MenuItem>
                {supplierId && !couriers.some((courier) => courierSupplierId(courier) === supplierId)
                    && <MenuItem value={supplierId}>{supplierId}</MenuItem>}
                {couriers.filter((courier) => courierSupplierId(courier) !== null).map((courier) => (
                    <MenuItem key={courierSupplierId(courier)} value={courierSupplierId(courier) as string}>
                        {courierName(courier)}</MenuItem>
                ))}
            </TextField>
            <TextField size="small" disabled label={pl.deliveries.details.courierVehicle} value={vehicleDescription}/>
        </DeliveryDialogFrame>
    );
}

export default DeliveryCarrierDialog;
