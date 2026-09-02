import React from "react";
import {CarrierDto} from "../../../Carriers/model/Carrier";
import {courierVehicleOptions, vehicleLabel} from "../../../Couriers/courierOperationalData";
import {CourierDto} from "../../../Couriers/dto/CourierDto";
import pl from "../../../../i18n/translate";
import {Delivery} from "../../model/Delivery";
import {courierLabel, findCourier} from "../deliveryDetails";
import DeliveryTile from "./DeliveryTile";

type DeliveryCarrierTileProps = {
    delivery: Delivery;
    couriers: CourierDto[];
    carriers: CarrierDto[];
    onEdit: () => void;
    editDisabled: boolean;
};

function DeliveryCarrierTile({delivery, couriers, carriers, onEdit, editDisabled}: DeliveryCarrierTileProps) {
    const courier = findCourier(couriers, delivery.supplierId);
    return <DeliveryTile onEdit={onEdit} editDisabled={editDisabled} title={pl.deliveries.details.carrierTitle} rows={[
        [pl.deliveries.supplierLabel, delivery.supplierId
            ? courierLabel(couriers, delivery.supplierId) : pl.deliveries.details.noCarrier],
        [pl.deliveries.vehicleLabel, delivery.vehicleId
            ? vehicleLabel(courierVehicleOptions(carriers, delivery.vehicleId), delivery.vehicleId)
            : pl.common.dash],
        [pl.deliveries.details.courierPhoneLabel, courier?.telephoneNumber
            ? <a className="deliveries-shipment-link" href={`tel:${courier.telephoneNumber}`}>{courier.telephoneNumber}</a>
            : pl.common.dash],
        [pl.deliveries.details.courierDepartmentLabel, courier?.departmentCode?.value || pl.common.dash],
    ]}/>;
}

export default DeliveryCarrierTile;
