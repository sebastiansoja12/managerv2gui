import React, {FormEvent, useEffect, useState} from "react";
import {createPortal} from "react-dom";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField} from "components/ui";
import {Save} from "components/ui/icons";
import pl from "../../i18n/translate";
import {palletErrorMessage} from "../Pallets/palletLabels";

export type FieldOption = {value: string; label: string};

export type EditedField = {
    title: string;
    label: string;
    value: string;
    required?: boolean;
    inputMode?: "text" | "decimal" | "email" | "tel";
    options?: FieldOption[];
    save: (value: string | null) => Promise<void>;
};

type FieldEditDialogProps = {
    field: EditedField | null;
    onClose: () => void;
    onSaved: () => void;
};

function FieldEditDialog({field, onClose, onSaved}: FieldEditDialogProps) {
    const translations = pl.carriers.fieldEdit;
    const [value, setValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setValue(field?.value || "");
        setError(null);
    }, [field]);

    if (!field) {
        return null;
    }

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (field.required && !trimmed) {
            setError(translations.required);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await field.save(trimmed || null);
            onSaved();
        } catch (saveError) {
            setError(palletErrorMessage(saveError, translations.error));
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <Dialog fullWidth maxWidth="xs" open onClose={() => !saving && onClose()}>
            <form onSubmit={submit}>
                <DialogTitle>{field.title}</DialogTitle>
                <DialogContent>
                    {field.options ? (
                        <TextField select autoFocus disabled={saving} label={field.label} size="small" value={value}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setValue(event.target.value)}>
                            {field.options.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                        </TextField>
                    ) : (
                        <TextField autoFocus disabled={saving} inputMode={field.inputMode} label={field.label} required={field.required}
                                   size="small" value={value}
                                   onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value)} />
                    )}
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

export default FieldEditDialog;
