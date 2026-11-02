import React from "react";
import {Button} from "components/ui";
import {Close, Download, Print, Refresh, Route, Visibility} from "components/ui/icons";
import pl from "../../../i18n/translate";
import {DeliveryListItem} from "../model/Delivery";

type DeliverySelectionActionsProps = {
    delivery: DeliveryListItem | null;
    busy: boolean;
    onOpen: (delivery: DeliveryListItem) => void;
    onExport: (delivery: DeliveryListItem, format: "excel" | "pdf") => void;
    onCancel: (delivery: DeliveryListItem) => void;
    onSetDestination?: (delivery: DeliveryListItem) => void;
    onResolveDestination?: (delivery: DeliveryListItem) => void;
};

function DeliverySelectionActions({delivery, busy, onOpen, onExport, onCancel, onSetDestination,
                                      onResolveDestination}: DeliverySelectionActionsProps) {
    const cancelable = Boolean(delivery)
        && delivery?.lifecycleStatus !== "CANCELED" && delivery?.lifecycleStatus !== "COMPLETED";

    return (
        <aside className="tm-selection-actions" aria-label={pl.deliveries.actionsTitle}>
            <strong>{pl.deliveries.actionsTitle}</strong>
            <span className="tm-selection-id">{delivery ? delivery.id : pl.deliveries.selectHint}</span>
            <Button disabled={!delivery} startIcon={<Visibility/>} variant="contained"
                    onClick={() => delivery && onOpen(delivery)}>
                {pl.deliveries.edit}
            </Button>
            {onSetDestination && (
                <Button disabled={!delivery || busy} startIcon={<Route/>} variant="outlined"
                        onClick={() => delivery && onSetDestination(delivery)}>
                    {pl.deliveries.incomplete.setDestination}
                </Button>
            )}
            {onResolveDestination && (
                <Button disabled={!delivery || busy} startIcon={<Refresh/>} variant="outlined"
                        onClick={() => delivery && onResolveDestination(delivery)}>
                    {pl.deliveries.incomplete.resolveDestination}
                </Button>
            )}
            <Button disabled={!delivery || busy} startIcon={<Download/>} variant="outlined"
                    onClick={() => delivery && onExport(delivery, "excel")}>
                {pl.deliveries.exportExcel}
            </Button>
            <Button disabled={!delivery || busy} startIcon={<Print/>} variant="outlined"
                    onClick={() => delivery && onExport(delivery, "pdf")}>
                {pl.deliveries.exportPdf}
            </Button>
            <Button className="dlv-danger" disabled={!cancelable || busy} startIcon={<Close/>} variant="outlined"
                    onClick={() => delivery && onCancel(delivery)}>
                {pl.deliveries.cancel}
            </Button>
        </aside>
    );
}

export default DeliverySelectionActions;
