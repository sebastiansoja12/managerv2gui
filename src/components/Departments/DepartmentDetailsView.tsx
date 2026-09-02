import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {Alert, Button, CircularProgress, IconButton, MenuItem, TextField, Typography} from "components/ui";
import {Business, Close, EditOutlined, GroupOutlined, Map as MapIcon, Refresh, Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {useAuthState} from "../../auth/AuthState";
import Department from "../../class/depots/Department";
import departmentService, {DepartmentStatus} from "../../hooks/DepartmentService";
import UserManagementService from "../../hooks/UserManagementService";
import pl from "../../i18n/translate";
import {useDepartmentConfiguration} from "../GlobalConfiguration/model/DepartmentConfiguration";
import DepartmentMapWorkspace from "../DepartmentMap/DepartmentMapWorkspace";
import DeliveryAreaEditor from "./DeliveryAreaEditor";
import {User} from "../Users/model/User";
import {canManageUsers, isAdministrator} from "../Users/model/UserRoleAccess";
import "./styles/departments.css";
import "./styles/department-details.css";

export const DEPARTMENT_TYPES = [
    "HEADQUARTERS",
    "BRANCH",
    "WAREHOUSE",
    "SALES_OFFICE",
    "SERVICE_CENTER",
    "DISTRIBUTION",
    "SORTING_FACILITY",
    "REMOTE_OFFICE",
];

const DEPARTMENT_STATUSES: DepartmentStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED", "DELETED", "SUSPENDED"];

type DepartmentTab = "details" | "map" | "deliveryArea";

type EditForm = {
    city: string;
    street: string;
    postalCode: string;
    countryCode: string;
    taxId: string;
    email: string;
    departmentType: string;
    status: DepartmentStatus;
};

const formFromDepartment = (department: Department): EditForm => ({
    city: department.address?.city || "",
    street: department.address?.street || "",
    postalCode: department.address?.postalCode || "",
    countryCode: department.address?.countryCode || "PL",
    taxId: department.taxId || "",
    email: department.email || "",
    departmentType: department.departmentType || "BRANCH",
    status: (department.status || "ACTIVE") as DepartmentStatus,
});

const valueOrDash = (value?: string | null) => value || pl.common.dash;

const translateDepartmentType = (value?: string | null) => value
    ? pl.departments.type[value as keyof typeof pl.departments.type] || value
    : pl.common.dash;

const translateDepartmentStatus = (value?: string | null) => value
    ? pl.departments.status[value as keyof typeof pl.departments.status] || value
    : pl.common.dash;

const findDepartment = async (departmentId: string, includeArchived: boolean): Promise<Department> => {
    try {
        const response = await departmentService.getById(departmentId);
        if (response.data && response.data.departmentCode) {
            return response.data;
        }
    } catch (byIdError) {
        if (!includeArchived) {
            throw byIdError;
        }
    }
    const active = (await departmentService.getAll()).data || [];
    const archived = includeArchived ? ((await departmentService.getArchived().catch(() => ({data: []}))).data || []) : [];
    const department = active.concat(archived).find((candidate) => String(candidate.departmentId) === departmentId);
    if (!department) {
        throw new Error(pl.departments.view.notFound);
    }
    return department;
};

function DepartmentDetailsView() {
    const translations = pl.departments;
    const {departmentId = ""} = useParams();
    const decodedDepartmentId = decodeURIComponent(departmentId);
    const {user: currentUser} = useAuthState();
    const departmentConfiguration = useDepartmentConfiguration(currentUser?.operatorId?.value);
    const canEdit = canManageUsers(currentUser?.role);
    const canChangeStatus = isAdministrator(currentUser?.role);
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [tab, setTab] = useState<DepartmentTab>("details");
    const [mapOpened, setMapOpened] = useState(false);
    const [deliveryAreaOpened, setDeliveryAreaOpened] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<EditForm | null>(null);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const loaded = await findDepartment(decodedDepartmentId, canChangeStatus);
            setDepartment(loaded);
            setForm(formFromDepartment(loaded));
        } catch (loadError) {
            setDepartment(null);
            setError(getBackendErrorMessage(loadError, translations.view.loadError));
        } finally {
            setLoading(false);
        }
    }, [canChangeStatus, decodedDepartmentId, translations.view.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setUsersLoading(true);
        UserManagementService.getAll()
            .then((response) => setUsers(Array.isArray(response.data) ? response.data : []))
            .catch(() => setUsers([]))
            .finally(() => setUsersLoading(false));
    }, []);

    const departmentCode = department?.departmentCode?.value || "";

    const departmentUsers = useMemo(() => users.filter((user) => user.departmentCode === departmentCode),
        [departmentCode, users]);

    const updateField = (field: keyof EditForm, value: string) => {
        setForm((current) => current ? {...current, [field]: value} : current);
    };

    const save = async () => {
        if (!department || !form) {
            return;
        }
        if (!form.city.trim() || !form.street.trim() || !form.countryCode.trim()) {
            setError(translations.edit.required);
            return;
        }
        if (form.status !== department.status && ((form.status === "ARCHIVED" && departmentConfiguration.preventDepartmentArchiving)
            || (form.status === "DELETED" && departmentConfiguration.preventDepartmentDeletion))) {
            setError(pl.globalConfiguration.departmentConfiguration.restrictedStatus);
            return;
        }
        const requests: Array<Promise<unknown>> = [
            departmentService.updateAddress({
                departmentCode: {value: departmentCode},
                address: {
                    city: form.city.trim(),
                    street: form.street.trim(),
                    postalCode: form.postalCode.trim(),
                    countryCode: form.countryCode.trim().toUpperCase(),
                },
            }),
        ];
        if (form.email.trim() !== (department.email || "")) {
            requests.push(departmentService.changeEmail({departmentCode: {value: departmentCode}, email: form.email.trim()}));
        }
        if (form.taxId.trim() !== (department.taxId || "")) {
            requests.push(departmentService.changeIdentificationNumber({
                departmentCode: {value: departmentCode},
                identificationNumber: form.taxId.trim(),
            }));
        }
        if (form.departmentType !== department.departmentType) {
            requests.push(departmentService.changeType(departmentCode, form.departmentType));
        }
        if (canChangeStatus && form.status !== department.status) {
            requests.push(departmentService.changeStatus({departmentCode: {value: departmentCode}, status: form.status}));
        }
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            await Promise.all(requests);
            setEditing(false);
            setNotice(translations.edit.success);
            await load();
        } catch (saveError) {
            setError(getBackendErrorMessage(saveError, translations.edit.error));
        } finally {
            setSaving(false);
        }
    };

    if (loading && !department) {
        return (
            <main className="department-details-page">
                <p className="department-details-loading"><CircularProgress size={20} /> {translations.view.loading}</p>
            </main>
        );
    }

    if (!department || !form) {
        return (
            <main className="department-details-page">
                <Alert severity="error">{error || translations.view.loadError}</Alert>
                <div><Button startIcon={<Refresh />} variant="outlined" onClick={load}>{pl.common.refresh}</Button></div>
            </main>
        );
    }

    return (
        <main className={`department-details-page${tab === "deliveryArea" ? " delivery-area-tab-active" : ""}`}>
            <section className="department-details-header">
                <div className="departments-heading">
                    <span className="departments-kicker">{translations.view.kicker}</span>
                    <Typography variant="h4">{departmentCode}</Typography>
                    <p>
                        {[department.address?.street, department.address?.postalCode, department.address?.city]
                            .filter(Boolean).join(", ") || pl.common.dash}
                        {" · "}
                        {translateDepartmentType(department.departmentType)}
                        {" · "}
                        <span className={`departments-status departments-status-${(department.status || "unknown").toLowerCase()}`}>
                            {translateDepartmentStatus(department.status)}
                        </span>
                    </p>
                </div>
                <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} onClick={load}>
                    <Refresh fontSize="small" />
                </IconButton>
            </section>

            <nav aria-label={translations.view.sections} className="department-details-tabs" role="tablist">
                <button aria-selected={tab === "details"} className={tab === "details" ? "active" : ""} role="tab" type="button"
                        onClick={() => setTab("details")}>
                    <Business fontSize="small" /> {translations.view.detailsTab}
                </button>
                <button aria-selected={tab === "map"} className={tab === "map" ? "active" : ""} role="tab" type="button"
                        onClick={() => {
                            setTab("map");
                            setMapOpened(true);
                        }}>
                    <MapIcon fontSize="small" /> {translations.view.mapTab}
                </button>
                <button aria-selected={tab === "deliveryArea"} className={tab === "deliveryArea" ? "active" : ""}
                        role="tab" type="button" onClick={() => {
                            setTab("deliveryArea");
                            setDeliveryAreaOpened(true);
                        }}>
                    <MapIcon fontSize="small" /> {translations.view.deliveryAreaTab}
                </button>
            </nav>

            {tab === "details" ? (
                <div className="department-details-content" role="tabpanel" aria-label={translations.view.detailsTab}>
                    {notice ? <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert> : null}
                    {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
                    <section className="department-details-grid">
                        <div className="department-details-panel">
                            <div className="department-details-panel-header">
                                <Typography variant="h5">{translations.view.dataTitle}</Typography>
                                {canEdit && !editing && department.status !== "DELETED" ? (
                                    <Button startIcon={<EditOutlined />} variant="outlined" onClick={() => {
                                        setForm(formFromDepartment(department));
                                        setError(null);
                                        setNotice(null);
                                        setEditing(true);
                                    }}>
                                        {pl.common.edit}
                                    </Button>
                                ) : null}
                            </div>
                            {editing ? (
                                <form className="department-details-form" onSubmit={(event) => {
                                    event.preventDefault();
                                    save();
                                }}>
                                    <p className="department-details-hint">{translations.edit.description}</p>
                                    <div className="departments-create-grid">
                                        <TextField autoFocus label={translations.create.fields.city} required size="small" value={form.city}
                                                   onChange={(event) => updateField("city", event.target.value)} />
                                        <TextField label={translations.create.fields.street} required size="small" value={form.street}
                                                   onChange={(event) => updateField("street", event.target.value)} />
                                        <TextField label={translations.create.fields.postalCode} size="small" value={form.postalCode}
                                                   onChange={(event) => updateField("postalCode", event.target.value)} />
                                        <TextField label={translations.create.fields.countryCode} required size="small"
                                                   value={form.countryCode}
                                                   onChange={(event) => updateField("countryCode", event.target.value)} />
                                        <TextField label={translations.create.fields.taxId} size="small" value={form.taxId}
                                                   onChange={(event) => updateField("taxId", event.target.value)} />
                                        <TextField label={translations.create.fields.email} size="small" type="email" value={form.email}
                                                   onChange={(event) => updateField("email", event.target.value)} />
                                        <TextField select label={translations.create.fields.departmentType} size="small"
                                                   value={form.departmentType}
                                                   onChange={(event) => updateField("departmentType", event.target.value)}>
                                            {DEPARTMENT_TYPES.map((type) => (
                                                <MenuItem key={type} value={type}>{translateDepartmentType(type)}</MenuItem>
                                            ))}
                                        </TextField>
                                        {canChangeStatus ? (
                                            <TextField select label={translations.columns.status} size="small" value={form.status}
                                                       onChange={(event) => updateField("status", event.target.value)}>
                                                {DEPARTMENT_STATUSES.filter((status) => status === department.status
                                                    || !((status === "ARCHIVED" && departmentConfiguration.preventDepartmentArchiving)
                                                        || (status === "DELETED" && departmentConfiguration.preventDepartmentDeletion)))
                                                    .map((status) => (
                                                    <MenuItem key={status} value={status}>{translateDepartmentStatus(status)}</MenuItem>
                                                ))}
                                            </TextField>
                                        ) : null}
                                    </div>
                                    <div className="department-details-actions">
                                        <Button disabled={saving} startIcon={<Close />} variant="outlined"
                                                onClick={() => {
                                                    setEditing(false);
                                                    setForm(formFromDepartment(department));
                                                }}>
                                            {pl.common.cancel}
                                        </Button>
                                        <Button disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                                                type="submit" variant="contained">
                                            {saving ? translations.edit.saving : pl.common.saveChanges}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <dl className="department-details-fields">
                                    <div><dt>{translations.columns.code}</dt><dd>{departmentCode}</dd></div>
                                    <div><dt>{translations.columns.city}</dt><dd>{valueOrDash(department.address?.city)}</dd></div>
                                    <div><dt>{translations.columns.street}</dt><dd>{valueOrDash(department.address?.street)}</dd></div>
                                    <div><dt>{translations.columns.postalCode}</dt><dd>{valueOrDash(department.address?.postalCode)}</dd></div>
                                    <div><dt>{translations.columns.country}</dt><dd>{valueOrDash(department.address?.countryCode)}</dd></div>
                                    <div><dt>{translations.columns.taxId}</dt><dd>{valueOrDash(department.taxId)}</dd></div>
                                    <div><dt>{translations.columns.telephoneNumber}</dt><dd>{valueOrDash(department.telephoneNumber)}</dd></div>
                                    <div><dt>{translations.columns.email}</dt><dd>{valueOrDash(department.email)}</dd></div>
                                    <div><dt>{translations.columns.openingHours}</dt><dd>{valueOrDash(department.openingHours)}</dd></div>
                                    <div><dt>{translations.columns.departmentType}</dt><dd>{translateDepartmentType(department.departmentType)}</dd></div>
                                    <div><dt>{translations.columns.status}</dt><dd>{translateDepartmentStatus(department.status)}</dd></div>
                                    <div>
                                        <dt>{translations.columns.coordinates}</dt>
                                        <dd>{department.coordinates
                                            ? `${department.coordinates.latitude}, ${department.coordinates.longitude}`
                                            : pl.common.dash}</dd>
                                    </div>
                                </dl>
                            )}
                        </div>
                        <div className="department-details-panel">
                            <div className="department-details-panel-header">
                                <Typography variant="h5"><GroupOutlined fontSize="small" /> {translations.columns.users}</Typography>
                                <span className="department-details-hint">
                                    {usersLoading ? pl.common.loading : String(departmentUsers.length)}
                                </span>
                            </div>
                            {departmentUsers.length ? (
                                <table className="departments-users-table">
                                    <thead>
                                    <tr>
                                        <th>{pl.usersManagement.columns.user}</th>
                                        <th>{pl.usersManagement.columns.username}</th>
                                        <th>{pl.usersManagement.columns.role}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {departmentUsers.map((user) => (
                                        <tr key={String(user.userId.value)}>
                                            <td><strong>{user.firstName} {user.lastName}</strong></td>
                                            <td>@{user.username}</td>
                                            <td>{pl.usersManagement.roles[user.role]}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="department-details-hint">{usersLoading ? pl.common.loading : translations.usersDialog.empty}</p>
                            )}
                        </div>
                    </section>
                </div>
            ) : null}
            {mapOpened ? (
                <div aria-label={translations.view.mapTab} className="department-details-content" hidden={tab !== "map"}
                     role="tabpanel">
                    <DepartmentMapWorkspace departmentCode={departmentCode} departmentId={String(department.departmentId)} />
                </div>
            ) : null}
            {deliveryAreaOpened ? (
                <div aria-label={translations.view.deliveryAreaTab} className="department-details-content"
                     hidden={tab !== "deliveryArea"} role="tabpanel">
                    <DeliveryAreaEditor departmentId={String(department.departmentId)} departmentCode={departmentCode}
                                        coordinates={department.coordinates} operatorId={currentUser?.operatorId?.value}
                                        canEdit={canEdit} active={tab === "deliveryArea"} />
                </div>
            ) : null}
        </main>
    );
}

export default DepartmentDetailsView;
