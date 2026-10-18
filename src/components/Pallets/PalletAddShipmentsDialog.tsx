import React, {useEffect, useState} from "react";
import {createPortal} from "react-dom";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "components/ui";
import {Add} from "components/ui/icons";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import {PalletDto} from "./model/Pallet";
import PalletShipmentPicker, {SelectedShipment} from "./PalletShipmentPicker";
import {palletErrorMessage} from "./palletLabels";

type PalletAddShipmentsDialogProps = {
    open: boolean;
    pallet: PalletDto;
    onClose: () => void;
    onAdded: (pallet: PalletDto, addedCount: number) => void;
};

function PalletAddShipmentsDialog({open, pallet, onClose, onAdded}: PalletAddShipmentsDialogProps) {
    const translations = pl.pallets.details.addFromList;
    const [selected, setSelected] = useState<SelectedShipment[]>([]);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setSelected([]);
            setError(null);
        }
    }, [open]);

    if (!open) {
        return null;
    }

    const addSelected = async () => {
        if (!selected.length) {
            setError(pl.pallets.createFromShipments.validation.selectionRequired);
            return;
        }
        setAdding(true);
        setError(null);
        try {
            const response = await PalletService.addShipments(pallet.palletId,
                selected.map((shipment) => shipment.shipmentId));
            onAdded(response.data, selected.length);
        } catch (addError) {
            setError(palletErrorMessage(addError, translations.error));
        } finally {
            setAdding(false);
        }
    };

    return createPortal(
        <Dialog fullWidth maxWidth="lg" open={open} onClose={() => !adding && onClose()}>
            <DialogTitle>{translations.title.replace("{trackingNumber}", pallet.trackingNumber)}</DialogTitle>
            <DialogContent>
                <DialogContentText>{translations.description}</DialogContentText>
                <PalletShipmentPicker
                    excludedShipmentIds={pallet.shipmentIds.map(String)}
                    selected={selected}
                    onChange={setSelected}
                />
                {error ? <Alert severity="error">{error}</Alert> : null}
            </DialogContent>
            <DialogActions>
                <Button disabled={adding} variant="outlined" onClick={onClose}>{translations.cancel}</Button>
                <Button disabled={adding || !selected.length} startIcon={<Add />} onClick={addSelected}>
                    {adding ? translations.adding : translations.submit.replace("{count}", String(selected.length))}
                </Button>
            </DialogActions>
        </Dialog>,
        document.body,
    );
}

export default PalletAddShipmentsDialog;
