import React, {FormEvent, useEffect, useState} from "react";
import {Close, ManageAccounts} from "@mui/icons-material";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField} from "@mui/material";
import pl from "../../i18n/translate";
import {UpdateUserRequest, User, userToUpdateRequest} from "./model/User";

type UserEditDialogProps = {
    departments: Array<{code: string; label: string}>;
    departmentsLoading: boolean;
    open: boolean;
    saving: boolean;
    error?: string;
    user?: User;
    onClose: () => void;
    onSave: (request: UpdateUserRequest) => void;
};

function UserEditDialog({departments, departmentsLoading, open, saving, error, user, onClose, onSave}: UserEditDialogProps) {
    const [request, setRequest] = useState<UpdateUserRequest | undefined>();

    useEffect(() => {
        setRequest(user ? userToUpdateRequest(user) : undefined);
    }, [user]);

    if (!request) {
        return null;
    }

    const updateField = (field: keyof UpdateUserRequest, value: string) => {
        setRequest((currentRequest) => currentRequest ? {...currentRequest, [field]: value} : currentRequest);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave(request);
    };

    const invalid = Object.values(request).some((value) => !value.trim());

    return (
        <Dialog
            className="users-edit-dialog"
            fullWidth
            maxWidth="md"
            PaperProps={{className: "users-edit-dialog-paper"}}
            open={open}
            onClose={saving ? undefined : onClose}
        >
            <form onSubmit={submit}>
                <DialogTitle className="users-edit-dialog-title">
                    <span className="users-dialog-heading">
                        <span className="users-dialog-icon">
                            <ManageAccounts />
                        </span>
                        <span>{pl.usersManagement.edit.title}</span>
                    </span>
                    <IconButton aria-label={pl.common.close} disabled={saving} onClick={onClose}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="users-dialog-grid users-edit-dialog-content">
                    {error ? <Alert className="users-dialog-alert" severity="error">{error}</Alert> : null}
                    <TextField
                        autoFocus
                        label={pl.usersManagement.fields.firstName}
                        onChange={(event) => updateField("firstName", event.target.value)}
                        required
                        value={request.firstName}
                    />
                    <TextField
                        label={pl.usersManagement.fields.lastName}
                        onChange={(event) => updateField("lastName", event.target.value)}
                        required
                        value={request.lastName}
                    />
                    <TextField
                        label={pl.usersManagement.fields.username}
                        onChange={(event) => updateField("username", event.target.value)}
                        required
                        value={request.username}
                    />
                    <TextField
                        label={pl.usersManagement.fields.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        required
                        type="email"
                        value={request.email}
                    />
                    <TextField
                        disabled={departmentsLoading || !departments.length}
                        label={pl.usersManagement.fields.departmentCode}
                        onChange={(event) => updateField("departmentCode", event.target.value)}
                        required
                        select
                        value={request.departmentCode}
                    >
                        {!departments.some((department) => department.code === request.departmentCode) && request.departmentCode ? (
                            <MenuItem value={request.departmentCode}>{request.departmentCode}</MenuItem>
                        ) : null}
                        {departmentsLoading || !departments.length ? (
                            <MenuItem disabled value="">
                                {departmentsLoading
                                    ? pl.usersManagement.create.departmentLoading
                                    : pl.usersManagement.create.departmentEmpty}
                            </MenuItem>
                        ) : null}
                        {departments.map((department) => (
                            <MenuItem key={department.code} value={department.code}>{department.label}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label={pl.usersManagement.fields.language}
                        onChange={(event) => updateField("language", event.target.value)}
                        select
                        value={request.language}
                    >
                        {Object.entries(pl.usersManagement.languages).map(([language, label]) => (
                            <MenuItem key={language} value={language}>{label}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions className="users-dialog-actions">
                    <button className="users-secondary-button" disabled={saving} onClick={onClose} type="button">
                        {pl.common.cancel}
                    </button>
                    <button className="users-primary-button" disabled={saving || invalid} type="submit">
                        {saving ? pl.usersManagement.edit.saving : pl.common.saveChanges}
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default UserEditDialog;
