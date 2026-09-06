import React, {ChangeEvent, useEffect, useMemo, useRef, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Snackbar,
    Typography,
} from "components/ui";
import {
    ArrowDropDown,
    ArrowBack,
    Block,
    Close,
    ContentCopy,
    Delete,
    Download,
    Edit,
    InfoOutlined,
    LocalShipping,
    Map,
    MoreVert,
    PersonPinCircle,
    QrCode2,
    Refresh,
    Route,
    Save,
    TableView,
    Print,
} from "components/ui/icons";
import {useNavigate, useParams} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import DocumentService from "../../hooks/DocumentService";
import DepartmentService from "../../hooks/DepartmentService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import Department from "../../class/depots/Department";
import {getBackendErrorMessage} from "../../api/errorMessage";
import RouteLogRecord from "../RouteLog/model/RouteLogRecord";
import {
    departmentCodeValue,
    DangerousGoodApi,
    PersonApi,
    PersonType,
    ShipmentCreateInitialState,
    ShipmentDto,
    shipmentChangeStatuses,
    ShipmentStatusDto,
} from "./dto/ShipmentDto";
import {DefaultShipmentStatusApi} from "../GlobalConfiguration/model/ShipmentConfiguration";
import pl from "../../i18n/translate";
import {valueObjectValue} from "../../utils/valueObject";
import {shipmentEventDescription} from "./shipmentEventDescription";
import "./styles/shipments.css";
import DangerousGoodForm, {
    createEmptyDangerousGood,
    isDangerousGoodValid,
} from "./DangerousGoodForm";
import ShipmentStatusControl from "./ShipmentStatusControl";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

type DocumentAction = "qr" | "excel";
type ShipmentDetailsTab = "overview" | "sender" | "recipient";

type RouteDetail = RouteLogRecord["routeLogRecordDetails"]["routeLogRecordDetailSet"][number];

const draftShipmentStatuses: ShipmentStatusDto[] = ["CREATED", "PREPARED", "ACCEPTED"];

export const getConfiguredDraftShipmentStatus = (
    defaultStatus?: DefaultShipmentStatusApi | null,
): ShipmentStatusDto => (
    draftShipmentStatuses.includes(defaultStatus as ShipmentStatusDto)
        ? defaultStatus as ShipmentStatusDto
        : "CREATED"
);

export const getConfiguredShipmentStatuses = (
    configuredDraftStatus: ShipmentStatusDto,
): ShipmentStatusDto[] => [
    configuredDraftStatus,
    ...shipmentChangeStatuses.filter((shipmentStatus) => !draftShipmentStatuses.includes(shipmentStatus)),
];

const emptyPerson: PersonApi = {
    firstName: "",
    lastName: "",
    email: "",
    telephoneNumber: "",
    city: "",
    postalCode: "",
    street: "",
};

const clonePerson = (person?: PersonApi): PersonApi => ({
    ...emptyPerson,
    ...(person || {}),
});

const fullName = (person?: PersonApi) => {
    const value = `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
    return value || pl.common.dash;
};

const personsEqual = (left?: PersonApi, right?: PersonApi) => {
    const first = clonePerson(left);
    const second = clonePerson(right);

    return first.firstName === second.firstName
        && first.lastName === second.lastName
        && first.email === second.email
        && first.telephoneNumber === second.telephoneNumber
        && first.city === second.city
        && first.postalCode === second.postalCode
        && first.street === second.street;
};

const formatPrice = (shipment?: ShipmentDto | null) => {
    if (!shipment?.price) {
        return pl.common.dash;
    }

    return `${shipment.price.amount.toLocaleString(pl.common.locale)} ${shipment.price.currency}`;
};

const formatDateTime = (date?: string) => {
    if (!date) {
        return pl.common.dash;
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleString(pl.common.locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const cancellationTimeLeft = (createdAt?: string | null, cancellationWindowMinutes = 0, now = Date.now()) => {
    if (!createdAt) {
        return null;
    }
    if (cancellationWindowMinutes <= 0) {
        return 0;
    }

    const createdAtTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtTime)) {
        return null;
    }

    return Math.max(0, createdAtTime + cancellationWindowMinutes * 60_000 - now);
};

const formatCancellationTimeLeft = (timeLeftMs: number | null) => {
    if (timeLeftMs === null) {
        return pl.common.dash;
    }

    if (timeLeftMs <= 0) {
        return pl.shipments.summary.cancellationWindowExpired;
    }

    const totalSeconds = Math.ceil(timeLeftMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, "0")}min ${String(seconds).padStart(2, "0")}s`;
    }

    return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
};

const routeDetails = (routeLog: RouteLogRecord | null): RouteDetail[] => {
    const details = routeLog?.routeLogRecordDetails?.routeLogRecordDetailSet;
    if (!details) {
        return [];
    }

    return [...details].sort((left, right) => {
        const leftTime = new Date(left.timestamp || "").getTime() || 0;
        const rightTime = new Date(right.timestamp || "").getTime() || 0;
        return rightTime - leftTime;
    });
};

const detailStatus = (detail: RouteDetail) => detail.shipmentStatus || detail.parcelStatus || pl.common.dash;

const detailStatusLabel = (status: string) => pl.shipments.status[status as ShipmentStatusDto] || status;

const detailDepartment = (detail: RouteDetail) => valueObjectValue(detail.departmentCode) || valueObjectValue(detail.depotCode) || pl.common.dash;

const detailUser = (detail: RouteDetail) => detail.username || pl.common.dash;

const detailTerminal = (detail: RouteDetail) => detail.terminalId?.value || detail.zebraId || pl.common.dash;

const detailCourier = (detail?: RouteDetail | null) => valueObjectValue(detail?.supplierCode) || detail?.username || pl.shipments.table.unassigned;

const formatBoolean = (value: boolean) => value ? pl.shipments.dangerousGood.yes : pl.shipments.dangerousGood.no;

const detailValue = (label: string, value?: React.ReactNode) => (
    <div className="shipment-detail-value">
        <span>{label}</span>
        <strong>{value || pl.common.dash}</strong>
    </div>
);

const ShipmentDetails: React.FC = () => {
    const navigate = useNavigate();
    const {shipmentId, trackingNumber} = useParams();
    const [shipment, setShipment] = useState<ShipmentDto | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<ShipmentDetailsTab>("overview");
    const [departments, setDepartments] = useState<Department[]>([]);
    const [routeLog, setRouteLog] = useState<RouteLogRecord | null>(null);
    const [status, setStatus] = useState<ShipmentStatusDto>("CREATED");
    const [configuredDraftStatus, setConfiguredDraftStatus] = useState<ShipmentStatusDto>("CREATED");
    const [cancellationWindowMinutes, setCancellationWindowMinutes] = useState<number>(30);
    const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
    const [sender, setSender] = useState<PersonApi>({...emptyPerson});
    const [recipient, setRecipient] = useState<PersonApi>({...emptyPerson});
    const [loadingShipment, setLoadingShipment] = useState<boolean>(true);
    const [loadingRouteLog, setLoadingRouteLog] = useState<boolean>(false);
    const [cancelingShipment, setCancelingShipment] = useState<boolean>(false);
    const [savingStatus, setSavingStatus] = useState<boolean>(false);
    const [savingPersonType, setSavingPersonType] = useState<PersonType | null>(null);
    const [personDialogType, setPersonDialogType] = useState<PersonType | null>(null);
    const [personDraft, setPersonDraft] = useState<PersonApi>({...emptyPerson});
    const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
    const [cancelShipmentDialogOpen, setCancelShipmentDialogOpen] = useState<boolean>(false);
    const [dangerousGoodDialogOpen, setDangerousGoodDialogOpen] = useState<boolean>(false);
    const [dangerousGoodDeleteDialogOpen, setDangerousGoodDeleteDialogOpen] = useState<boolean>(false);
    const [dangerousGoodDraft, setDangerousGoodDraft] = useState<DangerousGoodApi>(createEmptyDangerousGood());
    const [savingDangerousGood, setSavingDangerousGood] = useState<boolean>(false);
    const [downloadingDocument, setDownloadingDocument] = useState<DocumentAction | null>(null);
    const [operationMenuAnchor, setOperationMenuAnchor] = useState<HTMLElement | null>(null);
    const [qrMenuAnchor, setQrMenuAnchor] = useState<HTMLElement | null>(null);
    const [destinationInfoAnchor, setDestinationInfoAnchor] = useState<HTMLElement | null>(null);
    const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const qrPreviewRef = useRef<HTMLIFrameElement | null>(null);

    const validShipmentId = Boolean(shipmentId && /^\d+$/.test(shipmentId) && !/^0+$/.test(shipmentId));
    const decodedTrackingNumber = trackingNumber ? decodeURIComponent(trackingNumber) : "";
    const personDialogSource = personDialogType === "SENDER" ? shipment?.sender : shipment?.recipient;
    const personDialogChanged = personDialogType ? !personsEqual(personDialogSource, personDraft) : false;
    const shipmentDataMutable = Boolean(
        shipment
        && !shipment.locked
        && !["SENT", "DELIVERY", "RETURN"].includes(shipment.shipmentStatus)
    );
    const shipmentStatusMutable = Boolean(shipment && !["DELIVERY", "CANCELED"].includes(shipment.shipmentStatus));
    const dangerousGoodMutable = shipmentDataMutable;

    const details = useMemo(() => routeDetails(routeLog), [routeLog]);
    const availableShipmentStatuses = useMemo(
        () => getConfiguredShipmentStatuses(configuredDraftStatus),
        [configuredDraftStatus],
    );
    const currentCourierDetail = details.find((detail) => detail.supplierCode || detail.username) || null;
    const destinationDepartment = useMemo(() => {
        const destinationCode = shipment ? departmentCodeValue(shipment.destination) : "";
        return departments.find((department) => department.departmentCode?.value === destinationCode) || null;
    }, [departments, shipment]);
    const originDepartment = useMemo(() => {
        const originDepartmentId = shipment?.originDepartmentId?.value;
        if (originDepartmentId === undefined || originDepartmentId === null) {
            return null;
        }

        return departments.find((department) => department.departmentId === originDepartmentId) || null;
    }, [departments, shipment]);
    const cancellationWindowTimeLeft = useMemo(
        () => cancellationTimeLeft(shipment?.createdAt, cancellationWindowMinutes, currentTime),
        [cancellationWindowMinutes, currentTime, shipment?.createdAt],
    );
    const shipmentCanBeCanceled = Boolean(
        shipment
        && !shipment.locked
        && draftShipmentStatuses.includes(shipment.shipmentStatus)
        && cancellationWindowTimeLeft !== null
        && cancellationWindowTimeLeft > 0
    );
    const showCancellationWindow = Boolean(
        shipment
        && draftShipmentStatuses.includes(shipment.shipmentStatus)
    );
    const historyPath = decodedTrackingNumber
        ? `/shipments/tracking/${encodeURIComponent(decodedTrackingNumber)}/history`
        : `/shipments/${shipmentId || shipment?.shipmentId.value || ""}/history`;

    const showError = (error: unknown, fallback = pl.shipments.messages.operationFailed) => {
        setNotice({
            severity: "error",
            message: getBackendErrorMessage(error, fallback),
        });
    };

    useEffect(() => () => {
        if (qrPreviewUrl) {
            URL.revokeObjectURL(qrPreviewUrl);
        }
    }, [qrPreviewUrl]);

    const downloadDocument = async (documentType: DocumentAction) => {
        if (!shipment) {
            return;
        }

        setDownloadingDocument(documentType);
        try {
            if (documentType === "qr") {
                await DocumentService.downloadQrLabel(shipment.shipmentId.value);
            } else {
                await DocumentService.exportToExcel(shipment.shipmentId.value);
            }
            setNotice({severity: "success", message: pl.shipments.messages.documentDownloadSuccess});
        } catch (error) {
            showError(error, documentType === "qr"
                ? pl.shipments.messages.qrCodeDownloadError
                : pl.shipments.messages.excelExportError);
        } finally {
            setDownloadingDocument(null);
        }
    };

    const openQrPrintPreview = async () => {
        if (!shipment) {
            return;
        }

        setQrMenuAnchor(null);
        setDownloadingDocument("qr");
        try {
            const label = await DocumentService.getQrLabel(shipment.shipmentId.value);
            setQrPreviewUrl(URL.createObjectURL(label.blob));
        } catch (error) {
            showError(error, pl.shipments.messages.qrCodeDownloadError);
        } finally {
            setDownloadingDocument(null);
        }
    };

    const closeQrPreview = () => setQrPreviewUrl(null);

    const selectDetailTab = (tab: ShipmentDetailsTab) => {
        setActiveDetailTab(tab);
        window.requestAnimationFrame(() => {
            document.getElementById(tab === "overview" ? "shipment-overview" : `shipment-${tab}`)
                ?.scrollIntoView({behavior: "smooth", block: "start"});
        });
    };

    const printQrLabel = () => {
        qrPreviewRef.current?.contentWindow?.focus();
        qrPreviewRef.current?.contentWindow?.print();
    };

    const applyShipment = (data: ShipmentDto) => {
        setShipment(data);
        setStatus(data.shipmentStatus);
        setSender(clonePerson(data.sender));
        setRecipient(clonePerson(data.recipient));
        setPersonDialogType(null);
        setPersonDraft({...emptyPerson});
    };

    const loadShipment = async () => {
        if (!decodedTrackingNumber && !validShipmentId) {
            setLoadingShipment(false);
            setNotice({severity: "error", message: pl.shipments.messages.invalidTrackingNumber});
            return;
        }

        setLoadingShipment(true);
        setLoadingRouteLog(true);
        try {
            const response = decodedTrackingNumber
                ? await ShipmentService.getControlCenterByTrackingNumber(decodedTrackingNumber)
                : await ShipmentService.getControlCenter(shipmentId || "");
            applyShipment(response.data.shipment);
            setRouteLog(response.data.routeLog);
        } catch (error) {
            showError(error, pl.shipments.messages.loadError);
        } finally {
            setLoadingShipment(false);
            setLoadingRouteLog(false);
        }
    };

    useEffect(() => {
        loadShipment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentId, trackingNumber]);

    useEffect(() => {
        DepartmentService.getAll()
            .then((response) => setDepartments(Array.isArray(response.data) ? response.data : []))
            .catch(() => setDepartments([]));
    }, []);

    useEffect(() => {
        let active = true;

        OperatorConfigurationService.getCurrentShipmentConfiguration()
            .then((response) => {
                if (active) {
                    const workflowConfiguration = response.data?.workflowConfiguration;
                    setConfiguredDraftStatus(getConfiguredDraftShipmentStatus(
                        workflowConfiguration?.defaultStatus,
                    ));
                    setCancellationWindowMinutes(workflowConfiguration?.cancellationWindowMinutes ?? 30);
                }
            })
            .catch(() => {
                if (active) {
                    setConfiguredDraftStatus("CREATED");
                    setCancellationWindowMinutes(30);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        setCurrentTime(Date.now());
        const interval = window.setInterval(() => setCurrentTime(Date.now()), 1000);

        return () => window.clearInterval(interval);
    }, [shipment?.createdAt, cancellationWindowMinutes]);

    useEffect(() => {
        if (statusDialogOpen) {
            setStatus((currentStatus) => (
                availableShipmentStatuses.includes(currentStatus)
                    ? currentStatus
                    : configuredDraftStatus
            ));
        }
    }, [availableShipmentStatuses, configuredDraftStatus, statusDialogOpen]);

    const updatePersonDraftField = (
        field: keyof PersonApi,
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const value = event.target.value;
        setPersonDraft((current) => ({...current, [field]: value}));
    };

    const openStatusDialog = () => {
        if (!shipment || !shipmentStatusMutable) {
            return;
        }

        setStatus(availableShipmentStatuses.includes(shipment.shipmentStatus)
            ? shipment.shipmentStatus
            : configuredDraftStatus);
        setStatusDialogOpen(true);
    };

    const closeStatusDialog = () => {
        if (!savingStatus) {
            setStatusDialogOpen(false);
        }
    };

    const saveShipmentStatus = async () => {
        if (!shipment || !shipmentStatusMutable) {
            return;
        }

        setSavingStatus(true);
        try {
            await ShipmentService.updateStatus({
                shipmentId: shipment.shipmentId,
                shipmentStatus: status,
            });

            const response = shipment.trackingNumber?.value
                ? await ShipmentService.getControlCenterByTrackingNumber(shipment.trackingNumber.value)
                : await ShipmentService.getControlCenter(shipment.shipmentId.value);
            applyShipment(response.data.shipment);
            setRouteLog(response.data.routeLog);
            setStatusDialogOpen(false);
            setNotice({severity: "success", message: pl.shipments.messages.statusSaveSuccess});
        } catch (error) {
            showError(error, pl.shipments.messages.statusSaveError);
        } finally {
            setSavingStatus(false);
        }
    };

    const openCancelShipmentDialog = () => {
        setOperationMenuAnchor(null);
        if (shipmentCanBeCanceled) {
            setCancelShipmentDialogOpen(true);
        }
    };

    const closeCancelShipmentDialog = () => {
        if (!cancelingShipment) {
            setCancelShipmentDialogOpen(false);
        }
    };

    const cancelShipment = async () => {
        if (!shipment || !shipmentCanBeCanceled) {
            setCancelShipmentDialogOpen(false);
            return;
        }

        setCancelingShipment(true);
        try {
            await ShipmentService.cancel(shipment.shipmentId.value);
            await loadShipment();
            setCancelShipmentDialogOpen(false);
            setNotice({severity: "success", message: pl.shipments.messages.cancelSuccess});
        } catch (error) {
            showError(error, pl.shipments.messages.cancelError);
        } finally {
            setCancelingShipment(false);
        }
    };

    const createSimilarShipment = () => {
        if (!shipment) {
            setOperationMenuAnchor(null);
            return;
        }

        const similarShipment: ShipmentCreateInitialState = {
            sender: clonePerson(shipment.sender),
            recipient: clonePerson(shipment.recipient),
            shipmentSize: shipment.shipmentSize,
            shipmentPriority: shipment.shipmentPriority,
            priceAmount: String(shipment.price?.amount ?? ""),
            currency: shipment.price?.currency || "PLN",
            issuerCountryCode: shipment.originCountry || "PL",
            receiverCountryCode: shipment.destinationCountry || "DE",
            dangerousGood: shipment.dangerousGood ? {...shipment.dangerousGood} : null,
        };

        setOperationMenuAnchor(null);
        navigate("/shipments/create", {state: {similarShipment}});
    };

    const openDangerousGoodDialog = () => {
        if (!dangerousGoodMutable) {
            return;
        }
        setDangerousGoodDraft(shipment?.dangerousGood
            ? {...shipment.dangerousGood}
            : createEmptyDangerousGood());
        setDangerousGoodDialogOpen(true);
    };

    const saveDangerousGood = async (replace: boolean) => {
        if (!shipment || !dangerousGoodMutable) {
            return;
        }
        if (!isDangerousGoodValid(dangerousGoodDraft)) {
            setNotice({severity: "error", message: pl.shipments.dangerousGood.invalid});
            return;
        }
        setSavingDangerousGood(true);
        try {
            const current = shipment.dangerousGood;
            const patch = current
                ? Object.fromEntries(
                    (Object.keys(dangerousGoodDraft) as Array<keyof DangerousGoodApi>)
                        .filter((field) => dangerousGoodDraft[field] !== current[field])
                        .map((field) => [field, dangerousGoodDraft[field]])
                ) as Partial<DangerousGoodApi>
                : dangerousGoodDraft;
            const response = current && !replace
                ? await ShipmentService.patchDangerousGood(shipment.shipmentId.value, patch)
                : await ShipmentService.putDangerousGood(shipment.shipmentId.value, dangerousGoodDraft);
            setShipment({...shipment, dangerousGood: response.data});
            setDangerousGoodDialogOpen(false);
            setNotice({severity: "success", message: pl.shipments.messages.dangerousGoodSaveSuccess});
        } catch (error) {
            showError(error, pl.shipments.messages.dangerousGoodSaveError);
        } finally {
            setSavingDangerousGood(false);
        }
    };

    const deleteDangerousGood = async () => {
        if (!shipment || !dangerousGoodMutable) {
            return;
        }
        setSavingDangerousGood(true);
        try {
            await ShipmentService.deleteDangerousGood(shipment.shipmentId.value);
            setShipment({...shipment, dangerousGood: null});
            setDangerousGoodDeleteDialogOpen(false);
            setNotice({severity: "success", message: pl.shipments.messages.dangerousGoodDeleteSuccess});
        } catch (error) {
            showError(error, pl.shipments.messages.dangerousGoodDeleteError);
        } finally {
            setSavingDangerousGood(false);
        }
    };

    const savePerson = async () => {
        const personType = personDialogType;
        if (!shipment || !personType || !shipmentDataMutable) {
            return;
        }

        setSavingPersonType(personType);
        try {
            if (personType === "SENDER") {
                await ShipmentService.updateSender(shipment.shipmentId.value, personDraft);
            } else {
                await ShipmentService.updateRecipient(shipment.shipmentId.value, personDraft);
            }

            const response = shipment.trackingNumber?.value
                ? await ShipmentService.getControlCenterByTrackingNumber(shipment.trackingNumber.value)
                : await ShipmentService.getControlCenter(shipment.shipmentId.value);
            applyShipment(response.data.shipment);
            setRouteLog(response.data.routeLog);
            setNotice({
                severity: "success",
                message: personType === "SENDER"
                    ? pl.shipments.messages.senderSaveSuccess
                    : pl.shipments.messages.recipientSaveSuccess,
            });
        } catch (error) {
            showError(error, personType === "SENDER"
                ? pl.shipments.messages.senderSaveError
                : pl.shipments.messages.recipientSaveError);
        } finally {
            setSavingPersonType(null);
        }
    };

    const openPersonDialog = (personType: PersonType) => {
        if (!shipmentDataMutable) {
            return;
        }
        setPersonDraft(clonePerson(personType === "SENDER" ? shipment?.sender : shipment?.recipient));
        setPersonDialogType(personType);
    };

    const closePersonDialog = () => {
        if (savingPersonType) {
            return;
        }
        setPersonDialogType(null);
        setPersonDraft({...emptyPerson});
    };

    const personFields = (title: string, personType: PersonType, person: PersonApi) => (
        <section
            className={`shipment-edit-section shipment-details-segment shipment-details-person-${personType.toLowerCase()}`}
            id={`shipment-${personType.toLowerCase()}`}
        >
            <div className="shipment-edit-section-header">
                <Typography variant="h6">{title}</Typography>
                <div className="shipment-edit-section-actions">
                    <Button
                        className="shipment-edit-section-action"
                        disabled={loadingShipment || !shipmentDataMutable || savingPersonType !== null}
                        onClick={() => openPersonDialog(personType)}
                        size="small"
                        startIcon={<Edit />}
                        variant="outlined"
                    >
                        {personType === "SENDER"
                            ? pl.shipments.form.actions.editSender
                            : pl.shipments.form.actions.editRecipient}
                    </Button>
                </div>
            </div>
            <div className="shipment-details-grid">
                {detailValue(pl.shipments.form.fields.firstName, person.firstName)}
                {detailValue(pl.shipments.form.fields.lastName, person.lastName)}
                {detailValue(pl.shipments.form.fields.email, person.email)}
                {detailValue(pl.shipments.form.fields.phone, person.telephoneNumber)}
                {detailValue(pl.shipments.form.fields.city, person.city)}
                {detailValue(pl.shipments.form.fields.postalCode, person.postalCode)}
                <div className="shipment-detail-value shipment-details-wide">
                    <span>{pl.shipments.form.fields.street}</span>
                    <strong>{person.street || pl.common.dash}</strong>
                </div>
            </div>
        </section>
    );

    const renderDangerousGood = () => {
        const dangerousGood = shipment?.dangerousGood;
        const optionalDetails = dangerousGood ? [
            [pl.shipments.form.fields.hazardDivision, dangerousGood.hazardDivision],
            [pl.shipments.form.fields.subsidiaryRisk, dangerousGood.subsidiaryRisk],
            [pl.shipments.form.fields.packingGroup, dangerousGood.packingGroup],
            [pl.shipments.form.fields.transportCategory, dangerousGood.transportCategory],
            [pl.shipments.form.fields.tunnelRestrictionCode, dangerousGood.tunnelRestrictionCode],
            [pl.shipments.form.fields.flashPoint, dangerousGood.flashPoint],
            [pl.shipments.form.fields.emergencyContact, dangerousGood.emergencyContact],
            [pl.shipments.form.fields.emergencyContact24h, dangerousGood.emergencyContact24h],
            [pl.shipments.form.fields.safetyDataSheetReference, dangerousGood.safetyDataSheetReference],
            [pl.shipments.form.fields.declarationDocumentReference, dangerousGood.declarationDocumentReference],
            [pl.shipments.form.fields.hazardSymbols, dangerousGood.hazardSymbols],
            [pl.shipments.form.fields.countryOfOrigin, dangerousGood.countryOfOrigin],
        ].filter(([, value]) => value !== null && value !== undefined && value !== "") : [];

        return (
            <section className="shipment-edit-section shipment-details-segment shipment-details-dangerous-good">
                <div className="shipment-edit-section-header">
                    <Typography variant="h6">{pl.shipments.form.sections.dangerousGood}</Typography>
                    <div>
                        <Chip
                            className={dangerousGood ? "shipment-dangerous-chip-active" : "shipment-dangerous-chip-empty"}
                            label={dangerousGood ? pl.shipments.dangerousGood.active : pl.shipments.dangerousGood.emptyStatus}
                            size="small"
                        />
                        <Button
                            disabled={!dangerousGoodMutable}
                            size="small"
                            startIcon={<Edit />}
                            onClick={openDangerousGoodDialog}
                        >
                            {dangerousGood ? pl.common.edit : pl.common.add}
                        </Button>
                        {dangerousGood ? (
                            <Button
                                color="error"
                                disabled={!dangerousGoodMutable}
                                size="small"
                                startIcon={<Delete />}
                                onClick={() => setDangerousGoodDeleteDialogOpen(true)}
                            >
                                {pl.common.delete}
                            </Button>
                        ) : null}
                    </div>
                </div>

                {dangerousGood ? (
                    <>
                        <div className="shipment-dangerous-good-grid">
                            <div>
                                <span>{pl.shipments.form.fields.unNumber}</span>
                                <strong>{dangerousGood.unNumber}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.properShippingName}</span>
                                <strong>{dangerousGood.properShippingName}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.hazardClass}</span>
                                <strong>{dangerousGood.hazardClass}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.quantity}</span>
                                <strong>{`${dangerousGood.quantity} ${dangerousGood.quantityUnit}`}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.packageCount}</span>
                                <strong>{dangerousGood.packageCount}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.packagingType}</span>
                                <strong>{dangerousGood.packagingType}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.regulationType}</span>
                                <strong>{dangerousGood.regulationType}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.transportMode}</span>
                                <strong>{dangerousGood.transportMode}</strong>
                            </div>
                            {optionalDetails.map(([label, value]) => (
                                <div key={String(label)}>
                                    <span>{label}</span>
                                    <strong>{String(value)}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="shipment-dangerous-good-flags">
                            <Chip label={`${pl.shipments.form.fields.limitedQuantity}: ${formatBoolean(dangerousGood.limitedQuantity)}`} size="small" />
                            <Chip label={`${pl.shipments.form.fields.exceptedQuantity}: ${formatBoolean(dangerousGood.exceptedQuantity)}`} size="small" />
                            <Chip label={`${pl.shipments.form.fields.environmentallyHazardous}: ${formatBoolean(dangerousGood.environmentallyHazardous)}`} size="small" />
                            <Chip label={`${pl.shipments.form.fields.marinePollutant}: ${formatBoolean(dangerousGood.marinePollutant)}`} size="small" />
                            <Chip label={`${pl.shipments.form.fields.flammable}: ${formatBoolean(dangerousGood.flammable)}`} size="small" />
                            <Chip label={`${pl.shipments.form.fields.corrosive}: ${formatBoolean(dangerousGood.corrosive)}`} size="small" />
                            <Chip label={`${pl.shipments.form.fields.toxic}: ${formatBoolean(dangerousGood.toxic)}`} size="small" />
                        </div>

                        {dangerousGood.description || dangerousGood.storageRequirements || dangerousGood.handlingInstructions ? (
                            <div className="shipment-dangerous-good-notes">
                            {dangerousGood.description ? <div>
                                <span>{pl.shipments.form.fields.description}</span>
                                <p>{dangerousGood.description}</p>
                            </div> : null}
                            {dangerousGood.storageRequirements ? <div>
                                <span>{pl.shipments.form.fields.storageRequirements}</span>
                                <p>{dangerousGood.storageRequirements}</p>
                            </div> : null}
                            {dangerousGood.handlingInstructions ? <div>
                                <span>{pl.shipments.form.fields.handlingInstructions}</span>
                                <p>{dangerousGood.handlingInstructions}</p>
                            </div> : null}
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="shipment-dangerous-good-empty">
                        {pl.shipments.dangerousGood.empty}
                    </div>
                )}
            </section>
        );
    };

    const renderRouteHistory = () => {
        if (loadingRouteLog) {
            return (
                <div className="shipment-cc-side-empty">
                    <CircularProgress size={24} />
                    <span>{pl.shipments.routeHistory.loading}</span>
                </div>
            );
        }

        if (!details.length) {
            return (
                <div className="shipment-cc-side-empty">
                    <Route fontSize="small" />
                    <span>{pl.shipments.routeHistory.empty}</span>
                </div>
            );
        }

        return (
            <div className="shipment-cc-timeline">
                {details.map((detail) => {
                    const statusKey = detailStatus(detail);

                    return (
                        <article className="shipment-cc-timeline-item" key={`${detail.id}-${detail.processType}`}>
                            <div className="shipment-cc-timeline-dot" />
                            <div>
                                <div className="shipment-cc-timeline-top">
                                    <strong>{detail.processType || pl.shipments.routeHistory.defaultOperation}</strong>
                                    <span>{formatDateTime(detail.timestamp)}</span>
                                </div>
                                <Chip className={`tm-status tm-status-${String(statusKey).toLowerCase()}`} label={detailStatusLabel(statusKey)} size="small" />
                                <p>{shipmentEventDescription(detail.description)}</p>
                                <dl>
                                    <div><dt>{pl.shipments.routeHistory.department}</dt><dd>{detailDepartment(detail)}</dd></div>
                                    <div><dt>{pl.shipments.routeHistory.user}</dt><dd>{detailUser(detail)}</dd></div>
                                    <div><dt>{pl.shipments.routeHistory.terminal}</dt><dd>{detailTerminal(detail)}</dd></div>
                                </dl>
                            </div>
                        </article>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="shipments-page shipment-cc-page">
            <div className="shipments-shell shipment-cc-shell">
                <div className="shipments-header">
                    <div className="shipments-title">
                        <span className="shipments-title-icon"><LocalShipping /></span>
                        <Box>
                            <Typography variant="h4">{pl.shipments.page.detailsTitle}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {shipment
                                    ? `${shipment.trackingNumber?.value || pl.common.dash} · ${fullName(shipment.sender)} → ${fullName(shipment.recipient)}`
                                    : pl.shipments.page.detailsSubtitle}
                            </Typography>
                        </Box>
                    </div>
                    <div className="shipment-edit-header-actions">
                        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate("/shipments/list")}>
                            {pl.navigation.shipmentList}
                        </Button>
                        <Button disabled={loadingShipment} startIcon={<Refresh />} variant="outlined" onClick={loadShipment}>
                            {pl.common.refresh}
                        </Button>
                        <Button
                            disabled={loadingShipment || Boolean(downloadingDocument) || !shipment}
                            startIcon={downloadingDocument === "qr" ? <CircularProgress size={18} /> : <QrCode2 />}
                            endIcon={<ArrowDropDown />}
                            variant="outlined"
                            onClick={(event) => setQrMenuAnchor(event.currentTarget)}
                        >
                            {pl.shipments.actions.qrLabel}
                        </Button>
                        <Menu
                            anchorEl={qrMenuAnchor}
                            open={Boolean(qrMenuAnchor)}
                            onClose={() => setQrMenuAnchor(null)}
                        >
                            <MenuItem className="shipment-document-menu-item" onClick={() => {
                                setQrMenuAnchor(null);
                                downloadDocument("qr");
                            }}>
                                <Download fontSize="small" />
                                {pl.shipments.actions.downloadLabel}
                            </MenuItem>
                            <MenuItem className="shipment-document-menu-item" onClick={openQrPrintPreview}>
                                <Print fontSize="small" />
                                {pl.shipments.actions.printLabel}
                            </MenuItem>
                        </Menu>
                        <Button
                            disabled={loadingShipment || Boolean(downloadingDocument) || !shipment}
                            startIcon={downloadingDocument === "excel" ? <CircularProgress size={18} /> : <TableView />}
                            variant="outlined"
                            onClick={() => downloadDocument("excel")}
                        >
                            {pl.shipments.actions.exportToExcel}
                        </Button>
                        <Button
                            disabled={loadingShipment || cancelingShipment || !shipment}
                            startIcon={<MoreVert />}
                            endIcon={<ArrowDropDown />}
                            variant="outlined"
                            onClick={(event) => setOperationMenuAnchor(event.currentTarget)}
                        >
                            {pl.shipments.actions.operations}
                        </Button>
                        <Menu
                            anchorEl={operationMenuAnchor}
                            open={Boolean(operationMenuAnchor)}
                            onClose={() => setOperationMenuAnchor(null)}
                        >
                            <MenuItem className="shipment-document-menu-item" disabled={!shipment} onClick={createSimilarShipment}>
                                <ContentCopy fontSize="small" />
                                {pl.shipments.actions.createSimilar}
                            </MenuItem>
                            <MenuItem
                                className="shipment-document-menu-item"
                                disabled={!shipmentCanBeCanceled || cancelingShipment}
                                onClick={openCancelShipmentDialog}
                            >
                                {cancelingShipment ? <CircularProgress size={18} /> : <Block fontSize="small" />}
                                {pl.shipments.actions.cancelShipment}
                            </MenuItem>
                        </Menu>
                    </div>
                </div>

                <nav className="shipment-detail-tabs" aria-label={pl.shipments.page.detailsTitle}>
                    <button
                        className={activeDetailTab === "overview" ? "shipment-detail-tab-active" : ""}
                        type="button"
                        onClick={() => selectDetailTab("overview")}
                    >
                        {pl.shipments.detailTabs.overview}
                    </button>
                    <button
                        className={activeDetailTab === "sender" ? "shipment-detail-tab-active" : ""}
                        type="button"
                        onClick={() => selectDetailTab("sender")}
                    >
                        {pl.shipments.detailTabs.sender}
                    </button>
                    <button
                        className={activeDetailTab === "recipient" ? "shipment-detail-tab-active" : ""}
                        type="button"
                        onClick={() => selectDetailTab("recipient")}
                    >
                        {pl.shipments.detailTabs.recipient}
                    </button>
                    <a href="#shipment-history">{pl.shipments.detailTabs.history}</a>
                </nav>

                {loadingShipment ? (
                    <div className="shipments-panel shipment-edit-loader">
                        <CircularProgress size={30} />
                        <span>{pl.shipments.page.editLoadingSubtitle}</span>
                    </div>
                ) : shipment ? (
                    <div className="shipment-cc-layout">
                        <main className="shipments-panel shipment-edit-panel">
                            {activeDetailTab === "overview" ? (
                                <>
                                    <section id="shipment-overview" className="shipment-edit-section shipment-details-segment shipment-details-info-segment">
                                <div className="shipment-edit-section-header">
                                    <Typography variant="h6">{pl.shipments.form.sections.shipmentData}</Typography>
                                    <Chip className={`tm-status tm-status-${shipment.shipmentStatus.toLowerCase()}`} label={pl.shipments.status[shipment.shipmentStatus]} size="small" />
                                </div>

                                <div className={`shipment-details-summary shipment-edit-summary shipment-details-summary-with-origin${showCancellationWindow ? " shipment-details-summary-with-cancellation" : ""}`}>
                                    <div>
                                        <span>{pl.shipments.summary.tracking}</span>
                                        <strong>{shipment.trackingNumber?.value || pl.common.dash}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.id}</span>
                                        <strong>#{shipment.shipmentId.value}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.type}</span>
                                        <strong>{pl.shipments.type[shipment.shipmentType]}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.relatedShipment}</span>
                                        <strong>{shipment.shipmentRelatedId?.value ? `#${shipment.shipmentRelatedId.value}` : pl.common.dash}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.size}</span>
                                        <strong>{pl.shipments.size[shipment.shipmentSize]}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.originDepartment}</span>
                                        <strong>{originDepartment?.departmentCode?.value || pl.common.dash}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.destination}</span>
                                        <div className="shipment-destination-control">
                                            <strong className="shipment-destination-value">
                                                {departmentCodeValue(shipment.destination) || pl.common.dash}
                                            </strong>
                                            <IconButton
                                                aria-expanded={Boolean(destinationInfoAnchor)}
                                                aria-haspopup="dialog"
                                                aria-label={pl.shipments.summary.showDepartmentDetails}
                                                className="shipment-destination-info-button"
                                                size="small"
                                                onClick={(event) => setDestinationInfoAnchor((currentAnchor) => (
                                                    currentAnchor ? null : event.currentTarget
                                                ))}
                                            >
                                                <InfoOutlined fontSize="small" />
                                            </IconButton>
                                            <Menu
                                                anchorEl={destinationInfoAnchor}
                                                aria-label={pl.shipments.summary.departmentDetailsTitle}
                                                className="shipment-department-popover"
                                                open={Boolean(destinationInfoAnchor)}
                                                role="dialog"
                                                onClose={() => setDestinationInfoAnchor(null)}
                                            >
                                                <div className="shipment-department-popover-header">
                                                    <InfoOutlined fontSize="small" />
                                                    <strong>{pl.shipments.summary.departmentDetailsTitle}</strong>
                                                </div>
                                                {destinationDepartment ? (
                                                    <dl className="shipment-department-popover-details">
                                                        <div>
                                                            <dt>{pl.shipments.form.fields.city}</dt>
                                                            <dd>{destinationDepartment.address.city || pl.common.dash}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>{pl.shipments.form.fields.street}</dt>
                                                            <dd>{destinationDepartment.address.street || pl.common.dash}</dd>
                                                        </div>
                                                    </dl>
                                                ) : (
                                                    <p className="shipment-department-popover-empty">
                                                        {pl.shipments.summary.departmentDetailsUnavailable}
                                                    </p>
                                                )}
                                            </Menu>
                                        </div>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.price}</span>
                                        <strong>{formatPrice(shipment)}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.status}</span>
                                        <strong>{pl.shipments.status[shipment.shipmentStatus]}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.createdAt}</span>
                                        <strong>{formatDateTime(shipment.createdAt || undefined)}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.updatedAt}</span>
                                        <strong>{formatDateTime(shipment.updatedAt || undefined)}</strong>
                                    </div>
                                    {showCancellationWindow ? (
                                        <div>
                                            <span>{pl.shipments.summary.cancellationWindow}</span>
                                            <strong className="shipment-cancellation-window-value">
                                                {formatCancellationTimeLeft(cancellationWindowTimeLeft)}
                                            </strong>
                                        </div>
                                    ) : null}
                                </div>

                                    </section>

                                    <div className="shipment-details-operations-grid shipment-details-operations-separated">
                                        <ShipmentStatusControl
                                            disabled={savingStatus || !shipmentStatusMutable}
                                            status={shipment.shipmentStatus}
                                            onChangeStatus={openStatusDialog}
                                        />

                                    </div>

                                    <section className="shipment-cc-courier shipment-details-segment">
                                <div className="shipment-cc-courier-icon">
                                    <PersonPinCircle />
                                </div>
                                <div className="shipment-cc-courier-copy">
                                    <span>{pl.shipments.summary.currentCourier}</span>
                                    <strong>{detailCourier(currentCourierDetail)}</strong>
                                    <p>
                                        {currentCourierDetail
                                            ? pl.shipments.summary.lastActivity
                                                .replace("{date}", formatDateTime(currentCourierDetail.timestamp))
                                                .replace("{department}", detailDepartment(currentCourierDetail))
                                            : pl.shipments.summary.noCourierInfo}
                                    </p>
                                    {currentCourierDetail ? (
                                        <dl className="shipment-cc-courier-meta">
                                            <div>
                                                <dt>{pl.shipments.summary.courierCode}</dt>
                                                <dd>{detailCourier(currentCourierDetail)}</dd>
                                            </div>
                                            <div>
                                                <dt>{pl.shipments.routeHistory.department}</dt>
                                                <dd>{detailDepartment(currentCourierDetail)}</dd>
                                            </div>
                                            <div>
                                                <dt>{pl.shipments.routeHistory.user}</dt>
                                                <dd>{detailUser(currentCourierDetail)}</dd>
                                            </div>
                                            <div>
                                                <dt>{pl.shipments.routeHistory.terminal}</dt>
                                                <dd>{detailTerminal(currentCourierDetail)}</dd>
                                            </div>
                                            <div>
                                                <dt>{pl.shipments.summary.lastOperation}</dt>
                                                <dd>{detailStatusLabel(detailStatus(currentCourierDetail))}</dd>
                                            </div>
                                        </dl>
                                    ) : null}
                                </div>
                                    </section>

                                    {renderDangerousGood()}
                                </>
                            ) : null}
                            {activeDetailTab === "sender"
                                ? personFields(pl.shipments.form.sections.sender, "SENDER", sender)
                                : null}
                            {activeDetailTab === "recipient"
                                ? personFields(pl.shipments.form.sections.receiver, "RECIPIENT", recipient)
                                : null}
                        </main>

                        <aside className="shipments-panel shipment-cc-side" id="shipment-history">
                            <div className="shipment-cc-side-header">
                                <div>
                                    <Typography variant="h6">{pl.shipments.routeHistory.title}</Typography>
                                    <span>{details.length} {pl.shipments.postCount}</span>
                                </div>
                                <Button
                                    disabled={!shipment}
                                    size="small"
                                    startIcon={<Map fontSize="small" />}
                                    variant="outlined"
                                    onClick={() => navigate(historyPath)}
                                >
                                    {pl.shipments.routeHistory.openDetails}
                                </Button>
                            </div>
                            {renderRouteHistory()}
                        </aside>
                    </div>
                ) : (
                    <Alert severity="error">{pl.shipments.messages.loadViewError}</Alert>
                )}
            </div>

            <Dialog
                fullWidth
                maxWidth="md"
                open={Boolean(qrPreviewUrl)}
                onClose={closeQrPreview}
            >
                <DialogTitle>{pl.shipments.qrLabel.previewTitle}</DialogTitle>
                <DialogContent className="shipment-qr-preview-content">
                    {qrPreviewUrl ? (
                        <iframe
                            className="shipment-qr-preview-frame"
                            ref={qrPreviewRef}
                            src={qrPreviewUrl}
                            title={pl.shipments.qrLabel.previewTitle}
                        />
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeQrPreview}>{pl.common.close}</Button>
                    <Button startIcon={<Print />} variant="contained" onClick={printQrLabel}>
                        {pl.shipments.actions.printLabel}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="shipment-status-dialog"
                fullWidth
                maxWidth="xs"
                open={statusDialogOpen}
                onClose={closeStatusDialog}
            >
                <DialogTitle className="shipment-status-dialog-title">
                    <span className="shipment-status-dialog-icon"><Route /></span>
                    <span>
                        <small>{pl.shipments.form.fields.shipmentStatus}</small>
                        <strong>{pl.shipments.statusDialog.title}</strong>
                    </span>
                </DialogTitle>
                <DialogContent className="shipment-status-dialog-content">
                    <label className="shipment-status-dialog-field">
                        <span>{pl.shipments.form.fields.shipmentStatus}</span>
                        <select
                            autoFocus
                            disabled={!shipmentStatusMutable || savingStatus}
                            value={status}
                            onChange={(event) => setStatus(event.target.value as ShipmentStatusDto)}
                        >
                            {availableShipmentStatuses.map((shipmentStatus) => (
                                <option key={shipmentStatus} value={shipmentStatus}>
                                    {pl.shipments.status[shipmentStatus]}
                                </option>
                            ))}
                        </select>
                    </label>
                </DialogContent>
                <DialogActions className="shipment-status-dialog-actions">
                    <Button disabled={savingStatus} onClick={closeStatusDialog} variant="outlined">{pl.common.cancel}</Button>
                    <Button
                        disabled={!shipmentStatusMutable || savingStatus}
                        startIcon={savingStatus ? <CircularProgress size={18} /> : <Save />}
                        variant="contained"
                        onClick={saveShipmentStatus}
                    >
                        {pl.common.saveChanges}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                fullWidth
                maxWidth="xs"
                open={cancelShipmentDialogOpen}
                onClose={closeCancelShipmentDialog}
            >
                <DialogTitle>{pl.shipments.cancelDialog.title}</DialogTitle>
                <DialogContent>{pl.shipments.cancelDialog.description}</DialogContent>
                <DialogActions>
                    <Button disabled={cancelingShipment} onClick={closeCancelShipmentDialog} variant="outlined">
                        {pl.common.cancel}
                    </Button>
                    <Button
                        color="error"
                        disabled={cancelingShipment || !shipmentCanBeCanceled}
                        startIcon={cancelingShipment ? <CircularProgress size={18} /> : <Block fontSize="small" />}
                        variant="contained"
                        onClick={cancelShipment}
                    >
                        {pl.shipments.cancelDialog.confirm}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="shipment-person-dialog"
                fullWidth
                maxWidth="md"
                onClose={closePersonDialog}
                open={Boolean(personDialogType)}
            >
                <DialogTitle className="shipment-person-dialog-title">
                    <span className="shipment-person-dialog-icon"><PersonPinCircle /></span>
                    <span>
                        <small>Dane osoby</small>
                        <strong>
                            {personDialogType === "SENDER"
                                ? pl.shipments.form.actions.editSender
                                : pl.shipments.form.actions.editRecipient}
                        </strong>
                    </span>
                </DialogTitle>
                <DialogContent className="shipment-person-dialog-content">
                    <div className="shipment-person-dialog-grid">
                        <label className="shipment-person-dialog-field">
                            <span>{pl.shipments.form.fields.firstName}</span>
                            <input
                                autoFocus
                                value={personDraft.firstName}
                                onChange={(event) => updatePersonDraftField("firstName", event)}
                            />
                        </label>
                        <label className="shipment-person-dialog-field">
                            <span>{pl.shipments.form.fields.lastName}</span>
                            <input
                                value={personDraft.lastName}
                                onChange={(event) => updatePersonDraftField("lastName", event)}
                            />
                        </label>
                        <label className="shipment-person-dialog-field">
                            <span>{pl.shipments.form.fields.email}</span>
                            <input
                                type="email"
                                value={personDraft.email}
                                onChange={(event) => updatePersonDraftField("email", event)}
                            />
                        </label>
                        <label className="shipment-person-dialog-field">
                            <span>{pl.shipments.form.fields.phone}</span>
                            <input
                                inputMode="tel"
                                value={personDraft.telephoneNumber}
                                onChange={(event) => updatePersonDraftField("telephoneNumber", event)}
                            />
                        </label>
                        <label className="shipment-person-dialog-field">
                            <span>{pl.shipments.form.fields.city}</span>
                            <input
                                value={personDraft.city}
                                onChange={(event) => updatePersonDraftField("city", event)}
                            />
                        </label>
                        <label className="shipment-person-dialog-field">
                            <span>{pl.shipments.form.fields.postalCode}</span>
                            <input
                                value={personDraft.postalCode}
                                onChange={(event) => updatePersonDraftField("postalCode", event)}
                            />
                        </label>
                        <label className="shipment-person-dialog-field shipment-person-dialog-wide">
                            <span>{pl.shipments.form.fields.street}</span>
                            <input
                                value={personDraft.street}
                                onChange={(event) => updatePersonDraftField("street", event)}
                            />
                        </label>
                    </div>
                </DialogContent>
                <DialogActions className="shipment-person-dialog-actions">
                    <Button
                        disabled={savingPersonType !== null}
                        onClick={closePersonDialog}
                        startIcon={<Close />}
                        variant="outlined"
                    >
                        {pl.common.cancel}
                    </Button>
                    <Button
                        disabled={!shipmentDataMutable || !personDialogChanged || savingPersonType !== null}
                        onClick={savePerson}
                        startIcon={savingPersonType ? <CircularProgress color="inherit" size={16} /> : <Save />}
                        variant="contained"
                    >
                        {personDialogType === "SENDER"
                            ? pl.shipments.form.actions.saveSender
                            : pl.shipments.form.actions.saveRecipient}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                fullWidth
                maxWidth="lg"
                open={dangerousGoodDialogOpen}
                onClose={() => !savingDangerousGood && setDangerousGoodDialogOpen(false)}
            >
                <DialogTitle>{pl.shipments.dangerousGood.editorTitle}</DialogTitle>
                <DialogContent>
                    <DangerousGoodForm
                        disabled={!dangerousGoodMutable || savingDangerousGood}
                        value={dangerousGoodDraft}
                        onChange={setDangerousGoodDraft}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={savingDangerousGood}
                        onClick={() => setDangerousGoodDialogOpen(false)}
                        variant="outlined"
                    >
                        {pl.common.cancel}
                    </Button>
                    <Button
                        disabled={!dangerousGoodMutable || savingDangerousGood}
                        startIcon={savingDangerousGood ? <CircularProgress size={18} /> : <Save />}
                        variant="contained"
                        onClick={() => saveDangerousGood(false)}
                    >
                        {pl.common.saveChanges}
                    </Button>
                    {shipment?.dangerousGood ? (
                        <Button
                            disabled={!dangerousGoodMutable || savingDangerousGood}
                            variant="outlined"
                            onClick={() => saveDangerousGood(true)}
                        >
                            {pl.shipments.dangerousGood.replace}
                        </Button>
                    ) : null}
                </DialogActions>
            </Dialog>

            <Dialog
                open={dangerousGoodDeleteDialogOpen}
                onClose={() => !savingDangerousGood && setDangerousGoodDeleteDialogOpen(false)}
            >
                <DialogTitle>{pl.shipments.dangerousGood.deleteTitle}</DialogTitle>
                <DialogContent>{pl.shipments.dangerousGood.deleteConfirmation}</DialogContent>
                <DialogActions>
                    <Button
                        disabled={savingDangerousGood}
                        onClick={() => setDangerousGoodDeleteDialogOpen(false)}
                        variant="outlined"
                    >
                        {pl.common.cancel}
                    </Button>
                    <Button
                        color="error"
                        disabled={!dangerousGoodMutable || savingDangerousGood}
                        startIcon={savingDangerousGood ? <CircularProgress size={18} /> : <Delete />}
                        variant="contained"
                        onClick={deleteDangerousGood}
                    >
                        {pl.common.delete}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentDetails;
