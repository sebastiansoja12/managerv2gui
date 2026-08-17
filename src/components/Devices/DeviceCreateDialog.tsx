import React, {ChangeEvent, useEffect, useState} from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    TextField,
    Typography,
} from "components/ui";
import DeviceService from "../../hooks/DeviceService";
import UserManagementService from "../../hooks/UserManagementService";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import pl from "../../i18n/translate";
import {User} from "../Users/model/User";
import {
    DeviceCreateRequest,
    DeviceTypeDto,
    deviceTypes,
    DeviceUserTypeDto,
    deviceUserTypes,
    ScannerTypeDto,
    scannerTypes,
    ScanTypeDto,
    scanTypes,
} from "./dto/DeviceDto";

type DeviceCreateDialogProps = {
    open: boolean;
    currentUser: CurrentUserDto | null;
    onClose: () => void;
    onCreated: (externalSystemId: string) => void;
};

type DeviceCreateForm = {
    deviceType: DeviceTypeDto;
    userId: string;
    departmentCode: string;
    deviceUserType: DeviceUserTypeDto;
    externalSystemId: string;
    serialNumber: string;
    manufacturer: string;
    model: string;
    version: string;
    scanType: ScanTypeDto | "";
    scannerType: ScannerTypeDto | "";
};

const initialForm = (currentUser: CurrentUserDto | null): DeviceCreateForm => ({
    deviceType: "SCANNER",
    userId: currentUser ? String(currentUser.userId.value) : "",
    departmentCode: currentUser?.departmentCode || "",
    deviceUserType: currentUser?.role === "SUPPLIER" ? "SUPPLIER" : "OPERATOR",
    externalSystemId: "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    version: "",
    scanType: "",
    scannerType: "",
});

const optionalValue = (value: string) => value.trim() || null;

export const validateDeviceCreateForm = (form: DeviceCreateForm): string | null => {
    const validation = pl.devices.create.validation;
    if (!form.userId) {
        return validation.userRequired;
    }
    if (!form.departmentCode.trim()) {
        return validation.departmentRequired;
    }
    if (!form.externalSystemId.trim()) {
        return validation.externalSystemIdRequired;
    }
    if (!form.manufacturer.trim() && !form.model.trim()) {
        return validation.hardwareRequired;
    }
    return null;
};

export const toDeviceCreateRequest = (form: DeviceCreateForm): DeviceCreateRequest => {
    const scanner = form.deviceType === "SCANNER";
    return {
        userId: {value: Number(form.userId)},
        departmentCode: {value: form.departmentCode.trim()},
        version: optionalValue(form.version) ? {value: form.version.trim()} : null,
        deviceUserType: form.deviceUserType,
        deviceType: form.deviceType,
        scanType: scanner && form.scanType ? form.scanType : null,
        scannerType: scanner && form.scannerType ? form.scannerType : null,
        identity: {
            externalSystemId: form.externalSystemId.trim(),
            serialNumber: optionalValue(form.serialNumber),
        },
        hardware: {
            manufacturer: optionalValue(form.manufacturer),
            model: optionalValue(form.model),
        },
        software: {
            appVersion: optionalValue(form.version),
        },
        network: {},
        security: {},
        location: {},
    };
};

function DeviceCreateDialog({open, currentUser, onClose, onCreated}: DeviceCreateDialogProps) {
    const [form, setForm] = useState<DeviceCreateForm>(() => initialForm(currentUser));
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const translations = pl.devices.create;

    useEffect(() => {
        if (!open) {
            return;
        }
        setForm(initialForm(currentUser));
        setError(null);
        UserManagementService.getAll()
            .then((response) => setUsers(response.data.filter((user) => !user.deleted)))
            .catch((loadError) => setError(getBackendErrorMessage(loadError, translations.messages.usersLoadError)));
    }, [open, currentUser, translations.messages.usersLoadError]);

    const updateField = <K extends keyof DeviceCreateForm>(field: K, value: DeviceCreateForm[K]) => {
        setForm((currentForm) => ({...currentForm, [field]: value}));
    };

    const changeUser = (userId: string) => {
        const selectedUser = users.find((user) => String(user.userId.value) === userId);
        setForm((currentForm) => ({
            ...currentForm,
            userId,
            departmentCode: selectedUser?.departmentCode || currentForm.departmentCode,
            deviceUserType: selectedUser?.role === "SUPPLIER" ? "SUPPLIER" : currentForm.deviceUserType,
        }));
    };

    const submit = async () => {
        const validationError = validateDeviceCreateForm(form);
        setError(validationError);
        if (validationError) {
            return;
        }

        setSaving(true);
        try {
            await DeviceService.createDevice(toDeviceCreateRequest(form));
            onCreated(form.externalSystemId.trim());
        } catch (createError) {
            setError(getBackendErrorMessage(createError, translations.messages.createError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog className="device-create-dialog" fullWidth maxWidth="md" open={open} onClose={saving ? undefined : onClose}>
            <DialogTitle>{translations.title}</DialogTitle>
            <DialogContent className="device-create-dialog-content">
                <Typography className="device-create-description" variant="body2">{translations.description}</Typography>
                {error ? <Alert severity="error">{error}</Alert> : null}
                <div className="device-create-grid">
                    <TextField
                        select
                        label={translations.fields.deviceType}
                        size="small"
                        value={form.deviceType}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("deviceType", event.target.value as DeviceTypeDto)}
                    >
                        {deviceTypes.map((deviceType) => (
                            <MenuItem key={deviceType} value={deviceType}>{translations.deviceTypes[deviceType]}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label={translations.fields.deviceUserType}
                        size="small"
                        value={form.deviceUserType}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("deviceUserType", event.target.value as DeviceUserTypeDto)}
                    >
                        {deviceUserTypes.map((deviceUserType) => (
                            <MenuItem key={deviceUserType} value={deviceUserType}>{translations.deviceUserTypes[deviceUserType]}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        required
                        label={translations.fields.user}
                        size="small"
                        value={form.userId}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => changeUser(event.target.value)}
                    >
                        {users.length ? users.map((user) => (
                            <MenuItem key={String(user.userId.value)} value={String(user.userId.value)}>
                                {`${user.firstName} ${user.lastName}`.trim() || user.username} ({user.username})
                            </MenuItem>
                        )) : currentUser ? (
                            <MenuItem value={String(currentUser.userId.value)}>{currentUser.username}</MenuItem>
                        ) : null}
                    </TextField>
                    <TextField
                        required
                        label={translations.fields.departmentCode}
                        size="small"
                        value={form.departmentCode}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("departmentCode", event.target.value)}
                    />
                    <TextField
                        required
                        className="device-create-wide"
                        helperText={translations.fields.externalSystemIdHelper}
                        label={translations.fields.externalSystemId}
                        size="small"
                        value={form.externalSystemId}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("externalSystemId", event.target.value)}
                    />
                    <TextField
                        label={translations.fields.manufacturer}
                        size="small"
                        value={form.manufacturer}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("manufacturer", event.target.value)}
                    />
                    <TextField
                        label={translations.fields.model}
                        size="small"
                        value={form.model}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("model", event.target.value)}
                    />
                    <TextField
                        label={translations.fields.serialNumber}
                        size="small"
                        value={form.serialNumber}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("serialNumber", event.target.value)}
                    />
                    <TextField
                        label={translations.fields.version}
                        size="small"
                        value={form.version}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("version", event.target.value)}
                    />
                    {form.deviceType === "SCANNER" ? (
                        <>
                            <TextField
                                select
                                label={translations.fields.scanType}
                                size="small"
                                value={form.scanType}
                                onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("scanType", event.target.value as ScanTypeDto | "")}
                            >
                                <MenuItem value="">{translations.fields.notSelected}</MenuItem>
                                {scanTypes.map((scanType) => (
                                    <MenuItem key={scanType} value={scanType}>{translations.scanTypes[scanType]}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label={translations.fields.scannerType}
                                size="small"
                                value={form.scannerType}
                                onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("scannerType", event.target.value as ScannerTypeDto | "")}
                            >
                                <MenuItem value="">{translations.fields.notSelected}</MenuItem>
                                {scannerTypes.map((scannerType) => (
                                    <MenuItem key={scannerType} value={scannerType}>{translations.scannerTypes[scannerType]}</MenuItem>
                                ))}
                            </TextField>
                        </>
                    ) : null}
                </div>
            </DialogContent>
            <DialogActions>
                <Button disabled={saving} variant="outlined" onClick={onClose}>{translations.cancel}</Button>
                <Button disabled={saving} variant="contained" onClick={submit}>{translations.submit}</Button>
            </DialogActions>
        </Dialog>
    );
}

export default DeviceCreateDialog;
