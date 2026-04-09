import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";
import {
    Badge,
    Block,
    CheckCircle,
    Edit,
    LocalShipping,
    MoreVert,
    PersonAdd,
    Refresh,
    Save,
    WorkspacePremium,
} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {getBackendErrorMessage} from "../../api/errorMessage";
import CourierService from "../../hooks/CourierService";
import pl from "../../i18n/translate";
import {CourierCreateRequest, CourierDto, DangerousGoodCertificationDto} from "./dto/CourierDto";
import "./styles/couriers.css";

const valueOrDash = (value?: string | number | null) => value || pl.common.dash;

const translateCourierStatus = (value?: string | null) => value
    ? pl.couriers.status[value as keyof typeof pl.couriers.status] || value
    : pl.common.dash;

const formatDate = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(pl.common.locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const toDateInputValue = (value?: string | null) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 10);
};

const toIsoDate = (value: string) => new Date(`${value}T00:00:00.000Z`).toISOString();

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

const emptyCertificationForm: DangerousGoodCertificationDto = {
    certificateNumber: "",
    issueDate: "",
    expiryDate: "",
    authority: "",
    valid: true,
};

const emptyCreateForm = {
    supplierCode: "",
    firstName: "",
    lastName: "",
    telephoneNumber: "",
};

function Couriers() {
    const navigate = useNavigate();
    const [couriers, setCouriers] = useState<CourierDto[]>([]);
    const [selectedCode, setSelectedCode] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [menuCourier, setMenuCourier] = useState<CourierDto | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [basicForm, setBasicForm] = useState({firstName: "", lastName: "", telephoneNumber: ""});
    const [createForm, setCreateForm] = useState({...emptyCreateForm});
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [certificationForm, setCertificationForm] = useState<DangerousGoodCertificationDto>(emptyCertificationForm);
    const createTranslations = pl.couriers.create;

    const selectedCourier = useMemo(
        () => couriers.find((courier) => courier.supplierCode?.value === selectedCode) || null,
        [couriers, selectedCode]
    );

    const activeCount = useMemo(() => couriers.filter((courier) => courier.status === "ACTIVE").length, [couriers]);
    const validLicenseCount = useMemo(() => couriers.filter(hasValidLicense).length, [couriers]);

    const selectCourier = (courier: CourierDto) => {
        setSelectedCode(courier.supplierCode.value);
        setEditing(false);
        setBasicForm({
            firstName: courier.firstName || "",
            lastName: courier.lastName || "",
            telephoneNumber: courier.telephoneNumber || "",
        });
        setCertificationForm(courier.dangerousGoodCertification
            ? {
                ...courier.dangerousGoodCertification,
                issueDate: toDateInputValue(courier.dangerousGoodCertification.issueDate),
                expiryDate: toDateInputValue(courier.dangerousGoodCertification.expiryDate),
            }
            : emptyCertificationForm);
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

    useEffect(() => {
        retrieveCouriers();
    }, [retrieveCouriers]);

    useEffect(() => {
        if (selectedCourier) {
            setBasicForm({
                firstName: selectedCourier.firstName || "",
                lastName: selectedCourier.lastName || "",
                telephoneNumber: selectedCourier.telephoneNumber || "",
            });
            setCertificationForm(selectedCourier.dangerousGoodCertification
                ? {
                    ...selectedCourier.dangerousGoodCertification,
                    issueDate: toDateInputValue(selectedCourier.dangerousGoodCertification.issueDate),
                    expiryDate: toDateInputValue(selectedCourier.dangerousGoodCertification.expiryDate),
                }
                : emptyCertificationForm);
        }
    }, [selectedCourier]);

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

    const createCourierRequest = (): CourierCreateRequest => ({
        supplierCode: {
            value: createForm.supplierCode.trim(),
        },
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        telephoneNumber: createForm.telephoneNumber.trim(),
    });

    const createCourier = () => {
        if (!createForm.supplierCode.trim() || !createForm.firstName.trim() || !createForm.lastName.trim()) {
            setError(createTranslations.required);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        CourierService.create(createCourierRequest())
            .then(() => {
                setSuccess(createTranslations.success);
                const newCode = createForm.supplierCode.trim();
                setCreateForm({...emptyCreateForm});
                setCreateDialogOpen(false);
                setSelectedCode(newCode);
                retrieveCouriers(false);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, createTranslations.error));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const openMenu = (event: React.MouseEvent<HTMLButtonElement>, courier: CourierDto) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setMenuCourier(courier);
    };

    const closeMenu = () => {
        setMenuAnchor(null);
        setMenuCourier(null);
    };

    const startEdit = (courier: CourierDto) => {
        selectCourier(courier);
        setEditing(true);
        closeMenu();
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
                closeMenu();
            });
    };

    const saveBasicData = () => {
        if (!selectedCourier) {
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        CourierService.updateBasicData({
            supplierCode: selectedCourier.supplierCode,
            firstName: basicForm.firstName,
            lastName: basicForm.lastName,
            telephoneNumber: basicForm.telephoneNumber,
        })
            .then(() => {
                updateCourierInState(selectedCourier.supplierCode.value, basicForm);
                setEditing(false);
                setSuccess(pl.couriers.page.basicDataSaved);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const saveCertification = () => {
        if (!selectedCourier) {
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        const certification = {
            ...certificationForm,
            issueDate: toIsoDate(certificationForm.issueDate),
            expiryDate: toIsoDate(certificationForm.expiryDate),
        };

        CourierService.updateCertification({
            supplierCode: selectedCourier.supplierCode,
            dangerousGoodCertification: certification,
        })
            .then(() => {
                updateCourierInState(selectedCourier.supplierCode.value, {dangerousGoodCertification: certification});
                setSuccess(pl.couriers.page.certificationSaved);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
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

            <section className="couriers-grid couriers-list-grid">
                <div className="couriers-table-panel couriers-table-panel-wide">
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
                                    <th aria-label={pl.couriers.columns.actions}></th>
                                </tr>
                                </thead>
                                <tbody>
                                {couriers.map((courier) => {
                                    const isSelected = selectedCode === courier.supplierCode.value;
                                    return (
                                        <tr
                                            className={isSelected ? "couriers-row-selected" : ""}
                                            key={courier.supplierCode.value}
                                            onClick={() => openCourierDetails(courier)}
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
                                            <td>
                                                <IconButton
                                                    aria-label={pl.couriers.columns.actions}
                                                    disabled={saving}
                                                    onClick={(event) => openMenu(event, courier)}
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!couriers.length ? (
                                    <tr>
                                        <td className="couriers-empty-row" colSpan={9}>{pl.couriers.page.empty}</td>
                                    </tr>
                                ) : undefined}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <aside className="couriers-details-panel couriers-details-panel-hidden">
                    <div className="couriers-panel-header">
                        <Typography variant="h5">{pl.couriers.page.detailsTitle}</Typography>
                        {selectedCourier ? (
                            <span className="couriers-details-code">{selectedCourier.supplierCode.value}</span>
                        ) : undefined}
                    </div>

                    {selectedCourier ? (
                        <>
                            <div className="couriers-details-card">
                                <div className="couriers-person">
                                    <span className="couriers-avatar">{selectedCourier.firstName?.slice(0, 1) || "?"}</span>
                                    <div>
                                        <strong>{selectedCourier.firstName} {selectedCourier.lastName}</strong>
                                        <small>{valueOrDash(selectedCourier.telephoneNumber)}</small>
                                    </div>
                                </div>
                                <div className="couriers-check-grid">
                                    <div className={hasValidLicense(selectedCourier) ? "couriers-check-card-ok" : "couriers-check-card-bad"}>
                                        <Badge />
                                        <span>{hasValidLicense(selectedCourier) ? pl.couriers.checks.validLicense : pl.couriers.checks.invalidLicense}</span>
                                        <small>{formatDate(selectedCourier.driverLicense?.drivingLicenseExpiryDate)}</small>
                                    </div>
                                    <div className={hasValidCertification(selectedCourier) ? "couriers-check-card-ok" : "couriers-check-card-bad"}>
                                        <WorkspacePremium />
                                        <span>{hasValidCertification(selectedCourier) ? pl.couriers.checks.validCertification : pl.couriers.checks.invalidCertification}</span>
                                        <small>{formatDate(selectedCourier.dangerousGoodCertification?.expiryDate)}</small>
                                    </div>
                                </div>
                            </div>

                            <div className="couriers-form-section">
                                <div className="couriers-section-title">
                                    <Typography variant="h6">{pl.couriers.actions.edit}</Typography>
                                    <Button
                                        startIcon={<Edit />}
                                        variant={editing ? "outlined" : "contained"}
                                        onClick={() => setEditing((current) => !current)}
                                    >
                                        {editing ? pl.couriers.actions.cancelEdit : pl.couriers.actions.edit}
                                    </Button>
                                </div>
                                <div className="couriers-form-grid">
                                    <TextField
                                        disabled={!editing || saving}
                                        label={pl.couriers.fields.firstName}
                                        value={basicForm.firstName}
                                        onChange={(event) => setBasicForm({...basicForm, firstName: event.target.value})}
                                    />
                                    <TextField
                                        disabled={!editing || saving}
                                        label={pl.couriers.fields.lastName}
                                        value={basicForm.lastName}
                                        onChange={(event) => setBasicForm({...basicForm, lastName: event.target.value})}
                                    />
                                    <TextField
                                        disabled={!editing || saving}
                                        label={pl.couriers.fields.telephoneNumber}
                                        value={basicForm.telephoneNumber}
                                        onChange={(event) => setBasicForm({...basicForm, telephoneNumber: event.target.value})}
                                    />
                                </div>
                                {editing ? (
                                    <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={saveBasicData}>
                                        {pl.couriers.actions.saveBasicData}
                                    </Button>
                                ) : undefined}
                            </div>

                            <div className="couriers-form-section">
                                <Typography variant="h6">{pl.couriers.actions.addCertification}</Typography>
                                <div className="couriers-form-grid">
                                    <TextField
                                        disabled={saving}
                                        label={pl.couriers.fields.certificateNumber}
                                        value={certificationForm.certificateNumber}
                                        onChange={(event) => setCertificationForm({...certificationForm, certificateNumber: event.target.value})}
                                    />
                                    <TextField
                                        disabled={saving}
                                        label={pl.couriers.fields.authority}
                                        value={certificationForm.authority}
                                        onChange={(event) => setCertificationForm({...certificationForm, authority: event.target.value})}
                                    />
                                    <TextField
                                        InputLabelProps={{shrink: true}}
                                        disabled={saving}
                                        label={pl.couriers.fields.issueDate}
                                        type="date"
                                        value={certificationForm.issueDate}
                                        onChange={(event) => setCertificationForm({...certificationForm, issueDate: event.target.value})}
                                    />
                                    <TextField
                                        InputLabelProps={{shrink: true}}
                                        disabled={saving}
                                        label={pl.couriers.fields.expiryDate}
                                        type="date"
                                        value={certificationForm.expiryDate}
                                        onChange={(event) => setCertificationForm({...certificationForm, expiryDate: event.target.value})}
                                    />
                                </div>
                                <FormControlLabel
                                    control={(
                                        <Checkbox
                                            checked={certificationForm.valid}
                                            disabled={saving}
                                            onChange={(event) => setCertificationForm({...certificationForm, valid: event.target.checked})}
                                        />
                                    )}
                                    label={pl.couriers.fields.valid}
                                />
                                <Button disabled={saving} startIcon={<WorkspacePremium />} variant="contained" onClick={saveCertification}>
                                    {pl.couriers.actions.saveCertification}
                                </Button>
                            </div>

                            <dl className="couriers-meta">
                                <div>
                                    <dt>{pl.couriers.fields.driverLicenseNumber}</dt>
                                    <dd>{valueOrDash(selectedCourier.driverLicense?.number)}</dd>
                                </div>
                                <div>
                                    <dt>{pl.couriers.fields.device}</dt>
                                    <dd>{valueOrDash(selectedCourier.deviceId?.value)}</dd>
                                </div>
                                <div>
                                    <dt>{pl.couriers.fields.deliveryArea}</dt>
                                    <dd>{valueOrDash(selectedCourier.deliveryArea?.areaName)}</dd>
                                </div>
                                <div>
                                    <dt>{pl.couriers.fields.packageTypes}</dt>
                                    <dd>{selectedCourier.supportedPackageTypes?.join(", ") || pl.common.dash}</dd>
                                </div>
                            </dl>
                        </>
                    ) : (
                        <div className="couriers-empty-details">{pl.couriers.page.emptyDetails}</div>
                    )}
                </aside>
            </section>

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
                {menuCourier ? (
                    <MenuItem onClick={() => startEdit(menuCourier)}>
                        <Edit fontSize="small" />
                        <span>{pl.couriers.actions.edit}</span>
                    </MenuItem>
                ) : undefined}
                {menuCourier && menuCourier.status !== "ACTIVE" ? (
                    <MenuItem onClick={() => changeStatus(menuCourier, true)}>
                        <CheckCircle fontSize="small" />
                        <span>{pl.couriers.actions.activate}</span>
                    </MenuItem>
                ) : undefined}
                {menuCourier && menuCourier.status === "ACTIVE" ? (
                    <MenuItem onClick={() => changeStatus(menuCourier, false)}>
                        <Block fontSize="small" />
                        <span>{pl.couriers.actions.deactivate}</span>
                    </MenuItem>
                ) : undefined}
            </Menu>

            <Dialog fullWidth maxWidth="sm" open={createDialogOpen} onClose={() => !saving && setCreateDialogOpen(false)}>
                <DialogTitle>{createTranslations.title}</DialogTitle>
                <DialogContent>
                    <div className="couriers-create-grid couriers-dialog-grid">
                        <TextField
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
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} onClick={() => setCreateDialogOpen(false)}>{createTranslations.cancel}</Button>
                    <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={createCourier}>
                        {saving ? createTranslations.saving : createTranslations.submit}
                    </Button>
                </DialogActions>
            </Dialog>
        </main>
    );
}

export default Couriers;
