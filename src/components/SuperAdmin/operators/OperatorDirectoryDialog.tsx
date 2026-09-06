import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {Close, Save} from "components/ui/icons";
import OperatorDirectoryService, {
    CreateOperatorCourierRequest,
    CreateOperatorDepartmentRequest,
} from "../../../hooks/OperatorDirectoryService";
import pl from "../../../i18n/translate";

type DirectoryDialogMode = "department" | "courier";

type OperatorDirectoryDialogProps = {
    mode: DirectoryDialogMode | null;
    operatorId: string;
    operatorName: string;
    onClose: () => void;
    onCreated: () => void;
};

const emptyDepartment: CreateOperatorDepartmentRequest = {
    departmentCode: "",
    city: "",
    street: "",
    postalCode: "",
    countryCode: "PL",
};

const emptyCourier: CreateOperatorCourierRequest = {
    supplierCode: "",
    firstName: "",
    lastName: "",
    telephoneNumber: "",
    departmentCode: "",
};

function OperatorDirectoryDialog({mode, operatorId, operatorName, onClose, onCreated}: OperatorDirectoryDialogProps) {
    const [department, setDepartment] = useState(emptyDepartment);
    const [courier, setCourier] = useState(emptyCourier);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode) {
            setDepartment(emptyDepartment);
            setCourier(emptyCourier);
            setError("");
        }
    }, [mode]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!mode) {
            return;
        }

        setSaving(true);
        setError("");
        const request = mode === "department"
            ? OperatorDirectoryService.createDepartment(operatorId, department)
            : OperatorDirectoryService.createCourier(operatorId, courier);

        request.then(() => {
            onCreated();
            onClose();
        }).catch(() => setError(pl.superAdmin.workspace.createError)).finally(() => setSaving(false));
    };

    const departmentFields = [
        ["departmentCode", pl.departments.create.fields.code],
        ["city", pl.departments.create.fields.city],
        ["street", pl.departments.create.fields.street],
        ["postalCode", pl.departments.create.fields.postalCode],
        ["countryCode", pl.departments.create.fields.countryCode],
    ] as const;

    const courierFields = [
        ["supplierCode", pl.couriers.create.fields.supplierCode],
        ["firstName", pl.couriers.fields.firstName],
        ["lastName", pl.couriers.fields.lastName],
        ["telephoneNumber", pl.couriers.fields.telephoneNumber],
        ["departmentCode", pl.couriers.fields.department],
    ] as const;

    return (
        <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={Boolean(mode)} onClose={saving ? undefined : onClose}>
            <form className="super-admin-directory-dialog" onSubmit={submit}>
                <DialogTitle>
                    {mode === "department" ? pl.superAdmin.workspace.createDepartment : pl.superAdmin.workspace.createCourier}
                </DialogTitle>
                <DialogContent>
                    <p className="super-admin-directory-context">{operatorName} · #{operatorId}</p>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                    <div className="super-admin-form-grid">
                        {(mode === "department" ? departmentFields : courierFields).map(([key, label], index) => {
                            const value = mode === "department"
                                ? department[key as keyof CreateOperatorDepartmentRequest]
                                : courier[key as keyof CreateOperatorCourierRequest];
                            return (
                                <label key={key} className={index === 2 && mode === "department" ? "super-admin-field-wide" : undefined}>
                                    <span>{label}</span>
                                    <input
                                        autoFocus={index === 0}
                                        required
                                        value={value}
                                        onChange={(event) => {
                                            if (mode === "department") {
                                                setDepartment((current) => ({...current, [key]: event.target.value}));
                                            } else {
                                                setCourier((current) => ({...current, [key]: event.target.value}));
                                            }
                                        }}
                                    />
                                </label>
                            );
                        })}
                    </div>
                </DialogContent>
                <DialogActions>
                    <button className="super-admin-secondary-button" disabled={saving} onClick={onClose} type="button">
                        <Close fontSize="small" />
                        <span>{pl.superAdmin.workspace.cancel}</span>
                    </button>
                    <button className="super-admin-primary-button" disabled={saving} type="submit">
                        <Save fontSize="small" />
                        <span>{saving ? pl.superAdmin.workspace.saving : pl.superAdmin.workspace.create}</span>
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default OperatorDirectoryDialog;
