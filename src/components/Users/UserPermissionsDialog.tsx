import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import pl from "../../i18n/translate";
import {permissionDefinitions, User, UserPermission} from "./model/User";

type UserPermissionsDialogProps = {
    open: boolean;
    saving: boolean;
    error?: string;
    user?: User;
    onClose: () => void;
    onSave: (permissions: UserPermission[]) => void;
};

function UserPermissionsDialog({open, saving, error, user, onClose, onSave}: UserPermissionsDialogProps) {
    const [selected, setSelected] = useState<UserPermission[]>([]);

    useEffect(() => {
        const assignedValues = new Set(user?.rolePermissions?.map((permission) => permission.role) || []);
        setSelected(permissionDefinitions.filter((permission) => assignedValues.has(permission.apiValue)).map((permission) => permission.key));
    }, [user]);

    const toggle = (permission: UserPermission) => {
        setSelected((current) => current.includes(permission)
            ? current.filter((value) => value !== permission)
            : current.concat(permission));
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave(selected);
    };

    return (
        <Dialog fullWidth maxWidth="sm" open={open} onClose={saving ? undefined : onClose}>
            <form onSubmit={submit}>
                <DialogTitle>{pl.usersManagement.permissionsDialog.title}</DialogTitle>
                <DialogContent>
                    <p className="users-role-context">{user?.firstName} {user?.lastName}<span>@{user?.username}</span></p>
                    {error ? <Alert severity="error" sx={{mb: 2}}>{error}</Alert> : null}
                    <div className="users-permissions-grid">
                        {permissionDefinitions.map((permission) => {
                            const adminPermissionDisabled = permission.key.startsWith("ROLE_ADMIN_") && user?.role !== "ADMIN";
                            return (
                                <label className={adminPermissionDisabled ? "is-disabled" : ""} key={permission.key}>
                                    <Checkbox
                                        checked={selected.includes(permission.key)}
                                        disabled={adminPermissionDisabled || saving}
                                        onChange={() => toggle(permission.key)}
                                        size="small"
                                    />
                                    <span>{pl.usersManagement.permissions[permission.key]}</span>
                                </label>
                            );
                        })}
                    </div>
                </DialogContent>
                <DialogActions className="users-dialog-actions">
                    <button className="users-secondary-button" disabled={saving} onClick={onClose} type="button">{pl.common.cancel}</button>
                    <button className="users-primary-button" disabled={saving} type="submit">
                        {saving ? pl.usersManagement.permissionsDialog.saving : pl.usersManagement.permissionsDialog.save}
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default UserPermissionsDialog;
