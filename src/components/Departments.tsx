import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";
import {
    AddBusiness,
    ArchiveOutlined,
    Business,
    Close,
    DeleteOutline,
    EditOutlined,
    GroupOutlined,
    LocationCity,
    Phone,
    Public,
    Refresh,
    Save,
    Search,
    Tag,
    UnarchiveOutlined,
    WarningAmberOutlined,
} from "@mui/icons-material";
import {getBackendErrorMessage} from "../api/errorMessage";
import {useAuthState} from "../auth/AuthState";
import Department from "../class/depots/Department";
import departmentService, {DepartmentCreateRequest, DepartmentStatus} from "../hooks/DepartmentService";
import UserManagementService from "../hooks/UserManagementService";
import pl from "../i18n/translate";
import {User} from "./Users/model/User";
import "./Departments/styles/departments.css";

const DEPARTMENT_TYPES = [
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

const emptyDepartmentForm = {
    departmentCode: "",
    city: "",
    street: "",
    postalCode: "",
    nip: "",
    telephoneNumber: "",
    openingHours: "08:00-16:00",
    email: "",
    countryCode: "PL",
    departmentType: "BRANCH",
};

const emptyEditForm = {
    city: "",
    street: "",
    postalCode: "",
    countryCode: "PL",
    taxId: "",
    email: "",
    departmentType: "BRANCH",
    status: "ACTIVE" as DepartmentStatus,
};

const emptyFilters = {
    code: "",
    country: "",
    type: "",
};

const getDepartmentCode = (department: Department) => department.departmentCode?.value || "";

const valueOrDash = (value?: string | null) => value || pl.common.dash;

const translateDepartmentType = (value?: string | null) => value
    ? pl.departments.type[value as keyof typeof pl.departments.type] || value
    : pl.common.dash;

const translateDepartmentStatus = (value?: string | null) => value
    ? pl.departments.status[value as keyof typeof pl.departments.status] || value
    : pl.common.dash;

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(pl.common.locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatCoordinates = (department: Department) => {
    if (!department.coordinates) {
        return pl.common.dash;
    }

    return `${department.coordinates.latitude}, ${department.coordinates.longitude}`;
};

const Departments: React.FC = () => {
    const {user: currentUser} = useAuthState();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [usersLoading, setUsersLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [filters, setFilters] = useState({...emptyFilters});
    const [createForm, setCreateForm] = useState({...emptyDepartmentForm});
    const [editForm, setEditForm] = useState({...emptyEditForm});
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [editedDepartment, setEditedDepartment] = useState<Department | null>(null);
    const [usersDepartment, setUsersDepartment] = useState<Department | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        department: Department;
        status: "ARCHIVED" | "DELETED";
    } | null>(null);
    const createTranslations = pl.departments.create;
    const editTranslations = pl.departments.edit;
    const canViewArchivedDepartments = currentUser?.role === "ADMIN";
    const canArchiveDepartments = canViewArchivedDepartments || currentUser?.role === "MANAGER";

    const cityCount = useMemo(
        () => new Set(departments.map((department) => department.address?.city).filter(Boolean)).size,
        [departments],
    );
    const countryCount = useMemo(
        () => new Set(departments.map((department) => department.address?.countryCode).filter(Boolean)).size,
        [departments],
    );

    const countryOptions = useMemo(
        () => Array.from(new Set(departments
            .map((department) => department.address?.countryCode)
            .filter(Boolean) as string[])).sort(),
        [departments],
    );

    const typeOptions = useMemo(
        () => Array.from(new Set(departments
            .map((department) => department.departmentType)
            .filter(Boolean) as string[])).sort(),
        [departments],
    );

    const usersByDepartmentCode = useMemo(() => users.reduce<Record<string, User[]>>((result, user) => {
        const code = user.departmentCode;
        if (!code) {
            return result;
        }
        result[code] = [...(result[code] || []), user];
        return result;
    }, {}), [users]);

    const filteredDepartments = useMemo(() => {
        const normalizedCode = filters.code.trim().toLowerCase();
        return departments.filter((department) => {
            const codeMatches = !normalizedCode
                || getDepartmentCode(department).toLowerCase().includes(normalizedCode);
            const countryMatches = !filters.country || department.address?.countryCode === filters.country;
            const typeMatches = !filters.type || department.departmentType === filters.type;
            return codeMatches && countryMatches && typeMatches;
        });
    }, [departments, filters]);

    const selectedDepartmentUsers = useMemo(() => {
        if (!usersDepartment) {
            return [];
        }
        return usersByDepartmentCode[getDepartmentCode(usersDepartment)] || [];
    }, [usersByDepartmentCode, usersDepartment]);

    const selectedDepartment = useMemo(() => {
        if (selectedDepartmentId === null) {
            return filteredDepartments[0] || null;
        }

        return filteredDepartments.find((department) => department.departmentId === selectedDepartmentId)
            || filteredDepartments[0]
            || null;
    }, [filteredDepartments, selectedDepartmentId]);

    const retrieveDepartments = useCallback((clearNotice = true) => {
        setLoading(true);
        setError("");
        if (clearNotice) {
            setSuccess("");
        }
        departmentService.getAll()
            .then((response) => {
                if (!canViewArchivedDepartments) {
                    return response.data;
                }

                return departmentService.getArchived()
                    .then((archivedResponse) => response.data.concat(archivedResponse.data))
                    .catch(() => response.data);
            })
            .then((responseDepartments) => {
                setDepartments(responseDepartments);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.departments.page.loadError));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [canViewArchivedDepartments]);

    const retrieveUsers = useCallback(() => {
        setUsersLoading(true);
        UserManagementService.getAll()
            .then((response) => {
                setUsers(Array.isArray(response.data) ? response.data : []);
            })
            .catch(() => {
                setUsers([]);
            })
            .finally(() => {
                setUsersLoading(false);
            });
    }, []);

    const updateCreateField = (field: keyof typeof createForm, value: string) => {
        setCreateForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    };

    const updateEditField = (field: keyof typeof editForm, value: string) => {
        setEditForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    };

    const updateFilter = (field: keyof typeof filters, value: string) => {
        setFilters((currentFilters) => ({
            ...currentFilters,
            [field]: value,
        }));
    };

    const createDepartmentRequest = (): DepartmentCreateRequest => ({
        departments: [{
            departmentCode: {
                value: createForm.departmentCode.trim(),
            },
            city: createForm.city.trim(),
            street: createForm.street.trim(),
            postalCode: createForm.postalCode.trim(),
            nip: createForm.nip.trim(),
            telephoneNumber: createForm.telephoneNumber.trim(),
            openingHours: createForm.openingHours.trim(),
            email: createForm.email.trim(),
            countryCode: createForm.countryCode.trim().toUpperCase(),
            departmentType: createForm.departmentType,
        }],
    });

    const createDepartment = () => {
        if (!createForm.departmentCode.trim() || !createForm.city.trim() || !createForm.street.trim()) {
            setError(createTranslations.required);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        departmentService.create(createDepartmentRequest())
            .then(() => {
                setSuccess(createTranslations.success);
                setCreateForm({...emptyDepartmentForm});
                setCreateDialogOpen(false);
                retrieveDepartments(false);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, createTranslations.error));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const openEditDialog = (department: Department) => {
        setError("");
        setSuccess("");
        setEditedDepartment(department);
        setEditForm({
            city: department.address?.city || "",
            street: department.address?.street || "",
            postalCode: department.address?.postalCode || "",
            countryCode: department.address?.countryCode || "PL",
            taxId: department.taxId || "",
            email: department.email || "",
            departmentType: department.departmentType || "BRANCH",
            status: (department.status || "ACTIVE") as DepartmentStatus,
        });
    };

    const updateDepartment = () => {
        if (!editedDepartment) {
            return;
        }

        if (!editForm.city.trim() || !editForm.street.trim() || !editForm.countryCode.trim()) {
            setError(editTranslations.required);
            return;
        }

        const departmentCode = getDepartmentCode(editedDepartment);
        const requests: Array<Promise<unknown>> = [
            departmentService.updateAddress({
                departmentCode: {value: departmentCode},
                address: {
                    city: editForm.city.trim(),
                    street: editForm.street.trim(),
                    postalCode: editForm.postalCode.trim(),
                    countryCode: editForm.countryCode.trim().toUpperCase(),
                },
            }),
        ];

        if (editForm.email.trim() !== (editedDepartment.email || "")) {
            requests.push(departmentService.changeEmail({
                departmentCode: {value: departmentCode},
                email: editForm.email.trim(),
            }));
        }

        if (editForm.taxId.trim() !== (editedDepartment.taxId || "")) {
            requests.push(departmentService.changeIdentificationNumber({
                departmentCode: {value: departmentCode},
                identificationNumber: editForm.taxId.trim(),
            }));
        }

        if (editForm.departmentType !== editedDepartment.departmentType) {
            requests.push(departmentService.changeType(departmentCode, editForm.departmentType));
        }

        if (editForm.status !== editedDepartment.status) {
            requests.push(departmentService.changeStatus({
                departmentCode: {value: departmentCode},
                status: editForm.status,
            }));
        }

        setSaving(true);
        setError("");
        setSuccess("");
        Promise.all(requests)
            .then(() => {
                setEditedDepartment(null);
                setSuccess(editTranslations.success);
                retrieveDepartments(false);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, editTranslations.error));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const changeDepartmentStatus = (department: Department, status: DepartmentStatus) => {
        const departmentCode = getDepartmentCode(department);
        setSaving(true);
        setError("");
        setSuccess("");
        const statusChange = status === "ARCHIVED"
            ? departmentService.archive({
                departmentCode: {value: departmentCode},
                status,
            })
            : departmentService.changeStatus({
            departmentCode: {value: departmentCode},
            status,
        });

        statusChange
            .then(() => {
                setSuccess(status === "ARCHIVED"
                    ? pl.departments.actions.archiveSuccess
                    : status === "DELETED"
                        ? pl.departments.actions.deleteSuccess
                        : pl.departments.actions.restoreSuccess);
                setPendingStatusChange(null);
                retrieveDepartments(false);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.departments.actions.statusError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const requestDepartmentStatusChange = (department: Department, status: "ARCHIVED" | "DELETED") => {
        setPendingStatusChange({department, status});
    };

    const closeCreateDialog = () => {
        if (!saving) {
            setCreateDialogOpen(false);
        }
    };

    const closeEditDialog = () => {
        if (!saving) {
            setEditedDepartment(null);
        }
    };

    const confirmDepartmentStatusChange = () => {
        if (!pendingStatusChange) {
            return;
        }

        changeDepartmentStatus(pendingStatusChange.department, pendingStatusChange.status);
    };

    const openUsersDialog = (department: Department) => {
        setUsersDepartment(department);
        if (!users.length) {
            retrieveUsers();
        }
    };

    const resetFilters = () => {
        setFilters({...emptyFilters});
    };

    useEffect(() => {
        if (!filteredDepartments.length) {
            setSelectedDepartmentId(null);
            return;
        }

        if (selectedDepartmentId === null
            || !filteredDepartments.some((department) => department.departmentId === selectedDepartmentId)) {
            setSelectedDepartmentId(filteredDepartments[0].departmentId);
        }
    }, [filteredDepartments, selectedDepartmentId]);

    useEffect(() => {
        retrieveDepartments();
        retrieveUsers();
    }, [retrieveDepartments, retrieveUsers]);

    return (
        <main className="departments-page">
            <section className="departments-header">
                <div className="departments-heading">
                    <span className="departments-kicker">{pl.departments.page.kicker}</span>
                    <Typography variant="h4">{pl.departments.page.title}</Typography>
                    <p>{pl.departments.page.subtitle}</p>
                </div>

                <div className="departments-stats">
                    <div>
                        <Business fontSize="small" />
                        <span>{pl.departments.stats.departments}</span>
                        <strong>{departments.length}</strong>
                    </div>
                    <div>
                        <LocationCity fontSize="small" />
                        <span>{pl.departments.stats.cities}</span>
                        <strong>{cityCount}</strong>
                    </div>
                    <div>
                        <Public fontSize="small" />
                        <span>{pl.departments.stats.countries}</span>
                        <strong>{countryCount}</strong>
                    </div>
                </div>
            </section>

            {success ? <Alert severity="success">{success}</Alert> : undefined}

            <div className="departments-workspace">
                <section className="departments-table-panel">
                    <div className="departments-table-header">
                        <Typography variant="h5">{pl.departments.page.listTitle}</Typography>
                        <div className="departments-table-actions">
                            <Button disabled={saving} startIcon={<AddBusiness />} variant="contained" onClick={() => setCreateDialogOpen(true)}>
                                {createTranslations.title}
                            </Button>
                            <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={() => retrieveDepartments()}>
                                {pl.departments.page.refresh}
                            </Button>
                        </div>
                    </div>

                    <div className="departments-filter-bar">
                        <TextField
                            InputProps={{startAdornment: <Search className="departments-filter-icon" fontSize="small" />}}
                            label={pl.departments.filters.code}
                            size="small"
                            value={filters.code}
                            onChange={(event) => updateFilter("code", event.target.value)}
                        />
                        <TextField
                            select
                            label={pl.departments.filters.country}
                            size="small"
                            value={filters.country}
                            onChange={(event) => updateFilter("country", event.target.value)}
                        >
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {countryOptions.map((country) => (
                                <MenuItem key={country} value={country}>{country}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label={pl.departments.filters.type}
                            size="small"
                            value={filters.type}
                            onChange={(event) => updateFilter("type", event.target.value)}
                        >
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {typeOptions.map((type) => (
                                <MenuItem key={type} value={type}>{translateDepartmentType(type)}</MenuItem>
                            ))}
                        </TextField>
                        <Button variant="text" onClick={resetFilters}>{pl.departments.filters.clear}</Button>
                        <span className="departments-filter-count">
                            {pl.departments.filters.results.replace("{count}", String(filteredDepartments.length))}
                        </span>
                    </div>

                    {error ? <Alert severity="error">{error}</Alert> : undefined}

                    {loading ? (
                        <div className="departments-loader">
                            <CircularProgress size={28} />
                            <span>{pl.departments.page.loading}</span>
                        </div>
                    ) : (
                        <div className="departments-table-wrap">
                            <table className="departments-table">
                                <thead>
                                <tr>
                                    <th><Tag fontSize="small" /> {pl.departments.columns.code}</th>
                                    <th><LocationCity fontSize="small" /> {pl.departments.columns.city}</th>
                                    <th>{pl.departments.columns.street}</th>
                                    <th><Public fontSize="small" /> {pl.departments.columns.country}</th>
                                    <th>{pl.departments.columns.postalCode}</th>
                                    <th>{pl.departments.columns.taxId}</th>
                                    <th><Phone fontSize="small" /> {pl.departments.columns.telephoneNumber}</th>
                                    <th>{pl.departments.columns.email}</th>
                                    <th>{pl.departments.columns.departmentType}</th>
                                    <th>{pl.departments.columns.status}</th>
                                    <th><GroupOutlined fontSize="small" /> {pl.departments.columns.users}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredDepartments.map((department) => {
                                    const departmentCode = getDepartmentCode(department);
                                    const assignedUsers = usersByDepartmentCode[departmentCode] || [];
                                    const selected = selectedDepartment?.departmentId === department.departmentId;
                                    return (
                                        <tr
                                            className={selected ? "departments-row-selected" : undefined}
                                            key={department.departmentId}
                                            onClick={() => setSelectedDepartmentId(department.departmentId)}
                                        >
                                            <td><strong>{departmentCode}</strong></td>
                                            <td>{valueOrDash(department.address?.city)}</td>
                                            <td>{valueOrDash(department.address?.street)}</td>
                                            <td>{valueOrDash(department.address?.countryCode)}</td>
                                            <td>{valueOrDash(department.address?.postalCode)}</td>
                                            <td>{valueOrDash(department.taxId)}</td>
                                            <td>{valueOrDash(department.telephoneNumber)}</td>
                                            <td>{valueOrDash(department.email)}</td>
                                            <td>{translateDepartmentType(department.departmentType)}</td>
                                            <td>
                                                <span className={`departments-status departments-status-${(department.status || "unknown").toLowerCase()}`}>
                                                    {translateDepartmentStatus(department.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="departments-users-link"
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openUsersDialog(department);
                                                    }}
                                                >
                                                    <GroupOutlined fontSize="small" />
                                                    {usersLoading ? pl.common.loading : String(assignedUsers.length)}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!filteredDepartments.length ? (
                                    <tr>
                                        <td className="departments-empty-row" colSpan={11}>{pl.departments.page.empty}</td>
                                    </tr>
                                ) : undefined}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <aside className="departments-side-actions">
                    <div className="departments-side-actions-title">
                        <span>{pl.departments.actions.rowActions}</span>
                        <strong>{selectedDepartment ? getDepartmentCode(selectedDepartment) : pl.common.dash}</strong>
                    </div>
                    {selectedDepartment ? (
                        <dl className="departments-selection-details">
                            <div>
                                <dt>{pl.departments.columns.city}</dt>
                                <dd>{valueOrDash(selectedDepartment.address?.city)}</dd>
                            </div>
                            <div>
                                <dt>{pl.departments.columns.openingHours}</dt>
                                <dd>{valueOrDash(selectedDepartment.openingHours)}</dd>
                            </div>
                            <div>
                                <dt>{pl.departments.columns.coordinates}</dt>
                                <dd>{formatCoordinates(selectedDepartment)}</dd>
                            </div>
                            <div>
                                <dt>{pl.departments.columns.updatedAt}</dt>
                                <dd>{formatDateTime(selectedDepartment.updatedAt)}</dd>
                            </div>
                        </dl>
                    ) : undefined}
                    <table className="departments-actions-table">
                        <tbody>
                        {canArchiveDepartments ? (
                            <tr>
                                <td>
                                    <button
                                        disabled={!selectedDepartment || saving || selectedDepartment.status === "DELETED"}
                                        type="button"
                                        onClick={() => selectedDepartment && openEditDialog(selectedDepartment)}
                                    >
                                        <EditOutlined fontSize="small" />
                                        <span>{pl.common.edit}</span>
                                    </button>
                                </td>
                            </tr>
                        ) : null}
                        {canViewArchivedDepartments && selectedDepartment?.status === "ARCHIVED" ? (
                            <tr>
                                <td>
                                    <button
                                        className="departments-action-restore"
                                        disabled={saving}
                                        type="button"
                                        onClick={() => changeDepartmentStatus(selectedDepartment, "ACTIVE")}
                                    >
                                        <UnarchiveOutlined fontSize="small" />
                                        <span>{pl.departments.actions.restore}</span>
                                    </button>
                                </td>
                            </tr>
                        ) : null}
                        <tr>
                            <td>
                                <button
                                    disabled={!selectedDepartment || saving}
                                    type="button"
                                    onClick={() => selectedDepartment && openUsersDialog(selectedDepartment)}
                                >
                                    <GroupOutlined fontSize="small" />
                                    <span>{pl.departments.actions.usersShort}</span>
                                </button>
                            </td>
                        </tr>
                        {canArchiveDepartments ? (
                            <tr>
                                <td>
                                    <button
                                        disabled={!selectedDepartment || saving || selectedDepartment.status === "ARCHIVED" || selectedDepartment.status === "DELETED"}
                                        type="button"
                                        onClick={() => selectedDepartment && requestDepartmentStatusChange(selectedDepartment, "ARCHIVED")}
                                    >
                                        <ArchiveOutlined fontSize="small" />
                                        <span>{pl.departments.actions.archiveShort}</span>
                                    </button>
                                </td>
                            </tr>
                        ) : null}
                        {canViewArchivedDepartments ? (
                            <tr>
                                <td>
                                    <button
                                        className="departments-action-delete"
                                        disabled={!selectedDepartment || saving || selectedDepartment.status === "DELETED"}
                                        type="button"
                                        onClick={() => selectedDepartment && requestDepartmentStatusChange(selectedDepartment, "DELETED")}
                                    >
                                        <DeleteOutline fontSize="small" />
                                        <span>{pl.common.delete}</span>
                                    </button>
                                </td>
                            </tr>
                        ) : null}
                        </tbody>
                    </table>
                </aside>
            </div>

            <Dialog
                className="departments-create-dialog-shell"
                fullWidth
                maxWidth="lg"
                PaperProps={{className: "departments-create-dialog"}}
                open={createDialogOpen}
                onClose={closeCreateDialog}
            >
                <DialogTitle className="departments-dialog-title">
                    <span className="departments-dialog-heading">
                        <span className="departments-dialog-icon">
                            <AddBusiness />
                        </span>
                        <span>{createTranslations.title}</span>
                    </span>
                    <IconButton aria-label={pl.common.close} disabled={saving} onClick={closeCreateDialog}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="departments-dialog-content">
                    <div className="departments-create-grid departments-dialog-grid">
                        <TextField
                            autoFocus
                            label={createTranslations.fields.code}
                            size="small"
                            value={createForm.departmentCode}
                            onChange={(event) => updateCreateField("departmentCode", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.city}
                            size="small"
                            value={createForm.city}
                            onChange={(event) => updateCreateField("city", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.street}
                            size="small"
                            value={createForm.street}
                            onChange={(event) => updateCreateField("street", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.postalCode}
                            size="small"
                            value={createForm.postalCode}
                            onChange={(event) => updateCreateField("postalCode", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.taxId}
                            size="small"
                            value={createForm.nip}
                            onChange={(event) => updateCreateField("nip", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.telephoneNumber}
                            size="small"
                            value={createForm.telephoneNumber}
                            onChange={(event) => updateCreateField("telephoneNumber", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.email}
                            size="small"
                            type="email"
                            value={createForm.email}
                            onChange={(event) => updateCreateField("email", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.openingHours}
                            size="small"
                            value={createForm.openingHours}
                            onChange={(event) => updateCreateField("openingHours", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.countryCode}
                            size="small"
                            value={createForm.countryCode}
                            onChange={(event) => updateCreateField("countryCode", event.target.value)}
                        />
                        <TextField
                            select
                            label={createTranslations.fields.departmentType}
                            size="small"
                            value={createForm.departmentType}
                            onChange={(event) => updateCreateField("departmentType", event.target.value)}
                        >
                            {DEPARTMENT_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>{translateDepartmentType(type)}</MenuItem>
                            ))}
                        </TextField>
                    </div>
                </DialogContent>
                <DialogActions className="departments-dialog-actions">
                    <Button disabled={saving} onClick={closeCreateDialog}>{createTranslations.cancel}</Button>
                    <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={createDepartment}>
                        {saving ? createTranslations.saving : createTranslations.submit}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="departments-edit-dialog"
                fullWidth
                maxWidth="lg"
                PaperProps={{className: "departments-edit-dialog-paper"}}
                open={Boolean(editedDepartment)}
                onClose={closeEditDialog}
            >
                <DialogTitle className="departments-dialog-title">
                    <span className="departments-dialog-heading">
                        <span className="departments-dialog-icon">
                            <EditOutlined />
                        </span>
                        <span>{editTranslations.title}</span>
                        <strong>{editedDepartment ? getDepartmentCode(editedDepartment) : ""}</strong>
                    </span>
                    <IconButton aria-label={pl.common.close} disabled={saving} onClick={closeEditDialog}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="departments-dialog-content">
                    <DialogContentText className="departments-edit-dialog-description">
                        {editTranslations.description}
                    </DialogContentText>
                    <div className="departments-create-grid departments-dialog-grid">
                        <TextField
                            autoFocus
                            label={createTranslations.fields.city}
                            size="small"
                            value={editForm.city}
                            onChange={(event) => updateEditField("city", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.street}
                            size="small"
                            value={editForm.street}
                            onChange={(event) => updateEditField("street", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.postalCode}
                            size="small"
                            value={editForm.postalCode}
                            onChange={(event) => updateEditField("postalCode", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.countryCode}
                            size="small"
                            value={editForm.countryCode}
                            onChange={(event) => updateEditField("countryCode", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.taxId}
                            size="small"
                            value={editForm.taxId}
                            onChange={(event) => updateEditField("taxId", event.target.value)}
                        />
                        <TextField
                            label={createTranslations.fields.email}
                            size="small"
                            type="email"
                            value={editForm.email}
                            onChange={(event) => updateEditField("email", event.target.value)}
                        />
                        <TextField
                            select
                            label={createTranslations.fields.departmentType}
                            size="small"
                            value={editForm.departmentType}
                            onChange={(event) => updateEditField("departmentType", event.target.value)}
                        >
                            {DEPARTMENT_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>{translateDepartmentType(type)}</MenuItem>
                            ))}
                        </TextField>
                        {canViewArchivedDepartments ? (
                            <TextField
                                select
                                label={pl.departments.columns.status}
                                size="small"
                                value={editForm.status}
                                onChange={(event) => updateEditField("status", event.target.value)}
                            >
                                {DEPARTMENT_STATUSES.map((status) => (
                                    <MenuItem key={status} value={status}>{translateDepartmentStatus(status)}</MenuItem>
                                ))}
                            </TextField>
                        ) : null}
                    </div>
                </DialogContent>
                <DialogActions className="departments-dialog-actions">
                    <Button disabled={saving} onClick={closeEditDialog}>{pl.common.cancel}</Button>
                    <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={updateDepartment}>
                        {saving ? editTranslations.saving : pl.common.saveChanges}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="departments-status-dialog"
                fullWidth
                maxWidth="sm"
                open={Boolean(pendingStatusChange)}
                onClose={() => !saving && setPendingStatusChange(null)}
            >
                <DialogTitle>
                    <WarningAmberOutlined />
                    <span>
                        {pendingStatusChange?.status === "ARCHIVED"
                            ? pl.departments.actions.archiveDialogTitle
                            : pl.departments.actions.deleteDialogTitle}
                    </span>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {(pendingStatusChange?.status === "ARCHIVED"
                            ? pl.departments.actions.archiveDialogDescription
                            : pl.departments.actions.deleteDialogDescription)
                            .replace("{code}", pendingStatusChange ? getDepartmentCode(pendingStatusChange.department) : "")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} onClick={() => setPendingStatusChange(null)}>
                        {pl.common.cancel}
                    </Button>
                    <Button
                        color={pendingStatusChange?.status === "DELETED" ? "error" : "primary"}
                        disabled={saving || !pendingStatusChange}
                        startIcon={pendingStatusChange?.status === "DELETED" ? <DeleteOutline /> : <ArchiveOutlined />}
                        variant="contained"
                        onClick={confirmDepartmentStatusChange}
                    >
                        {pendingStatusChange?.status === "ARCHIVED"
                            ? pl.departments.actions.archiveDialogConfirm
                            : pl.departments.actions.deleteDialogConfirm}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog fullWidth maxWidth="md" open={Boolean(usersDepartment)} onClose={() => setUsersDepartment(null)}>
                <DialogTitle>
                    {pl.departments.usersDialog.title} {usersDepartment ? getDepartmentCode(usersDepartment) : ""}
                </DialogTitle>
                <DialogContent>
                    {usersLoading ? (
                        <div className="departments-users-loader">
                            <CircularProgress size={24} />
                            <span>{pl.usersManagement.page.loading}</span>
                        </div>
                    ) : selectedDepartmentUsers.length ? (
                        <table className="departments-users-table">
                            <thead>
                            <tr>
                                <th>{pl.usersManagement.columns.user}</th>
                                <th>{pl.usersManagement.columns.username}</th>
                                <th>{pl.usersManagement.columns.email}</th>
                                <th>{pl.usersManagement.columns.role}</th>
                                <th>{pl.usersManagement.columns.language}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedDepartmentUsers.map((user) => (
                                <tr key={String(user.userId.value)}>
                                    <td><strong>{user.firstName} {user.lastName}</strong></td>
                                    <td>@{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{pl.usersManagement.roles[user.role]}</td>
                                    <td>{pl.usersManagement.languages[user.language as keyof typeof pl.usersManagement.languages] || user.language}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="departments-users-empty">{pl.departments.usersDialog.empty}</div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUsersDepartment(null)}>{pl.common.close}</Button>
                </DialogActions>
            </Dialog>
        </main>
    );
};

export default Departments;
