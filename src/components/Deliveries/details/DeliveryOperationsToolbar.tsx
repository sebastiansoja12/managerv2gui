import React from "react";
import {Button} from "components/ui";
import {FileDownload, Print} from "components/ui/icons";
import pl from "../../../i18n/translate";
import {Delivery} from "../model/Delivery";
import {isDeliveryActive} from "./deliveryDetails";

type DeliveryOperationsToolbarProps = {
    delivery: Delivery;
    busy: boolean;
    onExportPdf: () => void;
    onExportExcel: () => void;
};

function DeliveryOperationsToolbar({delivery, busy, onExportPdf, onExportExcel}: DeliveryOperationsToolbarProps) {
    return (
        <section className="deliveries-card deliveries-operations" aria-label={pl.deliveries.details.operationsTitle}>
            <div className="deliveries-operations-group">
                <Button variant="outlined" startIcon={<Print/>} disabled={busy} onClick={onExportPdf}>
                    {pl.deliveries.exportPdf}</Button>
                <Button variant="outlined" startIcon={<FileDownload/>} disabled={busy} onClick={onExportExcel}>
                    {pl.deliveries.exportExcel}</Button>
            </div>
            {!isDeliveryActive(delivery) && <p className="deliveries-operations-hint">{pl.deliveries.details.lockedHint}</p>}
        </section>
    );
}

export default DeliveryOperationsToolbar;
