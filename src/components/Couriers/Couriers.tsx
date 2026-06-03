import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
    Typography,
} from "components/ui";
import {
    Badge,
    Block,
    CheckCircle,
    Close,
    Edit,
    LocalShipping,
    PersonAdd,
    Refresh,
    Save,
    Search,
    Settings,
} from "components/ui/icons";
import {useNavigate} from "react-router-dom";
import {getBackendErrorMessage} from "../../api/errorMessage";
import Department from "../../class/depots/Department";
import CourierService from "../../hooks/CourierService";
import DepartmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import CourierConfigurationDialog from "./CourierConfigurationDialog";
import {CourierCreateRequest, CourierDto} from "./dto/CourierDto";
import "./styles/couriers.css";

const valueOrDash = (value?: string | number | null) => value || pl.common.dash;

const translateCourierStatus = (value?: string | null) => value
    ? pl.couriers.status[value as keyof typeof pl.couriers.status] || value
    : pl.common.dash;

const isFutureDate = (value?: string | null) => {
    if (!value) {
        return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
};

const hasValidLicense = (courier: CourierDto) => isFutureDate(courier.driverLicense?.drivingLicenseExpiryDate);

const hasValidCertification = (courier: CourierDto) => Boolean(
    courier.dangerousGoodCertification?.valid
    && isFutureDate(courier.dangerousGoodCertification.expiryDate)
);

const emptyCreateForm = {
    supplierCode: "",
    firstName: "",
    lastName: "",
    telephoneNumber: "",
    departmentCode: "",
};

const emptyFilters = {
    code: "",
    department: "",
    status: "",
};

const departmentCodeValue = (department: Department) => department.departmentCode?.value || "";

function Couriers() {
    const navigate = useNavigate();
    const [couriers, setCouriers] = useState<CourierDto[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedCode, setSelectedCode] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [departmentsLoading, setDepartmentsLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [createForm, setCreateForm] = useState({...emptyCreateForm});
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [configurationDialogOpen, setConfigurationDialogOpen] = useState<boolean>(false);
    const [filters, setFilters] = useState({...emptyFilters});
    const createTranslations = pl.couriers.create;

    const selectedCourier = useMemo(
        () => couriers.find((courier) => courier.supplierCode?.value === selectedCode) || null,
        [couriers, selectedCode]
    );

    const departmentOptions = useMemo(
        () => Array.from(new Set(couriers
            .map((courier) => courier.departmentCode?.value)
            .filter(Boolean) as string[])).sort((left, right) => left.localeCompare(right, pl.common.locale)),
        [couriers]
    );

    const statusOptions = useMemo(
        () => Array.from(new Set(couriers
            .map((courier) => courier.status)
            .filter(Boolean) as string[])).sort((left, right) => left.localeCompare(right, pl.common.locale)),
        [couriers]
    );

    const filteredCouriers = useMemo(() => {
        const normalizedCode = filters.code.trim().toLowerCase();
        return couriers.filter((courier) => {
            const code = courier.supplierCode?.value || "";
            const name = `${courier.firstName || ""} ${courier.lastName || ""}`.trim();
            const matchesCode = !normalizedCode
                || code.toLowerCase().includes(normalizedCode)
                || name.toLowerCase().includes(normalizedCode);
            const matchesDepartment = !filters.department || courier.departmentCode?.value === filters.department;
            const matchesStatus = !filters.status || courier.status === filters.status;
            return matchesCode && matchesDepartment && matchesStatus;
        });
    }, [couriers, filters]);

    const activeCount = useMemo(() => couriers.filter((courier) => courier.status === "ACTIVE").length, [couriers]);
    const validLicenseCount = useMemo(() => couriers.filter(hasValidLicense).length, [couriers]);
    const availableDepartments = useMemo(() => departments
        .filter((department) => department.status === "ACTIVE")
        .map((department) => {
            const code = departmentCodeValue(department);
            const city = department.address?.city || pl.common.dash;
            return {
                code,
                label: `${code} - ${city}`,
            };
        })
        .filter((department) => Boolean(department.code))
        .sort((left, right) => left.label.localeCompare(right.label, pl.common.locale)), [departments]);

    const selectCourier = (courier: CourierDto) => {
        setSelectedCode(courier.supplierCode.value);
    };

    const openCourierDetails = (courier: CourierDto) => {
        selectCourier(courier);
        navigate(`/couriers/${encodeURIComponent(courier.supplierCode.value)}`);
    };

    const retrieveCouriers = useCallback((clearNotice = true) => {
        setLoading(true);
        setError("");
        if (clearNotice) {
            setSuccess("");
        }
        CourierService.getAll()
            .then((response) => {
                setCouriers(response.data);
                setSelectedCode((currentCode) => currentCode || response.data[0]?.supplierCode.value || "");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.loadError));
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const retrieveDepartments = useCallback(() => {
        setDepartmentsLoading(true);
        DepartmentService.getAll()
            .then((response) => {
                setDepartments(Array.isArray(response.data) ? response.data : []);
            })
            .catch((exception: unknown) => {
                setDepartments([]);
                setError(getBackendErrorMessage(exception, pl.departments.page.loadError));
            })
            .finally(() => {
                setDepartmentsLoading(false);
            });
    }, []);

    useEffect(() => {
        retrieveCouriers();
    }, [retrieveCouriers]);

    useEffect(() => {
        retrieveDepartments();
    }, [retrieveDepartments]);

    useEffect(() => {
        if (!filteredCouriers.length) {
            setSelectedCode("");
            return;
        }

        if (!selectedCode || !filteredCouriers.some((courier) => courier.supplierCode.value === selectedCode)) {
            setSelectedCode(filteredCouriers[0].supplierCode.value);
        }
    }, [filteredCouriers, selectedCode]);

    const updateCourierInState = (supplierCode: string, patch: Partial<CourierDto>) => {
        setCouriers((previousCouriers) => previousCouriers.map((courier) => (
            courier.supplierCode.value === supplierCode
                ? {...courier, ...patch}
                : courier
        )));
    };

    const updateCreateField = (field: keyof typeof createForm, value: string) => {
        setCreateForm((currentForm) => ({
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

    const resetFilters = () => {
        setFilters({...emptyFilters});
    };

    const createCourierRequest = (): CourierCreateRequest => ({
        supplierCode: {
            value: createForm.supplierCode.trim(),
        },
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        telephoneNumber: createForm.telephoneNumber.trim(),
        departmentCode: {
            value: createForm.departmentCode.trim(),
        },
    });

    const closeCreateDialog = () => {
        if (!saving) {
            setCreateDialogOpen(false);
        }
    };

    const createCourier = () => {
        if (
            !createForm.supplierCode.trim()
            || !createForm.firstName.trim()
            || !createForm.lastName.trim()
            || !createForm.departmentCode.trim()
        ) {
            setError(createTranslations.required);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        CourierService.create(createCourierRequest())
            .then((response) => {
                const createdCode = response.data.supplierCode || createForm.supplierCode.trim();
                setSuccess(createTranslations.success);
                setCreateForm({...emptyCreateForm});
                setCreateDialogOpen(false);
                setSelectedCode(createdCode);
                retrieveCouriers(false);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, createTranslations.error));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const changeStatus = (courier: CourierDto, active: boolean) => {
        setSaving(true);
        setError("");
        setSuccess("");
        const request = active
            ? CourierService.activate(courier.supplierCode.value)
            : CourierService.deactivate(courier.supplierCode.value);

        request
            .then(() => {
                updateCourierInState(courier.supplierCode.value, {status: active ? "ACTIVE" : "INACTIVE"});
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.actionError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    return (
        <main className="couriers-page">
            <section className="couriers-header">
                <div>
                    <span className="couriers-kicker">{pl.couriers.page.kicker}</span>
                    <Typography variant="h4">{pl.couriers.page.title}</Typography>
                    <p>{pl.couriers.page.subtitle}</p>
                </div>
                <div className="couriers-summary">
                    <div>
                        <LocalShipping fontSize="small" />
                        <span>{pl.couriers.page.listTitle}</span>
                        <strong>{couriers.length}</strong>
                    </div>
                    <div>
                        <CheckCircle fontSize="small" />
                        <span>{translateCourierStatus("ACTIVE")}</span>
                        <strong>{activeCount}</strong>
                    </div>
                    <div>
                        <Badge fontSize="small" />
                        <span>{pl.couriers.checks.validLicense}</span>
                        <strong>{validLicenseCount}</strong>
                    </div>
                </div>
            </section>

            {error ? <Alert severity="error">{error}</Alert> : undefined}
            {success ? <Alert severity="success">{success}</Alert> : undefined}

            <section className="couriers-workspace">
                <div className="couriers-table-panel">
                    <div className="couriers-panel-header">
                        <Typography variant="h5">{pl.couriers.page.listTitle}</Typography>
                        <div className="couriers-table-actions">
                            <Button disabled={saving} startIcon={<PersonAdd />} variant="contained" onClick={() => setCreateDialogOpen(true)}>
                                {createTranslations.title}
                            </Button>
                            <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={() => retrieveCouriers()}>
                                {pl.couriers.actions.refresh}
                            </Button>
                        </div>
                    </div>

                    <div className="couriers-filter-bar">
                        <TextField
                            InputProps={{startAdornment: <Search className="couriers-filter-icon" fontSize="small" />}}
                            label={pl.couriers.columns.code}
                            size="small"
                            value={filters.code}
                            onChange={(event) => updateFilter("code", event.target.value)}
                        />
                        <TextField
                            select
                            label={pl.couriers.columns.department}
                            size="small"
                            value={filters.department}
                            onChange={(event) => updateFilter("department", event.target.value)}
                        >
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {departmentOptions.map((departmentCode) => (
                                <MenuItem key={departmentCode} value={departmentCode}>{departmentCode}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label={pl.couriers.columns.status}
                            size="small"
                            value={filters.status}
                            onChange={(event) => updateFilter("status", event.target.value)}
                        >
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {statusOptions.map((status) => (
                                <MenuItem key={status} value={status}>{translateCourierStatus(status)}</MenuItem>
                            ))}
                        </TextField>
                        <Button variant="text" onClick={resetFilters}>{pl.departments.filters.clear}</Button>
                        <span className="couriers-filter-count">
                            {pl.departments.filters.results.replace("{count}", String(filteredCouriers.length))}
                        </span>
                    </div>

                    {loading ? (
                        <div className="couriers-loader">
                            <CircularProgress size={28} />
                            <span>{pl.couriers.page.loading}</span>
                        </div>
                    ) : (
                        <div className="couriers-table-wrap">
                            <table className="couriers-table">
                                <thead>
                                <tr>
                                    <th>{pl.couriers.columns.code}</th>
                                    <th>{pl.couriers.columns.name}</th>
                                    <th>{pl.couriers.columns.phone}</th>
                                    <th>{pl.couriers.columns.department}</th>
                                    <th>{pl.couriers.columns.status}</th>
                                    <th>{pl.couriers.columns.license}</th>
                                    <th>{pl.couriers.columns.certification}</th>
                                    <th>{pl.couriers.columns.vehicle}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredCouriers.map((courier) => {
                                    const isSelected = selectedCode === courier.supplierCode.value;
                                    return (
                                        <tr
                                            className={isSelected ? "couriers-row-selected" : ""}
                                            key={courier.supplierCode.value}
                                            onClick={() => selectCourier(courier)}
                                        >
                                            <td><strong>{courier.supplierCode.value}</strong></td>
                                            <td>{courier.firstName} {courier.lastName}</td>
                                            <td>{valueOrDash(courier.telephoneNumber)}</td>
                                            <td>{valueOrDash(courier.departmentCode?.value)}</td>
                                            <td>
                                                <span className={`couriers-status couriers-status-${(courier.status || "unknown").toLowerCase()}`}>
                                                    {translateCourierStatus(courier.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={hasValidLicense(courier) ? "couriers-check-ok" : "couriers-check-bad"}>
                                                    {hasValidLicense(courier) ? pl.couriers.checks.validLicense : pl.couriers.checks.invalidLicense}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={hasValidCertification(courier) ? "couriers-check-ok" : "couriers-check-bad"}>
                                                    {hasValidCertification(courier) ? pl.couriers.checks.validCertification : pl.couriers.checks.invalidCertification}
                                                </span>
                                            </td>
                                            <td>{valueOrDash(courier.vehicleId?.value)}</td>
                                        </tr>
                                    );
                                })}
                                {!filteredCouriers.length ? (
                                    <tr>
                                        <td className="couriers-empty-row" colSpan={8}>{pl.couriers.page.empty}</td>
                                    </tr>
                                ) : undefined}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <aside className="couriers-side-actions">
                    {selectedCourier ? (
                        <>
                            <div className="couriers-side-actions-title">
                                <span>{pl.couriers.columns.actions}</span>
                                <strong>{selectedCourier.supplierCode.value}</strong>
                            </div>
                            <dl className="couriers-selection-details">
                                <div>
                                    <dt>{pl.couriers.columns.name}</dt>
                                    <dd>{selectedCourier.firstName} {selectedCourier.lastName}</dd>
                                </div>
                                <div>
                                    <dt>{pl.couriers.columns.department}</dt>
                                    <dd>{valueOrDash(selectedCourier.departmentCode?.value)}</dd>
                                </div>
                                <div>
                                    <dt>{pl.couriers.columns.status}</dt>
                                    <dd>{translateCourierStatus(selectedCourier.status)}</dd>
                                </div>
                                <div>
                                    <dt>{pl.couriers.columns.vehicle}</dt>
                                    <dd>{valueOrDash(selectedCourier.vehicleId?.value)}</dd>
                                </div>
                            </dl>
                            <table className="couriers-actions-table">
                                <tbody>
                                <tr>
                                    <td>
                                        <button type="button" onClick={() => openCourierDetails(selectedCourier)}>
                                            <Edit fontSize="small" />
                                            <span>{pl.couriers.actions.edit}</span>
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <button type="button" onClick={() => setConfigurationDialogOpen(true)}>
                                            <Settings fontSize="small" />
                                            <span>{pl.globalConfiguration.courierConfiguration.title}</span>
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        {selectedCourier.status === "ACTIVE" ? (
                                            <button className="couriers-danger-action" disabled={saving} type="button" onClick={() => changeStatus(selectedCourier, false)}>
                                                <Block fontSize="small" />
                                                <span>{pl.couriers.actions.deactivate}</span>
                                            </button>
                                        ) : (
                                            <button disabled={saving} type="button" onClick={() => changeStatus(selectedCourier, true)}>
                                                <CheckCircle fontSize="small" />
                                                <span>{pl.couriers.actions.activate}</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <div className="couriers-empty-details">{pl.couriers.page.emptyDetails}</div>
                    )}
                </aside>
            </section>

            <Dialog
                className="couriers-create-dialog"
                fullWidth
                maxWidth="md"
                PaperProps={{className: "couriers-create-dialog-paper"}}
                open={createDialogOpen}
                onClose={closeCreateDialog}
            >
                <DialogTitle className="couriers-create-dialog-title">
                    <span className="couriers-create-dialog-heading">
                        <span className="couriers-create-dialog-icon">
                            <PersonAdd />
                        </span>
                        <span>{createTranslations.title}</span>
                    </span>
                    <IconButton aria-label={pl.common.close} disabled={saving} onClick={closeCreateDialog}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="couriers-create-dialog-content">
                    <div className="couriers-create-grid couriers-dialog-grid">
                        <TextField
                            autoFocus
                            disabled={saving}
                            label={createTranslations.fields.supplierCode}
                            size="small"
                            value={createForm.supplierCode}
                            onChange={(event) => updateCreateField("supplierCode", event.target.value)}
                        />
                        <TextField
                            disabled={saving}
                            label={pl.couriers.fields.firstName}
                            size="small"
                            value={createForm.firstName}
                            onChange={(event) => updateCreateField("firstName", event.target.value)}
                        />
                        <TextField
                            disabled={saving}
                            label={pl.couriers.fields.lastName}
                            size="small"
                            value={createForm.lastName}
                            onChange={(event) => updateCreateField("lastName", event.target.value)}
                        />
                        <TextField
                            disabled={saving}
                            label={pl.couriers.fields.telephoneNumber}
                            size="small"
                            value={createForm.telephoneNumber}
                            onChange={(event) => updateCreateField("telephoneNumber", event.target.value)}
                        />
                        <TextField
                            disabled={saving || departmentsLoading || !availableDepartments.length}
                            label={pl.couriers.fields.department}
                            required
                            select
                            size="small"
                            value={createForm.departmentCode}
                            onChange={(event) => updateCreateField("departmentCode", event.target.value)}
                        >
                            {departmentsLoading || !availableDepartments.length ? (
                                <MenuItem disabled value="">
                                    {departmentsLoading
                                        ? createTranslations.departmentLoading
                                        : createTranslations.departmentEmpty}
                                </MenuItem>
                            ) : undefined}
                            {availableDepartments.map((department) => (
                                <MenuItem key={department.code} value={department.code}>
                                    {department.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>
                </DialogContent>
                <DialogActions className="couriers-create-dialog-actions">
                    <Button disabled={saving} onClick={closeCreateDialog}>{createTranslations.cancel}</Button>
                    <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={createCourier}>
                        {saving ? createTranslations.saving : createTranslations.submit}
                    </Button>
                </DialogActions>
            </Dialog>
            <CourierConfigurationDialog
                open={configurationDialogOpen}
                onClose={() => setConfigurationDialogOpen(false)}
            />
        </main>
    );
}

export default Couriers;
