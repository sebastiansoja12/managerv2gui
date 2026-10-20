import React, {useState} from "react";
import {Button, MenuItem, TextField} from "components/ui";
import {CourierDto} from "../../../Couriers/dto/CourierDto";
import pl from "../../../../i18n/translate";
import {DeliveryCarrierRequest} from "../../model/Delivery";
import {courierName, courierSupplierId, parseOptionalNumber} from "../deliveryDetails";
import DeliveryDialogFrame from "./DeliveryDialogFrame";

type DeliveryCarrierDialogProps = {
    title: string;
    couriers: CourierDto[];
    supplierId: string | null;
    vehicleId: string | null;
    busy: boolean;
    onClose: () => void;
    onSubmit: (request: DeliveryCarrierRequest) => void;
    onUnassign?: () => void;
};

function DeliveryCarrierDialog({title, couriers, supplierId, vehicleId, busy, onClose, onSubmit,
                                   onUnassign}: DeliveryCarrierDialogProps) {
    const [selectedSupplier, setSelectedSupplier] = useState(supplierId || "");
    const [vehicle, setVehicle] = useState(vehicleId || "");
    const [validationError, setValidationError] = useState<string | null>(null);

    const changeSupplier = (value: string) => {
        setSelectedSupplier(value);
        const courier = couriers.find((candidate) => String(courierSupplierId(candidate)) === value);
        if (courier?.vehicleId?.value) {
            setVehicle(String(courier.vehicleId.value));
        }
    };

    const submit = () => {
        const parsedSupplier = parseOptionalNumber(selectedSupplier);
        const parsedVehicle = parseOptionalNumber(vehicle);
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
                       onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeSupplier(event.target.value)}>
                <MenuItem value="">{pl.common.dash}</MenuItem>
                {supplierId && !couriers.some((courier) => String(courierSupplierId(courier)) === supplierId)
                    && <MenuItem value={supplierId}>{supplierId}</MenuItem>}
                {couriers.filter((courier) => courierSupplierId(courier) !== null).map((courier) => (
                    <MenuItem key={courierSupplierId(courier)} value={String(courierSupplierId(courier))}>
                        {courierName(courier)}</MenuItem>
                ))}
            </TextField>
            <TextField size="small" label={pl.deliveries.details.vehicleInput} value={vehicle} inputMode="numeric"
                       onChange={(event: React.ChangeEvent<HTMLInputElement>) => setVehicle(event.target.value)}/>
        </DeliveryDialogFrame>
    );
}

export default DeliveryCarrierDialog;
