import React, {FormEvent, useEffect, useState} from "react";
import {createPortal} from "react-dom";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, TextField, Typography} from "components/ui";
import {PersonAdd} from "components/ui/icons";
import CarrierService from "../../hooks/CarrierService";
import DriverService from "../../hooks/DriverService";
import pl from "../../i18n/translate";
import {TRANSPORT_TYPES, TransportTypeDto} from "../Pallets/model/Pallet";
import {palletErrorMessage, transportTypeLabel} from "../Pallets/palletLabels";
import {CarrierDto, VEHICLE_TYPES, VehicleTypeDto} from "./model/Carrier";

type CarrierCreateDialogProps = {
    open: boolean;
    onClose: () => void;
    onCreated: (carrier: CarrierDto) => void;
};

const emptyForm = {
    name: "",
    taxId: "",
    phone: "",
    email: "",
    defaultTransportType: "EXTERNAL_CARRIER" as TransportTypeDto,
    driverFirstName: "",
    driverLastName: "",
    driverPhone: "",
    vehicleRegistration: "",
    vehicleType: "TRUCK" as VehicleTypeDto,
    trailerRegistration: "",
};

type CarrierForm = typeof emptyForm;

function CarrierCreateDialog({open, onClose, onCreated}: CarrierCreateDialogProps) {
    const translations = pl.carriers.create;
    const [form, setForm] = useState<CarrierForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setForm(emptyForm);
            setError(null);
        }
    }, [open]);

    if (!open) {
        return null;
    }

    const update = (field: keyof CarrierForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((current) => ({...current, [field]: event.target.value}));

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim()) {
            setError(translations.nameRequired);
            return;
        }
        const hasDriver = Boolean(form.driverFirstName.trim() || form.driverLastName.trim());
        if (hasDriver && (!form.driverFirstName.trim() || !form.driverLastName.trim())) {
            setError(translations.driverNameRequired);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            let carrier = (await CarrierService.create({
                name: form.name.trim(),
                taxId: form.taxId.trim() || null,
                phone: form.phone.trim() || null,
                email: form.email.trim() || null,
                defaultTransportType: form.defaultTransportType,
            })).data;
            if (hasDriver) {
                await DriverService.create({
                    carrierId: carrier.carrierId,
                    firstName: form.driverFirstName.trim(),
                    lastName: form.driverLastName.trim(),
                    phone: form.driverPhone.trim() || null,
                });
                carrier = (await CarrierService.get(carrier.carrierId)).data;
            }
            if (form.vehicleRegistration.trim()) {
                carrier = (await CarrierService.addVehicle(carrier.carrierId, {
                    registrationNumber: form.vehicleRegistration.trim(),
                    vehicleType: form.vehicleType,
                    trailerRegistrationNumber: form.trailerRegistration.trim() || null,
                })).data;
            }
            onCreated(carrier);
        } catch (createError) {
            setError(palletErrorMessage(createError, translations.error));
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <Dialog fullWidth maxWidth="md" open={open} onClose={() => !saving && onClose()}>
            <form onSubmit={submit}>
                <DialogTitle>{translations.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{translations.description}</DialogContentText>
                    <div className="pallet-form-grid">
                        <TextField autoFocus disabled={saving} label={translations.name} required size="small" value={form.name} onChange={update("name")} />
                        <TextField disabled={saving} label={translations.taxId} size="small" value={form.taxId} onChange={update("taxId")} />
                        <TextField disabled={saving} label={translations.phone} size="small" value={form.phone} onChange={update("phone")} />
                        <TextField disabled={saving} label={translations.email} size="small" type="email" value={form.email} onChange={update("email")} />
                        <TextField select disabled={saving} label={translations.defaultTransportType} size="small" value={form.defaultTransportType} onChange={update("defaultTransportType")}>
                            {TRANSPORT_TYPES.map((type) => <MenuItem key={type} value={type}>{transportTypeLabel(type)}</MenuItem>)}
                        </TextField>
                    </div>
                    <Typography variant="h6">{translations.firstDriver}</Typography>
                    <div className="pallet-form-grid">
                        <TextField disabled={saving} label={translations.driverFirstName} size="small" value={form.driverFirstName} onChange={update("driverFirstName")} />
                        <TextField disabled={saving} label={translations.driverLastName} size="small" value={form.driverLastName} onChange={update("driverLastName")} />
                        <TextField disabled={saving} label={translations.driverPhone} size="small" value={form.driverPhone} onChange={update("driverPhone")} />
                    </div>
                    <Typography variant="h6">{translations.firstVehicle}</Typography>
                    <div className="pallet-form-grid">
                        <TextField disabled={saving} label={translations.vehicleRegistration} size="small" value={form.vehicleRegistration} onChange={update("vehicleRegistration")} />
                        <TextField select disabled={saving} label={translations.vehicleType} size="small" value={form.vehicleType} onChange={update("vehicleType")}>
                            {VEHICLE_TYPES.map((type) => <MenuItem key={type} value={type}>{pl.carriers.vehicleType[type]}</MenuItem>)}
                        </TextField>
                        <TextField disabled={saving} label={translations.trailerRegistration} size="small" value={form.trailerRegistration} onChange={update("trailerRegistration")} />
                    </div>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} variant="text" onClick={onClose}>{pl.common.cancel}</Button>
                    <Button disabled={saving} startIcon={<PersonAdd />} type="submit">{translations.submit}</Button>
                </DialogActions>
            </form>
        </Dialog>,
        document.body,
    );
}

export default CarrierCreateDialog;
