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
    MenuItem,
    TextField,
    Typography,
} from "components/ui";
import {
    ArrowBack,
    Badge,
    Close,
    Edit,
    LocalShipping,
    Refresh,
    Save,
    Settings,
    WorkspacePremium,
} from "components/ui/icons";
import {useNavigate, useParams} from "react-router-dom";
import {getBackendErrorMessage} from "../../api/errorMessage";
import CarrierService from "../../hooks/CarrierService";
import CourierService from "../../hooks/CourierService";
import DeviceService from "../../hooks/DeviceService";
import pl from "../../i18n/translate";
import {CarrierDto} from "../Carriers/model/Carrier";
import {DeviceDto} from "../Devices/dto/DeviceDto";
import CourierConfigurationDialog from "./CourierConfigurationDialog";
import {CourierDto, DangerousGoodCertificationDto, DriverLicenseDto} from "./dto/CourierDto";
import {
    courierDeviceOptions, courierVehicleOptions, deviceLabel, packageTypeLabel, PACKAGE_TYPES, vehicleLabel,
} from "./courierOperationalData";
import "./styles/couriers.css";
import {parseOptionalId} from "../../utils/identifier";

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
    vehicleId: "",
    deviceId: "",
    areaName: "",
    city: "",
    district: "",
    municipality: "",
    region: "",
    country: "",
    postalCodes: "",
    packageTypes: [] as string[],
};

type CourierEditSection =
    | ""
    | "basicData"
    | "driverLicense"
    | "certification"
    | "status"
    | "device"
    | "vehicle"
    | "deliveryArea"
    | "packageTypes";

const CourierDetails: React.FC = () => {
    const navigate = useNavigate();
    const {supplierCode = ""} = useParams();
    const decodedSupplierCode = useMemo(() => decodeURIComponent(supplierCode), [supplierCode]);
    const [courier, setCourier] = useState<CourierDto | null>(null);
    const [carriers, setCarriers] = useState<CarrierDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [carriersLoading, setCarriersLoading] = useState<boolean>(false);
    const [devices, setDevices] = useState<DeviceDto[]>([]);
    const [devicesLoading, setDevicesLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [configurationDialogOpen, setConfigurationDialogOpen] = useState<boolean>(false);
    const [basicForm, setBasicForm] = useState({firstName: "", lastName: "", telephoneNumber: ""});
    const [driverLicenseForm, setDriverLicenseForm] = useState<DriverLicenseDto>(emptyDriverLicenseForm);
    const [certificationForm, setCertificationForm] = useState<DangerousGoodCertificationDto>(emptyCertificationForm);
    const [operationalForm, setOperationalForm] = useState({...emptyOperationalForm});
    const [editingSection, setEditingSection] = useState<CourierEditSection>("");

    const vehicleOptions = useMemo(() => courierVehicleOptions(carriers, courier?.vehicleId?.value),
        [carriers, courier?.vehicleId?.value]);

    const deviceOptions = useMemo(() => courierDeviceOptions(devices, courier?.deviceId?.value,
        courier?.departmentCode?.value), [devices, courier?.deviceId?.value, courier?.departmentCode?.value]);

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
            vehicleId: nextCourier.vehicleId?.value ? String(nextCourier.vehicleId.value) : "",
            deviceId: nextCourier.deviceId?.value || "",
            areaName: nextCourier.deliveryArea?.areaName || "",
            city: nextCourier.deliveryArea?.city || "",
            district: nextCourier.deliveryArea?.district || "",
            municipality: nextCourier.deliveryArea?.municipality || "",
            region: nextCourier.deliveryArea?.region || "",
            country: nextCourier.deliveryArea?.country || "",
            postalCodes: nextCourier.deliveryArea?.postalCodes?.join(", ") || "",
            packageTypes: nextCourier.supportedPackageTypes ? [...nextCourier.supportedPackageTypes] : [],
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

    const loadCarriers = useCallback(() => {
        setCarriersLoading(true);
        CarrierService.findAll(false)
            .then((response) => {
                setCarriers(Array.isArray(response.data) ? response.data : []);
            })
            .catch((exception: unknown) => {
                setCarriers([]);
                setError(getBackendErrorMessage(exception, pl.couriers.page.loadError));
            })
            .finally(() => {
                setCarriersLoading(false);
            });
    }, []);

    useEffect(() => {
        loadCarriers();
    }, [loadCarriers]);

    const loadDevices = useCallback(() => {
        setDevicesLoading(true);
        DeviceService.allDevices()
            .then((response) => {
                setDevices(Array.isArray(response.data) ? response.data : []);
            })
            .catch((exception: unknown) => {
                setDevices([]);
                setError(getBackendErrorMessage(exception, pl.couriers.page.loadError));
            })
            .finally(() => {
                setDevicesLoading(false);
            });
    }, []);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    const updateCourier = (patch: Partial<CourierDto>) => {
        setCourier((currentCourier) => currentCourier ? {...currentCourier, ...patch} : currentCourier);
    };

    const openEditDialog = (section: CourierEditSection) => {
        if (courier) {
            hydrateForms(courier);
        }
        setError("");
        setSuccess("");
        setEditingSection(section);
    };

    const closeEditDialog = () => {
        if (!saving) {
            if (courier) {
                hydrateForms(courier);
            }
            setEditingSection("");
        }
    };

    const editDialogTitle = () => {
        switch (editingSection) {
            case "basicData":
                return pl.couriers.sections.basicData;
            case "driverLicense":
                return pl.couriers.sections.driverLicense;
            case "certification":
                return pl.couriers.sections.certification;
            case "status":
                return pl.couriers.columns.status;
            case "device":
                return pl.couriers.fields.device;
            case "vehicle":
                return pl.couriers.columns.vehicle;
            case "deliveryArea":
                return pl.couriers.fields.deliveryArea;
            case "packageTypes":
                return pl.couriers.fields.packageTypes;
            default:
                return pl.couriers.actions.edit;
        }
    };

    const saveActiveSection = () => {
        switch (editingSection) {
            case "basicData":
                saveBasicData();
                break;
            case "driverLicense":
                saveDriverLicense();
                break;
            case "certification":
                saveCertification();
                break;
            case "status":
                saveOperationalStatus();
                break;
            case "device":
                saveOperationalDevice();
                break;
            case "vehicle":
                saveOperationalVehicle();
                break;
            case "deliveryArea":
                saveOperationalDeliveryArea();
                break;
            case "packageTypes":
                saveOperationalPackageTypes();
                break;
            default:
                break;
        }
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
                setEditingSection("");
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
                setEditingSection("");
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
                setEditingSection("");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const togglePackageType = (packageType: string) => setOperationalForm((current) => ({
        ...current,
        packageTypes: current.packageTypes.includes(packageType)
            ? current.packageTypes.filter((selected) => selected !== packageType)
            : [...current.packageTypes, packageType],
    }));

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
                setEditingSection("");
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

        // Vehicle ids are random 63-bit numbers; Number() would round them to a different id.
        const vehicleId = parseOptionalId(operationalForm.vehicleId);
        if (!vehicleId) {
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
                setEditingSection("");
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
                setEditingSection("");
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

        const supportedPackageTypes = PACKAGE_TYPES.filter((packageType) => operationalForm.packageTypes.includes(packageType));
        if (!supportedPackageTypes.length) {
            setError(pl.couriers.fields.packageTypesRequired);
            return;
        }
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
                setEditingSection("");
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
        const nextStatus = operationalForm.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
        const request = nextStatus === "ACTIVE"
            ? CourierService.activate(courier.supplierCode.value)
            : CourierService.deactivate(courier.supplierCode.value);

        request
            .then(() => {
                updateCourier({status: nextStatus});
                setSuccess(pl.couriers.page.operationalDataSaved);
                setEditingSection("");
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.couriers.page.saveError));
            })
            .finally(() => {
                setSaving(false);
            });
    };

    return (
        <main className="couriers-page courier-details-page">
            <section className="couriers-header">
                <div className="couriers-detail-heading">
                    <div className="courier-details-title">
                        <span aria-hidden="true" className="courier-details-title-icon">
                            <LocalShipping />
                        </span>
                        <div>
                            <Typography variant="h4">{pl.couriers.page.detailsTitle}</Typography>
                            <p>{decodedSupplierCode}</p>
                        </div>
                    </div>
                </div>
                <div className="couriers-table-actions">
                    <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate("/couriers")}>
                        {pl.couriers.actions.backToList}
                    </Button>
                    <Button disabled={loading} startIcon={<Settings />} variant="outlined" onClick={() => setConfigurationDialogOpen(true)}>
                        {pl.globalConfiguration.courierConfiguration.title}
                    </Button>
                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={loadCourier}>
                        {pl.couriers.actions.refresh}
                    </Button>
                </div>
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

                        <div className="courier-details-section-grid">
                            <div className="couriers-details-panel courier-details-summary-card">
                                <div className="courier-summary-card-header">
                                    <Typography variant="h6">{pl.couriers.sections.basicData}</Typography>
                                    <Button aria-label={`${pl.common.edit}: ${pl.couriers.sections.basicData}`} disabled={saving} startIcon={<Edit fontSize="small" />} variant="outlined" onClick={() => openEditDialog("basicData")}>
                                        {pl.common.edit}
                                    </Button>
                                </div>
                                <dl className="courier-summary-list">
                                    <div><dt>{pl.couriers.fields.firstName}</dt><dd>{valueOrDash(courier.firstName)}</dd></div>
                                    <div><dt>{pl.couriers.fields.lastName}</dt><dd>{valueOrDash(courier.lastName)}</dd></div>
                                    <div><dt>{pl.couriers.fields.telephoneNumber}</dt><dd>{valueOrDash(courier.telephoneNumber)}</dd></div>
                                </dl>
                            </div>

                            <div className="couriers-details-panel courier-details-summary-card">
                                <div className="courier-summary-card-header">
                                    <Typography variant="h6">{pl.couriers.sections.driverLicense}</Typography>
                                    <Button aria-label={`${pl.common.edit}: ${pl.couriers.sections.driverLicense}`} disabled={saving} startIcon={<Edit fontSize="small" />} variant="outlined" onClick={() => openEditDialog("driverLicense")}>
                                        {pl.common.edit}
                                    </Button>
                                </div>
                                <dl className="courier-summary-list">
                                    <div><dt>{pl.couriers.fields.driverLicenseNumber}</dt><dd>{valueOrDash(courier.driverLicense?.number)}</dd></div>
                                    <div><dt>{pl.couriers.fields.acquiredDate}</dt><dd>{formatDate(courier.driverLicense?.acquiredDate)}</dd></div>
                                    <div><dt>{pl.couriers.fields.drivingLicenseExpiryDate}</dt><dd>{formatDate(courier.driverLicense?.drivingLicenseExpiryDate)}</dd></div>
                                </dl>
                            </div>

                            <div className="couriers-details-panel courier-details-summary-card courier-details-summary-card-wide">
                                <div className="courier-summary-card-header">
                                    <Typography variant="h6">{pl.couriers.sections.certification}</Typography>
                                    <Button aria-label={`${pl.common.edit}: ${pl.couriers.sections.certification}`} disabled={saving} startIcon={<Edit fontSize="small" />} variant="outlined" onClick={() => openEditDialog("certification")}>
                                        {pl.common.edit}
                                    </Button>
                                </div>
                                <dl className="courier-summary-list courier-summary-list-four">
                                    <div><dt>{pl.couriers.fields.certificateNumber}</dt><dd>{valueOrDash(courier.dangerousGoodCertification?.certificateNumber)}</dd></div>
                                    <div><dt>{pl.couriers.fields.authority}</dt><dd>{valueOrDash(courier.dangerousGoodCertification?.authority)}</dd></div>
                                    <div><dt>{pl.couriers.fields.issueDate}</dt><dd>{formatDate(courier.dangerousGoodCertification?.issueDate)}</dd></div>
                                    <div><dt>{pl.couriers.fields.expiryDate}</dt><dd>{formatDate(courier.dangerousGoodCertification?.expiryDate)}</dd></div>
                                </dl>
                            </div>
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
                                    <IconButton aria-label={`${pl.common.edit}: ${pl.couriers.columns.status}`} disabled={saving} size="small" onClick={() => openEditDialog("status")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                <dd><span className={`couriers-status couriers-status-${(courier.status || "unknown").toLowerCase()}`}>
                                    {courier.status ? pl.couriers.status[courier.status as keyof typeof pl.couriers.status] || courier.status : pl.common.dash}
                                </span></dd>
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.fields.device}</dt>
                                    <IconButton aria-label={`${pl.common.edit}: ${pl.couriers.fields.device}`} disabled={saving} size="small" onClick={() => openEditDialog("device")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                <dd>{courier.deviceId?.value
                                    ? deviceLabel(deviceOptions, courier.deviceId.value)
                                    : pl.couriers.fields.noDevice}</dd>
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.columns.vehicle}</dt>
                                    <IconButton aria-label={`${pl.common.edit}: ${pl.couriers.columns.vehicle}`} disabled={saving} size="small" onClick={() => openEditDialog("vehicle")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                <dd>{courier.vehicleId?.value
                                    ? vehicleLabel(vehicleOptions, courier.vehicleId.value)
                                    : pl.couriers.fields.noVehicle}</dd>
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.fields.deliveryArea}</dt>
                                    <IconButton aria-label={`${pl.common.edit}: ${pl.couriers.fields.deliveryArea}`} disabled={saving} size="small" onClick={() => openEditDialog("deliveryArea")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                <dd>{valueOrDash(courier.deliveryArea?.areaName)}</dd>
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.fields.packageTypes}</dt>
                                    <IconButton aria-label={`${pl.common.edit}: ${pl.couriers.fields.packageTypes}`} disabled={saving} size="small" onClick={() => openEditDialog("packageTypes")}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                                <dd>{courier.supportedPackageTypes?.length
                                    ? courier.supportedPackageTypes.map(packageTypeLabel).join(", ")
                                    : pl.common.dash}</dd>
                            </div>
                            <div className="courier-operational-card">
                                <div className="courier-operational-card-header">
                                    <dt>{pl.couriers.fields.department}</dt>
                                </div>
                                <dd title={pl.couriers.fields.departmentLocked}>{valueOrDash(courier.departmentCode?.value)}</dd>
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

            <Dialog
                className="courier-edit-dialog"
                fullWidth
                maxWidth={editingSection === "deliveryArea" || editingSection === "certification" ? "md" : "sm"}
                open={Boolean(editingSection)}
                PaperProps={{className: "courier-edit-dialog-paper"}}
                onClose={closeEditDialog}
            >
                <DialogTitle className="courier-edit-dialog-title">
                    <span>{editDialogTitle()}</span>
                    <IconButton aria-label={pl.common.close} disabled={saving} onClick={closeEditDialog}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="courier-edit-dialog-content">
                    {editingSection === "basicData" ? (
                        <div className="courier-edit-dialog-grid courier-edit-dialog-grid-three">
                            <TextField disabled={saving} label={pl.couriers.fields.firstName} value={basicForm.firstName} onChange={(event) => setBasicForm({...basicForm, firstName: event.target.value})} />
                            <TextField disabled={saving} label={pl.couriers.fields.lastName} value={basicForm.lastName} onChange={(event) => setBasicForm({...basicForm, lastName: event.target.value})} />
                            <TextField disabled={saving} label={pl.couriers.fields.telephoneNumber} value={basicForm.telephoneNumber} onChange={(event) => setBasicForm({...basicForm, telephoneNumber: event.target.value})} />
                        </div>
                    ) : undefined}

                    {editingSection === "driverLicense" ? (
                        <div className="courier-edit-dialog-grid courier-edit-dialog-grid-license">
                            <TextField className="courier-edit-dialog-field-wide" disabled={saving} label={pl.couriers.fields.driverLicenseNumber} value={driverLicenseForm.number} onChange={(event) => setDriverLicenseForm({...driverLicenseForm, number: event.target.value})} />
                            <TextField InputLabelProps={{shrink: true}} disabled={saving} label={pl.couriers.fields.acquiredDate} type="date" value={driverLicenseForm.acquiredDate} onChange={(event) => setDriverLicenseForm({...driverLicenseForm, acquiredDate: event.target.value})} />
                            <TextField InputLabelProps={{shrink: true}} disabled={saving} label={pl.couriers.fields.drivingLicenseExpiryDate} type="date" value={driverLicenseForm.drivingLicenseExpiryDate} onChange={(event) => setDriverLicenseForm({...driverLicenseForm, drivingLicenseExpiryDate: event.target.value})} />
                        </div>
                    ) : undefined}

                    {editingSection === "certification" ? (
                        <div className="courier-edit-dialog-stack">
                            <div className="courier-edit-dialog-grid">
                                <TextField disabled={saving} label={pl.couriers.fields.certificateNumber} value={certificationForm.certificateNumber} onChange={(event) => setCertificationForm({...certificationForm, certificateNumber: event.target.value})} />
                                <TextField disabled={saving} label={pl.couriers.fields.authority} value={certificationForm.authority} onChange={(event) => setCertificationForm({...certificationForm, authority: event.target.value})} />
                                <TextField InputLabelProps={{shrink: true}} disabled={saving} label={pl.couriers.fields.issueDate} type="date" value={certificationForm.issueDate} onChange={(event) => setCertificationForm({...certificationForm, issueDate: event.target.value})} />
                                <TextField InputLabelProps={{shrink: true}} disabled={saving} label={pl.couriers.fields.expiryDate} type="date" value={certificationForm.expiryDate} onChange={(event) => setCertificationForm({...certificationForm, expiryDate: event.target.value})} />
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
                        </div>
                    ) : undefined}

                    {editingSection === "status" ? (
                        <TextField
                            select
                            disabled={saving}
                            fullWidth
                            label={pl.couriers.columns.status}
                            value={operationalForm.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                            onChange={(event) => setOperationalForm({...operationalForm, status: event.target.value})}
                        >
                            <MenuItem value="ACTIVE">{pl.couriers.status.ACTIVE}</MenuItem>
                            <MenuItem value="INACTIVE">{pl.couriers.status.INACTIVE}</MenuItem>
                        </TextField>
                    ) : undefined}

                    {editingSection === "device" ? (
                        <TextField
                            disabled={saving || devicesLoading || !deviceOptions.length}
                            fullWidth
                            helperText={!devicesLoading && !deviceOptions.length ? pl.couriers.fields.devicesEmpty : undefined}
                            label={pl.couriers.fields.deviceSelect}
                            select
                            value={operationalForm.deviceId}
                            onChange={(event) => setOperationalForm({...operationalForm, deviceId: event.target.value})}
                        >
                            {devicesLoading ? (
                                <MenuItem disabled value="">{pl.couriers.fields.devicesLoading}</MenuItem>
                            ) : undefined}
                            {deviceOptions.map((device) => (
                                <MenuItem key={device.id} disabled={!device.selectable} value={device.id}>
                                    {device.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    ) : undefined}

                    {editingSection === "vehicle" ? (
                        <TextField
                            disabled={saving || carriersLoading || !vehicleOptions.length}
                            fullWidth
                            helperText={!carriersLoading && !vehicleOptions.length ? pl.couriers.fields.vehiclesEmpty : undefined}
                            label={pl.couriers.fields.vehicleSelect}
                            select
                            value={operationalForm.vehicleId}
                            onChange={(event) => setOperationalForm({...operationalForm, vehicleId: event.target.value})}
                        >
                            {carriersLoading ? (
                                <MenuItem disabled value="">{pl.couriers.fields.vehiclesLoading}</MenuItem>
                            ) : undefined}
                            {vehicleOptions.map((vehicle) => (
                                <MenuItem key={vehicle.id} disabled={!vehicle.selectable} value={vehicle.id}>
                                    {vehicle.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    ) : undefined}

                    {editingSection === "deliveryArea" ? (
                        <div className="courier-edit-dialog-grid">
                            <TextField disabled={saving} label={pl.couriers.fields.deliveryArea} value={operationalForm.areaName} onChange={(event) => setOperationalForm({...operationalForm, areaName: event.target.value})} />
                            <TextField disabled={saving} label={pl.couriers.fields.city} value={operationalForm.city} onChange={(event) => setOperationalForm({...operationalForm, city: event.target.value})} />
                            <TextField disabled={saving} label={pl.couriers.fields.region} value={operationalForm.region} onChange={(event) => setOperationalForm({...operationalForm, region: event.target.value})} />
                            <TextField disabled={saving} label={pl.couriers.fields.district} value={operationalForm.district} onChange={(event) => setOperationalForm({...operationalForm, district: event.target.value})} />
                            <TextField disabled={saving} label={pl.couriers.fields.municipality} value={operationalForm.municipality} onChange={(event) => setOperationalForm({...operationalForm, municipality: event.target.value})} />
                            <TextField disabled={saving} label={pl.couriers.fields.country} value={operationalForm.country} onChange={(event) => setOperationalForm({...operationalForm, country: event.target.value})} />
                            <TextField className="courier-edit-dialog-field-wide" disabled={saving} label={pl.couriers.fields.postalCodes} value={operationalForm.postalCodes} onChange={(event) => setOperationalForm({...operationalForm, postalCodes: event.target.value})} />
                        </div>
                    ) : undefined}

                    {editingSection === "packageTypes" ? (
                        <div className="courier-edit-dialog-stack">
                            <small>{pl.couriers.fields.packageTypesHint}</small>
                            {PACKAGE_TYPES.map((packageType) => (
                                <FormControlLabel
                                    key={packageType}
                                    control={(
                                        <Checkbox
                                            checked={operationalForm.packageTypes.includes(packageType)}
                                            disabled={saving}
                                            onChange={() => togglePackageType(packageType)}
                                        />
                                    )}
                                    label={packageTypeLabel(packageType)}
                                />
                            ))}
                        </div>
                    ) : undefined}
                </DialogContent>
                <DialogActions className="courier-edit-dialog-actions">
                    <Button disabled={saving} variant="outlined" onClick={closeEditDialog}>{pl.couriers.actions.cancelEdit}</Button>
                    <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={saveActiveSection}>
                        {pl.common.saveChanges}
                    </Button>
                </DialogActions>
            </Dialog>
            <CourierConfigurationDialog
                courierName={courier ? `${courier.firstName || ""} ${courier.lastName || ""}`.trim() : undefined}
                open={configurationDialogOpen}
                supplierCode={courier?.supplierCode.value || decodedSupplierCode}
                onClose={() => setConfigurationDialogOpen(false)}
            />
        </main>
    );
};

export default CourierDetails;
