import React from "react";
import {Button, Chip} from "components/ui";
import {Edit} from "components/ui/icons";
import pl from "../../i18n/translate";
import {ShipmentStatusDto} from "./dto/ShipmentDto";

type ShipmentStatusControlProps = {
    status: ShipmentStatusDto;
    disabled?: boolean;
    onChangeStatus: () => void;
};

const ShipmentStatusControl: React.FC<ShipmentStatusControlProps> = ({status, disabled = false, onChangeStatus}) => (
    <section aria-label={pl.shipments.form.fields.shipmentStatus} className="shipment-status-control">
        <div className="shipment-status-copy">
            <span>{pl.shipments.form.fields.shipmentStatus}</span>
            <strong>{pl.shipments.status[status]}</strong>
        </div>
        <div className="shipment-status-actions">
            <Chip
                className={`tm-status tm-status-${status.toLowerCase()}`}
                label={pl.shipments.status[status]}
                size="small"
            />
            <Button
                disabled={disabled}
                size="small"
                startIcon={<Edit fontSize="small" />}
                variant="outlined"
                onClick={onChangeStatus}
            >
                {pl.shipments.actions.changeStatus}
            </Button>
        </div>
    </section>
);

export default ShipmentStatusControl;
