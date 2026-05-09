import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField} from "@mui/material";
import pl from "../../i18n/translate";
import {User, UserRole} from "./model/User";

type UserRoleDialogProps = {
    open: boolean;
    saving: boolean;
    error?: string;
    user?: User;
    onClose: () => void;
    onSave: (role: UserRole) => void;
};

function UserRoleDialog({open, saving, error, user, onClose, onSave}: UserRoleDialogProps) {
    const [role, setRole] = useState<UserRole>("USER");

    useEffect(() => {
        if (user) {
            setRole(user.role);
        }
    }, [user]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave(role);
    };

    return (
        <Dialog fullWidth maxWidth="xs" open={open} onClose={saving ? undefined : onClose}>
            <form onSubmit={submit}>
                <DialogTitle>{pl.usersManagement.roleDialog.title}</DialogTitle>
                <DialogContent>
                    <p className="users-role-context">
                        {user?.firstName} {user?.lastName} <span>@{user?.username}</span>
                    </p>
                    {error ? <Alert severity="error" sx={{mb: 2}}>{error}</Alert> : null}
                    <TextField
                        fullWidth
                        label={pl.usersManagement.fields.role}
                        onChange={(event) => setRole(event.target.value as UserRole)}
                        select
                        value={role}
                    >
                        {Object.entries(pl.usersManagement.roles).map(([value, label]) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions className="users-dialog-actions">
                    <button className="users-secondary-button" disabled={saving} onClick={onClose} type="button">
                        {pl.common.cancel}
                    </button>
                    <button className="users-primary-button" disabled={saving} type="submit">
                        {saving ? pl.usersManagement.roleDialog.saving : pl.usersManagement.roleDialog.save}
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default UserRoleDialog;
