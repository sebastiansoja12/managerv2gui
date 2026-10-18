import React from "react";
import {createPortal} from "react-dom";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "components/ui";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import PalletCreateOptions from "./PalletCreateOptions";
import {palletCreateFromShipmentsTab, palletDetailsTab} from "./palletNavigation";

type PalletCreateDialogProps = {
    open: boolean;
    onClose: () => void;
    onOpenTab: (tab: AppTabDefinition) => void;
};

function PalletCreateDialog({open, onClose, onOpenTab}: PalletCreateDialogProps) {
    const translations = pl.pallets.createOptions;

    if (!open) {
        return null;
    }

    return createPortal(
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{translations.title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{translations.subtitle}</DialogContentText>
                <PalletCreateOptions
                    onCreated={(pallet) => {
                        onClose();
                        onOpenTab(palletDetailsTab(pallet.trackingNumber));
                    }}
                    onCreateFromShipments={() => {
                        onClose();
                        onOpenTab(palletCreateFromShipmentsTab());
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>{translations.close}</Button>
            </DialogActions>
        </Dialog>,
        document.body,
    );
}

export default PalletCreateDialog;
