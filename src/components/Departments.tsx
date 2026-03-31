import React, {useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";
import {
    AddBusiness,
    Business,
    LocationCity,
    Phone,
    Public,
    Refresh,
    Schedule,
    Save,
    Tag,
} from "@mui/icons-material";
import Department from "../class/depots/Department";
import departmentService, {DepartmentCreateRequest} from "../hooks/DepartmentService";
import pl from "../i18n/translate";
import "./Departments/styles/departments.css";

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

const Departments: React.FC = () => {
    const [departments, setDepartments] = useState<Array<Department>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [createForm, setCreateForm] = useState({...emptyDepartmentForm});
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const createTranslations = pl.departments.create;

    const cityCount = useMemo(() => new Set(departments.map((department) => department.address?.city).filter(Boolean)).size, [departments]);
    const countryCount = useMemo(() => new Set(departments.map((department) => department.address?.countryCode).filter(Boolean)).size, [departments]);

    const retrieveDepartments = (clearNotice = true) => {
        setLoading(true);
        setError("");
        if (clearNotice) {
            setSuccess("");
        }
        departmentService.getAll()
            .then((response) => {
                setDepartments(response.data);
            })
            .catch((exception: Error) => {
                setError(exception.message || pl.departments.page.loadError);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const updateCreateField = (field: keyof typeof createForm, value: string) => {
        setCreateForm((currentForm) => ({
            ...currentForm,
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
            .catch((exception: Error) => {
                setError(exception.message || createTranslations.error);
            })
            .finally(() => {
                setSaving(false);
            });
    };

    useEffect(() => {
        retrieveDepartments();
    }, []);

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
                                <th><Schedule fontSize="small" /> {pl.departments.columns.openingHours}</th>
                                <th>{pl.departments.columns.createdAt}</th>
                                <th>{pl.departments.columns.updatedAt}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {departments.map((department) => (
                                <tr key={department.departmentCode.value}>
                                    <td><strong>{department.departmentCode.value}</strong></td>
                                    <td>{valueOrDash(department.address?.city)}</td>
                                    <td>{valueOrDash(department.address?.street)}</td>
                                    <td>{valueOrDash(department.address?.countryCode)}</td>
                                    <td>{valueOrDash(department.address?.postalCode)}</td>
                                    <td>{valueOrDash(department.taxId)}</td>
                                    <td>{valueOrDash(department.telephoneNumber)}</td>
                                    <td>{valueOrDash(department.email)}</td>
                                    <td>{translateDepartmentType(department.departmentType)}</td>
                                    <td>{translateDepartmentStatus(department.status)}</td>
                                    <td>{valueOrDash(department.openingHours)}</td>
                                    <td>{formatDateTime(department.createdAt)}</td>
                                    <td>{formatDateTime(department.updatedAt)}</td>
                                </tr>
                            ))}
                            {!departments.length ? (
                                <tr>
                                    <td className="departments-empty-row" colSpan={13}>{pl.departments.page.empty}</td>
                                </tr>
                            ) : undefined}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <Dialog fullWidth maxWidth="md" open={createDialogOpen} onClose={() => !saving && setCreateDialogOpen(false)}>
                <DialogTitle>{createTranslations.title}</DialogTitle>
                <DialogContent>
                    <div className="departments-create-grid departments-dialog-grid">
                        <TextField
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
                            <MenuItem value="BRANCH">{createTranslations.types.BRANCH}</MenuItem>
                            <MenuItem value="HEADQUARTERS">{createTranslations.types.HEADQUARTERS}</MenuItem>
                            <MenuItem value="WAREHOUSE">{createTranslations.types.WAREHOUSE}</MenuItem>
                        </TextField>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} onClick={() => setCreateDialogOpen(false)}>{createTranslations.cancel}</Button>
                    <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={createDepartment}>
                        {saving ? createTranslations.saving : createTranslations.submit}
                    </Button>
                </DialogActions>
            </Dialog>
        </main>
    );
};

export default Departments;
