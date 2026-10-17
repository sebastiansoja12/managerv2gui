import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle, Select} from "components/ui";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import Department from "../../../class/depots/Department";
import pl from "../../../i18n/translate";
import OperatorUserService from "../../../hooks/OperatorUserService";
import {
    CreateOperatorUserRequest,
    createEmptyOperatorUserRequest,
    OperatorUserRole,
} from "./model/OperatorUser";

type OperatorUserDialogProps = {
    open: boolean;
    operatorId: string;
    operatorName: string;
    departments?: Department[];
    onClose: () => void;
    onCreated: () => void;
};

const departmentCodeValue = (department: Department) => department.departmentCode?.value || "";

const noDepartments: Department[] = [];

function OperatorUserDialog({open, operatorId, operatorName, departments = noDepartments, onClose, onCreated}: OperatorUserDialogProps) {
    const [request, setRequest] = useState<CreateOperatorUserRequest>(createEmptyOperatorUserRequest());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setRequest({
                ...createEmptyOperatorUserRequest(),
                departmentCode: departments[0] ? departmentCodeValue(departments[0]) : "",
            });
            setError("");
        }
    }, [open, operatorId, departments]);

    const updateRequest = <K extends keyof CreateOperatorUserRequest>(
        key: K,
        value: CreateOperatorUserRequest[K],
    ) => {
        setRequest((currentRequest) => ({...currentRequest, [key]: value}));
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        OperatorUserService.create(operatorId, request)
            .then(() => {
                onCreated();
                onClose();
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, pl.superAdmin.userDialog.saveError)))
            .finally(() => setSaving(false));
    };

    const requiredFieldsMissing = !request.firstName
        || !request.lastName
        || !request.username
        || !request.password
        || !request.email
        || !request.departmentCode;

    return (
        <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={open} onClose={saving ? undefined : onClose}>
            <form className="super-admin-user-dialog" onSubmit={submit}>
                <DialogTitle>{pl.superAdmin.userDialog.title}</DialogTitle>
                <DialogContent>
                    <p className="super-admin-user-dialog-context">
                        {pl.superAdmin.userDialog.operator}: <strong>{operatorName}</strong> <span>#{operatorId}</span>
                    </p>

                    {error ? <Alert severity="error" sx={{mb: 2}}>{error}</Alert> : null}
                    {!departments.length ? <Alert severity="warning" sx={{mb: 2}}>{pl.superAdmin.workspace.departmentEmpty}</Alert> : null}

                    <div className="super-admin-form-grid">
                        <label>
                            <span>{pl.superAdmin.userDialog.fields.firstName}</span>
                            <input
                                autoFocus
                                required
                                value={request.firstName}
                                onChange={(event) => updateRequest("firstName", event.target.value)}
                            />
                        </label>
                        <label>
                            <span>{pl.superAdmin.userDialog.fields.lastName}</span>
                            <input
                                required
                                value={request.lastName}
                                onChange={(event) => updateRequest("lastName", event.target.value)}
                            />
                        </label>
                        <label>
                            <span>{pl.superAdmin.userDialog.fields.username}</span>
                            <input
                                autoComplete="off"
                                required
                                value={request.username}
                                onChange={(event) => updateRequest("username", event.target.value)}
                            />
                        </label>
                        <label>
                            <span>{pl.superAdmin.userDialog.fields.password}</span>
                            <input
                                autoComplete="new-password"
                                required
                                type="password"
                                value={request.password}
                                onChange={(event) => updateRequest("password", event.target.value)}
                            />
                        </label>
                        <label>
                            <span>{pl.superAdmin.userDialog.fields.email}</span>
                            <input
                                required
                                type="email"
                                value={request.email}
                                onChange={(event) => updateRequest("email", event.target.value)}
                            />
                        </label>
                        <label>
                            <span>{pl.superAdmin.userDialog.fields.departmentCode}</span>
                            <Select
                                aria-label={pl.superAdmin.userDialog.fields.departmentCode}
                                disabled={!departments.length}
                                value={request.departmentCode}
                                onChange={(event) => updateRequest("departmentCode", event.target.value)}
                            >
                                {departments.map((department) => (
                                    <option key={departmentCodeValue(department)} value={departmentCodeValue(department)}>
                                        {departmentCodeValue(department)} · {department.address?.city || pl.common.dash}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <label>
                            <span>{pl.superAdmin.userDialog.fields.role}</span>
                            <Select
                                aria-label={pl.superAdmin.userDialog.fields.role}
                                value={request.role}
                                onChange={(event) => updateRequest("role", event.target.value as OperatorUserRole)}
                            >
                                {Object.entries(pl.superAdmin.userDialog.roles).map(([role, label]) => (
                                    <option key={role} value={role}>{label}</option>
                                ))}
                            </Select>
                        </label>
                        <label>
                            <span>{pl.superAdmin.userDialog.fields.language}</span>
                            <Select
                                aria-label={pl.superAdmin.userDialog.fields.language}
                                value={request.language}
                                onChange={(event) => updateRequest("language", event.target.value)}
                            >
                                {Object.entries(pl.superAdmin.userDialog.languages).map(([language, label]) => (
                                    <option key={language} value={language}>{label}</option>
                                ))}
                            </Select>
                        </label>
                    </div>
                </DialogContent>
                <DialogActions className="super-admin-user-dialog-actions">
                    <button className="super-admin-secondary-button" disabled={saving} onClick={onClose} type="button">
                        {pl.superAdmin.userDialog.cancel}
                    </button>
                    <button className="super-admin-primary-button" disabled={saving || requiredFieldsMissing} type="submit">
                        {saving ? pl.superAdmin.userDialog.saving : pl.superAdmin.userDialog.create}
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default OperatorUserDialog;
