import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle, Select} from "components/ui";
import {Close, Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import Department from "../../../class/depots/Department";
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
    departments: Department[];
    onClose: () => void;
    onCreated: () => void;
};

const emptyDepartment: CreateOperatorDepartmentRequest = {
    departmentCode: "",
    city: "",
    street: "",
    postalCode: "",
    countryCode: "PL",
    taxId: "",
    telephoneNumber: "",
    openingHours: "08:00-16:00",
    email: "",
    departmentType: "BRANCH",
};

const emptyCourier: CreateOperatorCourierRequest = {
    supplierCode: "",
    firstName: "",
    lastName: "",
    telephoneNumber: "",
    departmentCode: "",
};

const departmentTextFields = [
    ["departmentCode", pl.departments.create.fields.code, "text"],
    ["city", pl.departments.create.fields.city, "text"],
    ["street", pl.departments.create.fields.street, "text"],
    ["postalCode", pl.departments.create.fields.postalCode, "text"],
    ["countryCode", pl.departments.create.fields.countryCode, "text"],
    ["taxId", pl.departments.create.fields.taxId, "text"],
    ["telephoneNumber", pl.departments.create.fields.telephoneNumber, "tel"],
    ["openingHours", pl.departments.create.fields.openingHours, "text"],
    ["email", pl.departments.create.fields.email, "email"],
] as const;

const courierTextFields = [
    ["firstName", pl.couriers.fields.firstName, "text"],
    ["lastName", pl.couriers.fields.lastName, "text"],
    ["telephoneNumber", pl.couriers.fields.telephoneNumber, "tel"],
] as const;

const departmentCodeValue = (department: Department) => department.departmentCode?.value || "";

function OperatorDirectoryDialog({mode, operatorId, operatorName, departments, onClose, onCreated}: OperatorDirectoryDialogProps) {
    const [department, setDepartment] = useState(emptyDepartment);
    const [courier, setCourier] = useState(emptyCourier);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (mode) {
            setDepartment(emptyDepartment);
            setCourier({...emptyCourier, departmentCode: departments[0] ? departmentCodeValue(departments[0]) : ""});
            setError("");
        }
    }, [mode, departments]);

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
        }).catch((requestError) => setError(getBackendErrorMessage(requestError, pl.superAdmin.workspace.createError)))
            .finally(() => setSaving(false));
    };

    const courierWithoutDepartment = mode === "courier" && !departments.length;

    return (
        <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={Boolean(mode)} onClose={saving ? undefined : onClose}>
            <form className="super-admin-directory-dialog" onSubmit={submit}>
                <DialogTitle>
                    {mode === "department" ? pl.superAdmin.workspace.createDepartment : pl.superAdmin.workspace.createCourier}
                </DialogTitle>
                <DialogContent>
                    <p className="super-admin-directory-context">{operatorName} · #{operatorId}</p>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                    {courierWithoutDepartment ? <Alert severity="warning">{pl.superAdmin.workspace.departmentEmpty}</Alert> : null}
                    {mode === "department" ? (
                        <div className="super-admin-form-grid">
                            {departmentTextFields.map(([key, label, type], index) => (
                                <label key={key} className={key === "street" ? "super-admin-field-wide" : undefined}>
                                    <span>{label}</span>
                                    <input
                                        autoFocus={index === 0}
                                        required
                                        type={type}
                                        value={department[key]}
                                        onChange={(event) => setDepartment((current) => ({...current, [key]: event.target.value}))}
                                    />
                                </label>
                            ))}
                            <label>
                                <span>{pl.departments.create.fields.departmentType}</span>
                                <Select
                                    aria-label={pl.departments.create.fields.departmentType}
                                    value={department.departmentType}
                                    onChange={(event) => setDepartment((current) => ({...current, departmentType: event.target.value}))}
                                >
                                    {Object.entries(pl.departments.type).map(([type, label]) => (
                                        <option key={type} value={type}>{label}</option>
                                    ))}
                                </Select>
                            </label>
                        </div>
                    ) : null}
                    {mode === "courier" ? (
                        <div className="super-admin-form-grid">
                            <label>
                                <span>{pl.couriers.create.fields.supplierCode}</span>
                                <input
                                    placeholder={pl.superAdmin.workspace.supplierCodeOptional}
                                    value={courier.supplierCode}
                                    onChange={(event) => setCourier((current) => ({...current, supplierCode: event.target.value}))}
                                />
                            </label>
                            {courierTextFields.map(([key, label, type], index) => (
                                <label key={key}>
                                    <span>{label}</span>
                                    <input
                                        autoFocus={index === 0}
                                        required
                                        type={type}
                                        value={courier[key]}
                                        onChange={(event) => setCourier((current) => ({...current, [key]: event.target.value}))}
                                    />
                                </label>
                            ))}
                            <label>
                                <span>{pl.couriers.fields.department}</span>
                                <Select
                                    aria-label={pl.couriers.fields.department}
                                    disabled={!departments.length}
                                    value={courier.departmentCode}
                                    onChange={(event) => setCourier((current) => ({...current, departmentCode: event.target.value}))}
                                >
                                    {departments.map((operatorDepartment) => (
                                        <option key={departmentCodeValue(operatorDepartment)} value={departmentCodeValue(operatorDepartment)}>
                                            {departmentCodeValue(operatorDepartment)} · {operatorDepartment.address?.city || pl.common.dash}
                                        </option>
                                    ))}
                                </Select>
                            </label>
                        </div>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <button className="super-admin-secondary-button" disabled={saving} onClick={onClose} type="button">
                        <Close fontSize="small" />
                        <span>{pl.superAdmin.workspace.cancel}</span>
                    </button>
                    <button className="super-admin-primary-button" disabled={saving || courierWithoutDepartment} type="submit">
                        <Save fontSize="small" />
                        <span>{saving ? pl.superAdmin.workspace.saving : pl.superAdmin.workspace.create}</span>
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default OperatorDirectoryDialog;
