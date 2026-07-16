import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    IconButton,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";
import {
    ArrowBack,
    Badge,
    Close,
    Edit,
    LocalShipping,
    Refresh,
    Save,
    WorkspacePremium,
} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";
import {getBackendErrorMessage} from "../../api/errorMessage";
import CourierService from "../../hooks/CourierService";
import pl from "../../i18n/translate";
import {CourierDto, DangerousGoodCertificationDto, DriverLicenseDto} from "./dto/CourierDto";
import "./styles/couriers.css";

const packageTypeOptions = ["SMALL", "MEDIUM", "LARGE", "FRAGILE", "OVERSIZED"];

const valueOrDash = (value?: string | number | null) => value || pl.common.dash;

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

const emptyDriverLicenseForm: DriverLicenseDto = {
    number: "",
    acquiredDate: "",
    drivingLicenseExpiryDate: "",
};

const emptyCertificationForm: DangerousGoodCertificationDto = {
    certificateNumber: "",
    issueDate: "",
    expiryDate: "",
    authority: "",
    valid: true,
};

const emptyOperationalForm = {
    status: "",
    departmentCode: "",
    vehicleId: "",
    deviceId: "",
    areaName: "",
    city: "",
    district: "",
    municipality: "",
    region: "",
    country: "",
    postalCodes: "",
    packageTypes: "",
};

const CourierDetails: React.FC = () => {
    const navigate = useNavigate();
    const {supplierCode = ""} = useParams();
    const decodedSupplierCode = useMemo(() => decodeURIComponent(supplierCode), [supplierCode]);
    const [courier, setCourier] = useState<CourierDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [basicForm, setBasicForm] = useState({firstName: "", lastName: "", telephoneNumber: ""});
    const [driverLicenseForm, setDriverLicenseForm] = useState<DriverLicenseDto>(emptyDriverLicenseForm);
    const [certificationForm, setCertificationForm] = useState<DangerousGoodCertificationDto>(emptyCertificationForm);
    const [operationalForm, setOperationalForm] = useState({...emptyOperationalForm});
    const [editingOperationalCard, setEditingOperationalCard] = useState<string>("");

    const hydrateForms = (nextCourier: CourierDto) => {
        setBasicForm({
            firstName: nextCourier.firstName || "",
            lastName: nextCourier.lastName || "",
            telephoneNumber: nextCourier.telephoneNumber || "",
        });
        setDriverLicenseForm(nextCourier.driverLicense
            ? {
                ...nextCourier.driverLicense,
                acquiredDate: toDateInputValue(nextCourier.driverLicense.acquiredDate),
                drivingLicenseExpiryDate: toDateInputValue(nextCourier.driverLicense.drivingLicenseExpiryDate),
            }
            : emptyDriverLicenseForm);
        setCertificationForm(nextCourier.dangerousGoodCertification
            ? {
                ...nextCourier.dangerousGoodCertification,
                issueDate: toDateInputValue(nextCourier.dangerousGoodCertification.issueDate),
                expiryDate: toDateInputValue(nextCourier.dangerousGoodCertification.expiryDate),
            }
            : emptyCertificationForm);
        setOperationalForm({
            status: nextCourier.status || "",
            departmentCode: nextCourier.departmentCode?.value || "",
            vehicleId: nextCourier.vehicleId?.value ? String(nextCourier.vehicleId.value) : "",
            deviceId: nextCourier.deviceId?.value || "",
            areaName: nextCourier.deliveryArea?.areaName || "",
            city: nextCourier.deliveryArea?.city || "",
            district: nextCourier.deliveryArea?.district || "",
            municipality: nextCourier.deliveryArea?.municipality || "",
            region: nextCourier.deliveryArea?.region || "",
            country: nextCourier.deliveryArea?.country || "",
            postalCodes: nextCourier.deliveryArea?.postalCodes?.join(", ") || "",
            packageTypes: nextCourier.supportedPackageTypes?.join(", ") || "",
        });
    };

    const loadCourier = useCallback(() => {
        setLoading(true);
        setError("");
        CourierService.getAll()
            .then((response) => {
                const foundCourier = response.data.find((item) => item.supplierCode.value === decodedSupplierCode) || null;
                setCourier(foundCourier);
                if (foundCourier) {
                    hydrateForms(foundCourier);
                } else {
                    setError(pl.couriers.page.notFound);
                }
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.loadError));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [decodedSupplierCode]);

    useEffect(() => {
        loadCourier();
    }, [loadCourier]);

    const updateCourier = (patch: Partial<CourierDto>) => {
        setCourier((currentCourier) => currentCourier ? {...currentCourier, ...patch} : currentCourier);
    };

    const saveBasicData = () => {
        if (!courier) {
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        CourierService.updateBasicData({
            supplierCode: courier.supplierCode,
            firstName: basicForm.firstName,
            lastName: basicForm.lastName,
            telephoneNumber: basicForm.telephoneNumber,
        })
            .then(() => {
                updateCourier(basicForm);
                setSuccess(pl.couriers.page.basicDataSaved);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const saveDriverLicense = () => {
        if (!courier) {
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        const driverLicense = {
            ...driverLicenseForm,
            acquiredDate: toIsoDate(driverLicenseForm.acquiredDate),
            drivingLicenseExpiryDate: toIsoDate(driverLicenseForm.drivingLicenseExpiryDate),
        };

        CourierService.updateDriverLicense({
            supplierCode: courier.supplierCode,
            driverLicense,
        })
            .then(() => {
                updateCourier({driverLicense});
                setSuccess(pl.couriers.page.driverLicenseSaved);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const saveCertification = () => {
        if (!courier) {
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        const dangerousGoodCertification = {
            ...certificationForm,
            issueDate: toIsoDate(certificationForm.issueDate),
            expiryDate: toIsoDate(certificationForm.expiryDate),
        };

        CourierService.updateCertification({
            supplierCode: courier.supplierCode,
            dangerousGoodCertification,
        })
            .then(() => {
                updateCourier({dangerousGoodCertification});
                setSuccess(pl.couriers.page.certificationSaved);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const parsePackageTypes = () => operationalForm.packageTypes
        .split(",")
        .map((packageType) => packageType.trim().toUpperCase())
        .filter(Boolean);

    const deliveryAreaFromForm = () => ({
        areaName: operationalForm.areaName.trim(),
        city: operationalForm.city.trim(),
        district: operationalForm.district.trim(),
        municipality: operationalForm.municipality.trim(),
        region: operationalForm.region.trim(),
        country: operationalForm.country.trim(),
        postalCodes: operationalForm.postalCodes
            .split(",")
            .map((postalCode) => postalCode.trim())
            .filter(Boolean),
    });

    const saveOperationalDevice = () => {
        if (!courier) {
            return;
        }

        if (!operationalForm.deviceId.trim()) {
            setError(pl.couriers.page.deviceRequired);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        CourierService.updateDevice({
            supplierCode: courier.supplierCode,
            deviceId: {value: operationalForm.deviceId.trim()},
        })
            .then(() => {
                updateCourier({deviceId: {value: operationalForm.deviceId.trim()}});
                setSuccess(pl.couriers.page.operationalDataSaved);
                setEditingOperationalCard("");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const saveOperationalVehicle = () => {
        if (!courier) {
            return;
        }

        const vehicleId = Number(operationalForm.vehicleId);
        if (!Number.isFinite(vehicleId)) {
            setError(pl.couriers.page.vehicleRequired);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        CourierService.updateVehicle({
            supplierCode: courier.supplierCode,
            vehicleId: {value: vehicleId},
        })
            .then(() => {
                updateCourier({vehicleId: {value: vehicleId}});
                setSuccess(pl.couriers.page.operationalDataSaved);
                setEditingOperationalCard("");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const saveOperationalDeliveryArea = () => {
        if (!courier) {
            return;
        }

        const deliveryArea = deliveryAreaFromForm();
        setSaving(true);
        setError("");
        setSuccess("");

        CourierService.updateDeliveryArea({
            supplierCode: courier.supplierCode,
            deliveryArea,
        })
            .then(() => {
                updateCourier({deliveryArea});
                setSuccess(pl.couriers.page.operationalDataSaved);
                setEditingOperationalCard("");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const saveOperationalPackageTypes = () => {
        if (!courier) {
            return;
        }

        const supportedPackageTypes = parsePackageTypes();
        setSaving(true);
        setError("");
        setSuccess("");

        CourierService.updatePackageTypes({
            supplierCode: courier.supplierCode,
            supportedPackageTypes,
        })
            .then(() => {
                updateCourier({supportedPackageTypes});
                setSuccess(pl.couriers.page.operationalDataSaved);
                setEditingOperationalCard("");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const saveOperationalDepartment = () => {
        if (!courier) {
            return;
        }

        if (!operationalForm.departmentCode.trim()) {
            setError(pl.couriers.page.departmentRequired);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        CourierService.updateDepartment({
            supplierCode: courier.supplierCode,
            departmentCode: {value: operationalForm.departmentCode.trim()},
        })
            .then(() => {
                updateCourier({departmentCode: {value: operationalForm.departmentCode.trim()}});
                setSuccess(pl.couriers.page.operationalDataSaved);
                setEditingOperationalCard("");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const saveOperationalStatus = () => {
        if (!courier || !operationalForm.status) {
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        const request = operationalForm.status === "ACTIVE"
            ? CourierService.activate(courier.supplierCode.value)
            : CourierService.deactivate(courier.supplierCode.value);

        request
            .then(() => {
                updateCourier({status: operationalForm.status});
                setSuccess(pl.couriers.page.operationalDataSaved);
                setEditingOperationalCard("");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const cancelOperationalEdit = () => {
        if (courier) {
            hydrateForms(courier);
        }
        setEditingOperationalCard("");
    };

    return (
        <main className="couriers-page courier-details-page">
            <section className="couriers-header">
                <div className="couriers-detail-heading">
                    <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate("/couriers")}>
                        {pl.couriers.actions.backToList}
                    </Button>
                    <div>
                        <span className="couriers-kicker">{pl.couriers.page.kicker}</span>
                        <Typography variant="h4">{pl.couriers.page.detailsTitle}</Typography>
                        <p>{decodedSupplierCode}</p>
                    </div>
                </div>
                <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={loadCourier}>
                    {pl.couriers.actions.refresh}
                </Button>
            </section>

            {error ? <Alert severity="error">{error}</Alert> : undefined}
            {success ? <Alert severity="success">{success}</Alert> : undefined}

            {loading ? (
                <section className="couriers-table-panel">
                    <div className="couriers-loader">
                        <CircularProgress size={28} />
                        <span>{pl.couriers.page.loading}</span>
                    </div>
                </section>
            ) : courier ? (
                <section className="courier-details-layout">
                    <div className="courier-details-left-column">
                        <div className="couriers-details-panel courier-details-main-panel">
                            <div className="couriers-person">
                                <span className="couriers-avatar">{courier.firstName?.slice(0, 1) || "?"}</span>
                                <div>
                                    <strong>{courier.firstName} {courier.lastName}</strong>
                                    <small>{valueOrDash(courier.telephoneNumber)}</small>
                                </div>
                            </div>
                            <div className="couriers-check-grid">
                                <div className={hasValidLicense(courier) ? "couriers-check-card-ok" : "couriers-check-card-bad"}>
                                    <Badge />
                                    <span>{hasValidLicense(courier) ? pl.couriers.checks.validLicense : pl.couriers.checks.invalidLicense}</span>
                                    <small>{formatDate(courier.driverLicense?.drivingLicenseExpiryDate)}</small>
                                </div>
                                <div className={hasValidCertification(courier) ? "couriers-check-card-ok" : "couriers-check-card-bad"}>
                                    <WorkspacePremium />
                                    <span>{hasValidCertification(courier) ? pl.couriers.checks.validCertification : pl.couriers.checks.invalidCertification}</span>
                                    <small>{formatDate(courier.dangerousGoodCertification?.expiryDate)}</small>
                                </div>
                            </div>
                        </div>

                        <div className="couriers-details-panel couriers-form-section">
                            <Typography variant="h6">{pl.couriers.sections.basicData}</Typography>
                            <div className="couriers-form-grid couriers-form-grid-three">
                                <TextField
                                    disabled={saving}
                                    label={pl.couriers.fields.firstName}
                                    value={basicForm.firstName}
                                    onChange={(event) => setBasicForm({...basicForm, firstName: event.target.value})}
                                />
                                <TextField
                                    disabled={saving}
                                    label={pl.couriers.fields.lastName}
                                    value={basicForm.lastName}
                                    onChange={(event) => setBasicForm({...basicForm, lastName: event.target.value})}
                                />
                                <TextField
                                    disabled={saving}
                                    label={pl.couriers.fields.telephoneNumber}
                                    value={basicForm.telephoneNumber}
                                    onChange={(event) => setBasicForm({...basicForm, telephoneNumber: event.target.value})}
                                />
                            </div>
                            <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={saveBasicData}>
                                {pl.couriers.actions.saveBasicData}
                            </Button>
                        </div>

                        <div className="couriers-details-panel couriers-form-section">
                            <Typography variant="h6">{pl.couriers.sections.driverLicense}</Typography>
                            <div className="couriers-form-grid couriers-form-grid-three">
                                <TextField
                                    disabled={saving}
                                    label={pl.couriers.fields.driverLicenseNumber}
                                    value={driverLicenseForm.number}
                                    onChange={(event) => setDriverLicenseForm({...driverLicenseForm, number: event.target.value})}
                                />
                                <TextField
                                    InputLabelProps={{shrink: true}}
                                    disabled={saving}
                                    label={pl.couriers.fields.acquiredDate}
                                    type="date"
                                    value={driverLicenseForm.acquiredDate}
                                    onChange={(event) => setDriverLicenseForm({...driverLicenseForm, acquiredDate: event.target.value})}
                                />
                                <TextField
                                    InputLabelProps={{shrink: true}}
                                    disabled={saving}
                                    label={pl.couriers.fields.drivingLicenseExpiryDate}
                                    type="date"
                                    value={driverLicenseForm.drivingLicenseExpiryDate}
                                    onChange={(event) => setDriverLicenseForm({...driverLicenseForm, drivingLicenseExpiryDate: event.target.value})}
                                />
                            </div>
                            <Button disabled={saving} startIcon={<Badge />} variant="contained" onClick={saveDriverLicense}>
                                {pl.couriers.actions.saveDriverLicense}
                            </Button>
                        </div>

                        <div className="couriers-details-panel couriers-form-section">
                            <Typography variant="h6">{pl.couriers.sections.certification}</Typography>
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
                    </div>

                    <aside className="couriers-details-panel courier-details-side-panel">
                        <div className="couriers-panel-header">
                            <Typography variant="h5">{pl.couriers.sections.operationalData}</Typography>
                            <span className="couriers-details-code">{courier.supplierCode.value}</span>
                        </div>
                        <div className="courier-operational-list">
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.columns.status}</dt>
                                    <IconButton disabled={saving} size="small" onClick={() => setEditingOperationalCard("status")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                {editingOperationalCard === "status" ? (
                                    <div className="courier-operational-edit">
                                        <TextField
                                            select
                                            disabled={saving}
                                            size="small"
                                            value={operationalForm.status}
                                            onChange={(event) => setOperationalForm({...operationalForm, status: event.target.value})}
                                        >
                                            <MenuItem value="ACTIVE">{pl.couriers.status.ACTIVE}</MenuItem>
                                            <MenuItem value="INACTIVE">{pl.couriers.status.INACTIVE}</MenuItem>
                                        </TextField>
                                        <div className="courier-operational-edit-actions">
                                            <Button disabled={saving} size="small" variant="contained" onClick={saveOperationalStatus}>
                                                {pl.common.saveChanges}
                                            </Button>
                                            <Button disabled={saving} size="small" startIcon={<Close />} onClick={cancelOperationalEdit}>
                                                {pl.couriers.actions.cancelEdit}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <dd>{valueOrDash(courier.status)}</dd>
                                )}
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.fields.device}</dt>
                                    <IconButton disabled={saving} size="small" onClick={() => setEditingOperationalCard("device")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                {editingOperationalCard === "device" ? (
                                    <div className="courier-operational-edit">
                                        <TextField
                                            disabled={saving}
                                            size="small"
                                            value={operationalForm.deviceId}
                                            onChange={(event) => setOperationalForm({...operationalForm, deviceId: event.target.value})}
                                        />
                                        <div className="courier-operational-edit-actions">
                                            <Button disabled={saving} size="small" variant="contained" onClick={saveOperationalDevice}>
                                                {pl.common.saveChanges}
                                            </Button>
                                            <Button disabled={saving} size="small" startIcon={<Close />} onClick={cancelOperationalEdit}>
                                                {pl.couriers.actions.cancelEdit}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <dd>{valueOrDash(courier.deviceId?.value)}</dd>
                                )}
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.columns.vehicle}</dt>
                                    <IconButton disabled={saving} size="small" onClick={() => setEditingOperationalCard("vehicle")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                {editingOperationalCard === "vehicle" ? (
                                    <div className="courier-operational-edit">
                                        <TextField
                                            disabled={saving}
                                            size="small"
                                            value={operationalForm.vehicleId}
                                            onChange={(event) => setOperationalForm({...operationalForm, vehicleId: event.target.value})}
                                        />
                                        <div className="courier-operational-edit-actions">
                                            <Button disabled={saving} size="small" variant="contained" onClick={saveOperationalVehicle}>
                                                {pl.common.saveChanges}
                                            </Button>
                                            <Button disabled={saving} size="small" startIcon={<Close />} onClick={cancelOperationalEdit}>
                                                {pl.couriers.actions.cancelEdit}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <dd>{valueOrDash(courier.vehicleId?.value)}</dd>
                                )}
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.fields.deliveryArea}</dt>
                                    <IconButton disabled={saving} size="small" onClick={() => setEditingOperationalCard("deliveryArea")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                {editingOperationalCard === "deliveryArea" ? (
                                    <div className="courier-operational-edit">
                                        <TextField disabled={saving} label={pl.couriers.fields.deliveryArea} size="small" value={operationalForm.areaName} onChange={(event) => setOperationalForm({...operationalForm, areaName: event.target.value})}/>
                                        <TextField disabled={saving} label={pl.couriers.fields.city} size="small" value={operationalForm.city} onChange={(event) => setOperationalForm({...operationalForm, city: event.target.value})}/>
                                        <TextField disabled={saving} label={pl.couriers.fields.region} size="small" value={operationalForm.region} onChange={(event) => setOperationalForm({...operationalForm, region: event.target.value})}/>
                                        <TextField disabled={saving} label={pl.couriers.fields.district} size="small" value={operationalForm.district} onChange={(event) => setOperationalForm({...operationalForm, district: event.target.value})}/>
                                        <TextField disabled={saving} label={pl.couriers.fields.municipality} size="small" value={operationalForm.municipality} onChange={(event) => setOperationalForm({...operationalForm, municipality: event.target.value})}/>
                                        <TextField disabled={saving} label={pl.couriers.fields.country} size="small" value={operationalForm.country} onChange={(event) => setOperationalForm({...operationalForm, country: event.target.value})}/>
                                        <TextField disabled={saving} label={pl.couriers.fields.postalCodes} size="small" value={operationalForm.postalCodes} onChange={(event) => setOperationalForm({...operationalForm, postalCodes: event.target.value})}/>
                                        <div className="courier-operational-edit-actions">
                                            <Button disabled={saving} size="small" variant="contained" onClick={saveOperationalDeliveryArea}>
                                                {pl.common.saveChanges}
                                            </Button>
                                            <Button disabled={saving} size="small" startIcon={<Close />} onClick={cancelOperationalEdit}>
                                                {pl.couriers.actions.cancelEdit}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <dd>{valueOrDash(courier.deliveryArea?.areaName)}</dd>
                                )}
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.fields.packageTypes}</dt>
                                    <IconButton disabled={saving} size="small" onClick={() => setEditingOperationalCard("packageTypes")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                {editingOperationalCard === "packageTypes" ? (
                                    <div className="courier-operational-edit">
                                        <TextField
                                            disabled={saving}
                                            helperText={pl.couriers.fields.packageTypesHint}
                                            size="small"
                                            value={operationalForm.packageTypes}
                                            onChange={(event) => setOperationalForm({...operationalForm, packageTypes: event.target.value})}
                                        />
                                        <small>{pl.couriers.fields.availablePackageTypes}: {packageTypeOptions.join(", ")}</small>
                                        <div className="courier-operational-edit-actions">
                                            <Button disabled={saving} size="small" variant="contained" onClick={saveOperationalPackageTypes}>
                                                {pl.common.saveChanges}
                                            </Button>
                                            <Button disabled={saving} size="small" startIcon={<Close />} onClick={cancelOperationalEdit}>
                                                {pl.couriers.actions.cancelEdit}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <dd>{courier.supportedPackageTypes?.join(", ") || pl.common.dash}</dd>
                                )}
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.fields.department}</dt>
                                    <IconButton disabled={saving} size="small" onClick={() => setEditingOperationalCard("department")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                {editingOperationalCard === "department" ? (
                                    <div className="courier-operational-edit">
                                        <TextField
                                            disabled={saving}
                                            size="small"
                                            value={operationalForm.departmentCode}
                                            onChange={(event) => setOperationalForm({...operationalForm, departmentCode: event.target.value})}
                                        />
                                        <div className="courier-operational-edit-actions">
                                            <Button disabled={saving} size="small" variant="contained" onClick={saveOperationalDepartment}>
                                                {pl.common.saveChanges}
                                            </Button>
                                            <Button disabled={saving} size="small" startIcon={<Close />} onClick={cancelOperationalEdit}>
                                                {pl.couriers.actions.cancelEdit}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <dd>{valueOrDash(courier.departmentCode?.value)}</dd>
                                )}
                            </div>
                        </div>
                    </aside>
                </section>
            ) : (
                <section className="couriers-table-panel">
                    <div className="couriers-empty-details">
                        <LocalShipping />
                        <span>{pl.couriers.page.notFound}</span>
                    </div>
                </section>
            )}
        </main>
    );
};

export default CourierDetails;
