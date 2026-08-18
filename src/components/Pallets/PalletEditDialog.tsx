import React, {FormEvent, useEffect, useState} from "react";
import {createPortal} from "react-dom";
import {Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, TextField} from "components/ui";
import {Save} from "components/ui/icons";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import Department from "../../class/depots/Department";
import {PALLET_PRIORITIES, PALLET_TYPES, PalletDto, PalletHandlingPriorityDto, PalletTypeDto} from "./model/Pallet";
import {palletErrorMessage} from "./palletLabels";

type PalletEditDialogProps = {
    open: boolean;
    pallet: PalletDto;
    departments: Department[];
    departmentLabel: (department?: Department | null) => string;
    onClose: () => void;
    onSaved: (pallet: PalletDto) => void;
};

const text = (value?: number | string | null) => value === null || value === undefined ? "" : String(value);

const decimal = (value: string) => {
    const trimmed = value.trim().replace(",", ".");
    if (!trimmed) {
        return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const initialForm = (pallet: PalletDto) => ({
    palletType: (pallet.palletType || "PARENT") as PalletTypeDto,
    handlingPriority: (pallet.handlingPriority || "LOW") as PalletHandlingPriorityDto,
    refrigerated: Boolean(pallet.refrigerated),
    length: text(pallet.dimension?.length),
    width: text(pallet.dimension?.width),
    height: text(pallet.dimension?.height),
    sealNumber: pallet.sealNumber || "",
    originDepartmentId: text(pallet.originDepartmentId),
    destinationDepartmentId: text(pallet.destinationDepartmentId),
    maxGrossWeight: "",
});

type EditForm = ReturnType<typeof initialForm>;

function PalletEditDialog({open, pallet, departments, departmentLabel, onClose, onSaved}: PalletEditDialogProps) {
    const translations = pl.pallets.edit;
    const [form, setForm] = useState<EditForm>(() => initialForm(pallet));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const maxWeightLocked = pallet.maxGrossWeight !== null && pallet.maxGrossWeight !== undefined && pallet.maxGrossWeight !== "";

    useEffect(() => {
        if (open) {
            setForm(initialForm(pallet));
            setError(null);
        }
    }, [open, pallet]);

    if (!open) {
        return null;
    }

    const update = (field: keyof EditForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((current) => ({...current, [field]: event.target.value}));

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const dimensions = [decimal(form.length), decimal(form.width), decimal(form.height)];
        const filled = dimensions.filter((value) => value !== null);
        if (filled.some((value) => Number.isNaN(value) || (value as number) <= 0) || (filled.length > 0 && filled.length < 3)) {
            setError(translations.invalidDimensions);
            return;
        }
        const maxWeight = decimal(form.maxGrossWeight);
        if (!maxWeightLocked && maxWeight !== null && (Number.isNaN(maxWeight) || maxWeight <= 0)) {
            setError(pl.pallets.details.weight.invalid);
            return;
        }
        if (!maxWeightLocked && maxWeight !== null
            && !window.confirm(pl.pallets.details.weight.confirmMax.replace("{value}", String(maxWeight)))) {
            return;
        }
        setSaving(true);
        setError(null);
        try {
            let updated = (await PalletService.update(pallet.palletId, {
                palletType: form.palletType,
                handlingPriority: form.handlingPriority,
                refrigerated: form.refrigerated,
                length: dimensions[0],
                width: dimensions[1],
                height: dimensions[2],
                sealNumber: form.sealNumber.trim() || null,
            })).data;
            if (form.originDepartmentId !== text(pallet.originDepartmentId)
                || form.destinationDepartmentId !== text(pallet.destinationDepartmentId)) {
                updated = (await PalletService.changeDepartments(pallet.palletId, {
                    originDepartmentId: form.originDepartmentId ? Number(form.originDepartmentId) : null,
                    destinationDepartmentId: form.destinationDepartmentId ? Number(form.destinationDepartmentId) : null,
                })).data;
            }
            if (!maxWeightLocked && maxWeight !== null) {
                updated = (await PalletService.setMaxWeight(pallet.palletId, maxWeight)).data;
            }
            onSaved(updated);
        } catch (saveError) {
            setError(palletErrorMessage(saveError, translations.error));
        } finally {
            setSaving(false);
        }
    };

    const departmentOptions = departments.map((department) => (
        <MenuItem key={department.departmentId} value={String(department.departmentId)}>{departmentLabel(department)}</MenuItem>
    ));

    return createPortal(
        <Dialog fullWidth maxWidth="md" open={open} onClose={() => !saving && onClose()}>
            <form onSubmit={submit}>
                <DialogTitle>{translations.title.replace("{trackingNumber}", pallet.trackingNumber)}</DialogTitle>
                <DialogContent>
                    <div className="pallet-form-grid">
                        <TextField select disabled={saving} label={translations.palletType} size="small" value={form.palletType} onChange={update("palletType")}>
                            {PALLET_TYPES.map((type) => <MenuItem key={type} value={type}>{pl.pallets.palletType[type]}</MenuItem>)}
                        </TextField>
                        <TextField select disabled={saving} label={translations.priority} size="small" value={form.handlingPriority} onChange={update("handlingPriority")}>
                            {PALLET_PRIORITIES.map((priority) => <MenuItem key={priority} value={priority}>{pl.pallets.priority[priority]}</MenuItem>)}
                        </TextField>
                        <TextField disabled={saving} label={translations.sealNumber} size="small" value={form.sealNumber} onChange={update("sealNumber")} />
                        <TextField disabled={saving} inputMode="decimal" label={translations.length} size="small" value={form.length} onChange={update("length")} />
                        <TextField disabled={saving} inputMode="decimal" label={translations.width} size="small" value={form.width} onChange={update("width")} />
                        <TextField disabled={saving} inputMode="decimal" label={translations.height} size="small" value={form.height} onChange={update("height")} />
                        <TextField select disabled={saving} label={pl.pallets.details.departments.origin} size="small" value={form.originDepartmentId} onChange={update("originDepartmentId")}>
                            <MenuItem value="">{pl.pallets.details.departments.none}</MenuItem>
                            {departmentOptions}
                        </TextField>
                        <TextField select disabled={saving} label={pl.pallets.details.departments.destination} size="small" value={form.destinationDepartmentId} onChange={update("destinationDepartmentId")}>
                            <MenuItem value="">{pl.pallets.details.departments.none}</MenuItem>
                            {departmentOptions}
                        </TextField>
                        {maxWeightLocked ? (
                            <TextField disabled label={pl.pallets.details.weight.max} size="small" value={text(pallet.maxGrossWeight)} helperText={pl.pallets.details.weight.maxLocked} />
                        ) : (
                            <TextField disabled={saving} inputMode="decimal" label={pl.pallets.details.weight.max} size="small" value={form.maxGrossWeight} onChange={update("maxGrossWeight")} helperText={translations.maxWeightOnce} />
                        )}
                    </div>
                    <FormControlLabel
                        control={<Checkbox checked={form.refrigerated} disabled={saving} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({...current, refrigerated: event.target.checked}))} />}
                        label={translations.refrigerated}
                    />
                    {error ? <Alert severity="error">{error}</Alert> : null}
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} variant="text" onClick={onClose}>{pl.common.cancel}</Button>
                    <Button disabled={saving} startIcon={<Save />} type="submit">{translations.save}</Button>
                </DialogActions>
            </form>
        </Dialog>,
        document.body,
    );
}

export default PalletEditDialog;
