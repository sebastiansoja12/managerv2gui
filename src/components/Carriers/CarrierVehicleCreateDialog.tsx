import React, {FormEvent, useEffect, useState} from "react";
import {createPortal} from "react-dom";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField} from "components/ui";
import {Add} from "components/ui/icons";
import CarrierService from "../../hooks/CarrierService";
import pl from "../../i18n/translate";
import {palletErrorMessage} from "../Pallets/palletLabels";
import {CarrierDto, VEHICLE_TYPES, VehicleTypeDto} from "./model/Carrier";

type CarrierVehicleCreateDialogProps = {
    carrier: CarrierDto | null;
    open: boolean;
    onClose: () => void;
    onCreated: (carrier: CarrierDto) => void;
};

const emptyForm = {registrationNumber: "", vehicleType: "TRUCK" as VehicleTypeDto, trailerRegistrationNumber: "", maxLoadKg: ""};

function CarrierVehicleCreateDialog({carrier, open, onClose, onCreated}: CarrierVehicleCreateDialogProps) {
    const translations = pl.carriers.vehicles;
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setForm(emptyForm);
            setError(null);
        }
    }, [open]);

    if (!open || !carrier) {
        return null;
    }

    const update = (field: keyof typeof emptyForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((current) => ({...current, [field]: event.target.value}));

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.registrationNumber.trim()) {
            setError(translations.registrationRequired);
            return;
        }
        const maxLoad = form.maxLoadKg.trim() ? Number(form.maxLoadKg.trim().replace(",", ".")) : null;
        if (maxLoad !== null && (!Number.isFinite(maxLoad) || maxLoad <= 0)) {
            setError(translations.invalidMaxLoad);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const response = await CarrierService.addVehicle(carrier.carrierId, {
                registrationNumber: form.registrationNumber.trim(),
                vehicleType: form.vehicleType,
                trailerRegistrationNumber: form.trailerRegistrationNumber.trim() || null,
                maxLoadKg: maxLoad,
            });
            onCreated(response.data);
        } catch (saveError) {
            setError(palletErrorMessage(saveError, translations.error));
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <Dialog fullWidth maxWidth="sm" open onClose={() => !saving && onClose()}>
            <form onSubmit={submit}>
                <DialogTitle>{translations.addTitle.replace("{carrier}", carrier.name)}</DialogTitle>
                <DialogContent>
                    <div className="pallet-form-grid">
                        <TextField autoFocus disabled={saving} label={translations.registrationNumber} required size="small" value={form.registrationNumber} onChange={update("registrationNumber")} />
                        <TextField select disabled={saving} label={translations.vehicleType} size="small" value={form.vehicleType} onChange={update("vehicleType")}>
                            {VEHICLE_TYPES.map((type) => <MenuItem key={type} value={type}>{pl.carriers.vehicleType[type]}</MenuItem>)}
                        </TextField>
                        <TextField disabled={saving} label={translations.trailerRegistrationNumber} size="small" value={form.trailerRegistrationNumber} onChange={update("trailerRegistrationNumber")} />
                        <TextField disabled={saving} inputMode="decimal" label={translations.maxLoadKg} size="small" value={form.maxLoadKg} onChange={update("maxLoadKg")} />
                    </div>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} variant="text" onClick={onClose}>{pl.common.cancel}</Button>
                    <Button disabled={saving} startIcon={<Add />} type="submit">{translations.add}</Button>
                </DialogActions>
            </form>
        </Dialog>,
        document.body,
    );
}

export default CarrierVehicleCreateDialog;
