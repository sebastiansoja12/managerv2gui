import React, {FormEvent, useEffect, useState} from "react";
import {createPortal} from "react-dom";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField} from "components/ui";
import {PersonAdd} from "components/ui/icons";
import DriverService from "../../hooks/DriverService";
import pl from "../../i18n/translate";
import {palletErrorMessage} from "../Pallets/palletLabels";
import {CarrierDto, DriverDto} from "./model/Carrier";

type DriverCreateDialogProps = {
    carriers: CarrierDto[];
    open: boolean;
    onClose: () => void;
    onCreated: (driver: DriverDto) => void;
};

const emptyForm = {carrierId: "", firstName: "", lastName: "", phone: "", licenseNumber: ""};

function DriverCreateDialog({carriers, open, onClose, onCreated}: DriverCreateDialogProps) {
    const translations = pl.drivers.create;
    const [form, setForm] = useState(emptyForm);
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

    const update = (field: keyof typeof emptyForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((current) => ({...current, [field]: event.target.value}));

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.carrierId) {
            setError(translations.carrierRequired);
            return;
        }
        if (!form.firstName.trim() || !form.lastName.trim()) {
            setError(translations.nameRequired);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const response = await DriverService.create({
                carrierId: form.carrierId,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phone: form.phone.trim() || null,
                licenseNumber: form.licenseNumber.trim() || null,
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
                <DialogTitle>{translations.title}</DialogTitle>
                <DialogContent>
                    <div className="pallet-form-grid">
                        <TextField select disabled={saving} label={translations.carrier} required size="small" value={form.carrierId} onChange={update("carrierId")}>
                            <MenuItem value="">{translations.selectCarrier}</MenuItem>
                            {carriers.map((carrier) => <MenuItem key={carrier.carrierId} value={String(carrier.carrierId)}>{carrier.name}</MenuItem>)}
                        </TextField>
                        <TextField autoFocus disabled={saving} label={translations.firstName} required size="small" value={form.firstName} onChange={update("firstName")} />
                        <TextField disabled={saving} label={translations.lastName} required size="small" value={form.lastName} onChange={update("lastName")} />
                        <TextField disabled={saving} inputMode="tel" label={translations.phone} size="small" value={form.phone} onChange={update("phone")} />
                        <TextField disabled={saving} label={translations.licenseNumber} size="small" value={form.licenseNumber} onChange={update("licenseNumber")} />
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

export default DriverCreateDialog;
