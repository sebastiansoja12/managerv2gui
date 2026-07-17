import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField} from "@mui/material";
import pl from "../../i18n/translate";
import {CreateUserRequest, UserRole} from "./model/User";

const emptyRequest = (): CreateUserRequest => ({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    email: "",
    departmentCode: "",
    language: "pl",
    role: "USER",
});

type UserCreateDialogProps = {
    open: boolean;
    saving: boolean;
    error?: string;
    onClose: () => void;
    onSave: (request: CreateUserRequest) => void;
};

function UserCreateDialog({open, saving, error, onClose, onSave}: UserCreateDialogProps) {
    const [request, setRequest] = useState<CreateUserRequest>(emptyRequest());

    useEffect(() => {
        if (open) {
            setRequest(emptyRequest());
        }
    }, [open]);

    const updateField = <K extends keyof CreateUserRequest>(field: K, value: CreateUserRequest[K]) => {
        setRequest((currentRequest) => ({...currentRequest, [field]: value}));
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave(request);
    };

    const invalid = Object.values(request).some((value) => !value.trim());

    return (
        <Dialog fullWidth maxWidth="sm" open={open} onClose={saving ? undefined : onClose}>
            <form onSubmit={submit}>
                <DialogTitle>{pl.usersManagement.create.title}</DialogTitle>
                <DialogContent className="users-dialog-grid">
                    {error ? <Alert className="users-dialog-alert" severity="error">{error}</Alert> : null}
                    <TextField autoFocus label={pl.usersManagement.fields.firstName} required value={request.firstName} onChange={(event) => updateField("firstName", event.target.value)}/>
                    <TextField label={pl.usersManagement.fields.lastName} required value={request.lastName} onChange={(event) => updateField("lastName", event.target.value)}/>
                    <TextField label={pl.usersManagement.fields.username} required value={request.username} onChange={(event) => updateField("username", event.target.value)}/>
                    <TextField autoComplete="new-password" label={pl.usersManagement.fields.password} required type="password" value={request.password} onChange={(event) => updateField("password", event.target.value)}/>
                    <TextField label={pl.usersManagement.fields.email} required type="email" value={request.email} onChange={(event) => updateField("email", event.target.value)}/>
                    <TextField label={pl.usersManagement.fields.departmentCode} required value={request.departmentCode} onChange={(event) => updateField("departmentCode", event.target.value)}/>
                    <TextField label={pl.usersManagement.fields.role} select value={request.role} onChange={(event) => updateField("role", event.target.value as UserRole)}>
                        {Object.entries(pl.usersManagement.roles).map(([role, label]) => <MenuItem key={role} value={role}>{label}</MenuItem>)}
                    </TextField>
                    <TextField label={pl.usersManagement.fields.language} select value={request.language} onChange={(event) => updateField("language", event.target.value)}>
                        {Object.entries(pl.usersManagement.languages).map(([language, label]) => <MenuItem key={language} value={language}>{label}</MenuItem>)}
                    </TextField>
                </DialogContent>
                <DialogActions className="users-dialog-actions">
                    <button className="users-secondary-button" disabled={saving} onClick={onClose} type="button">{pl.common.cancel}</button>
                    <button className="users-primary-button" disabled={saving || invalid} type="submit">
                        {saving ? pl.usersManagement.create.saving : pl.usersManagement.create.save}
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default UserCreateDialog;
