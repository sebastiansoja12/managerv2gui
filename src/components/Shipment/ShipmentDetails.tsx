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
    Add,
    AttachMoney,
    Block,
    Cable,
    ChatBubbleOutline,
    CheckCircleOutline,
    Close,
    ContentCopy,
    DocumentScanner,
    Download,
    Edit,
    InfoOutlined,
    FactCheckOutlined,
    History,
    LocalShipping,
    LocationCity,
    LocationOn,
    Loop,
    Map,
    MoreVert,
    PersonPinCircle,
    PersonAdd,
    QrCode2,
    Refresh,
    Route,
    ReportProblemOutlined,
    Save,
    TableView,
    Print,
    WarningAmberOutlined,
    Upload,
} from "components/ui/icons";
import {useNavigate, useParams} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import DeliveryService from "../../hooks/DeliveryService";
import DocumentService from "../../hooks/DocumentService";
import ShipmentContentService from "../../hooks/ShipmentContentService";
import DepartmentService from "../../hooks/DepartmentService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import PickupPointService from "../../hooks/PickupPointService";
import Department from "../../class/depots/Department";
import {getBackendErrorMessage} from "../../api/errorMessage";
import RouteLogRecord from "../RouteLog/model/RouteLogRecord";
import {
    DeliveryMethodDto,
    PersonApi,
    PersonType,
    PickupMethodDto,
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
import ShipmentReturnSummary from "./ShipmentReturnSummary";
import {ReturnPackageDto} from "../Returns/model/ReturnPackage";
import {Delivery} from "../Deliveries/model/Delivery";
import {ShipmentDocument, ShipmentNote} from "./dto/ShipmentContentDto";
import {
    deliveryLifecycleLabel,
    deliveryMethodLabel,
    deliveryOutcomeLabel,
    deliveryStatusLabel,
    departmentCodeLabel,
    formatDeliveryDateTime,
} from "../Deliveries/deliveryLabels";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

type DocumentAction = "qr" | "excel";
type ShipmentDetailsTab = "overview" | "sender" | "recipient";
type ShipmentWorkspaceTab = "history" | "notes" | "documents" | "related" | "audit";

type RouteDetail = RouteLogRecord["routeLogRecordDetails"]["routeLogRecordDetailSet"][number];

const draftShipmentStatuses: ShipmentStatusDto[] = ["PLANNED", "CREATED", "PREPARED"];
const configurableInitialShipmentStatuses: ShipmentStatusDto[] = ["CREATED", "PREPARED"];

export const getConfiguredDraftShipmentStatus = (
    defaultStatus?: DefaultShipmentStatusApi | null,
): ShipmentStatusDto => (
    configurableInitialShipmentStatuses.includes(defaultStatus as ShipmentStatusDto)
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

const personAddress = (person?: PersonApi) => (
    [person?.street, [person?.postalCode, person?.city].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ") || pl.common.dash
);

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
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [loadingDelivery, setLoadingDelivery] = useState<boolean>(false);
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    const [deliveryReloadKey, setDeliveryReloadKey] = useState<number>(0);
    const [deliveryHistoryOpen, setDeliveryHistoryOpen] = useState<boolean>(false);
    const [deliveryPickupPointCode, setDeliveryPickupPointCode] = useState<string | null>(null);
    const [returnPackage, setReturnPackage] = useState<ReturnPackageDto | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<ShipmentDetailsTab>("overview");
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<ShipmentWorkspaceTab>("history");
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
    const [downloadingDocument, setDownloadingDocument] = useState<DocumentAction | null>(null);
    const [shipmentNotes, setShipmentNotes] = useState<ShipmentNote[]>([]);
    const [shipmentDocuments, setShipmentDocuments] = useState<ShipmentDocument[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [documentsError, setDocumentsError] = useState<string | null>(null);
    const [contentReloadKey, setContentReloadKey] = useState(0);
    const [noteDraft, setNoteDraft] = useState("");
    const [internalNote, setInternalNote] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [uploadingDocument, setUploadingDocument] = useState(false);
    const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
    const [operationMenuAnchor, setOperationMenuAnchor] = useState<HTMLElement | null>(null);
    const [qrMenuAnchor, setQrMenuAnchor] = useState<HTMLElement | null>(null);
    const [destinationInfoAnchor, setDestinationInfoAnchor] = useState<HTMLElement | null>(null);
    const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const qrPreviewRef = useRef<HTMLIFrameElement | null>(null);
    const noteInputRef = useRef<HTMLTextAreaElement | null>(null);
    const attachmentInputRef = useRef<HTMLInputElement | null>(null);

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

    const details = useMemo(() => routeDetails(routeLog), [routeLog]);
    const recentDetails = useMemo(() => details.slice(0, 5), [details]);
    const routeStops = useMemo(() => {
        const seen = new Set<string>();

        return [...details]
            .reverse()
            .map((detail) => detailDepartment(detail))
            .filter((department) => department !== pl.common.dash)
            .filter((department) => {
                if (seen.has(department)) {
                    return false;
                }
                seen.add(department);
                return true;
            });
    }, [details]);
    const availableShipmentStatuses = useMemo(
        () => {
            const configuredStatuses = getConfiguredShipmentStatuses(configuredDraftStatus);
            return shipment?.shipmentStatus === "PLANNED"
                ? configuredStatuses.filter((shipmentStatus) => !draftShipmentStatuses.includes(shipmentStatus))
                : configuredStatuses;
        },
        [configuredDraftStatus, shipment?.shipmentStatus],
    );
    const currentCourierDetail = details.find((detail) => detail.supplierCode || detail.username) || null;
    const destinationDepartment = useMemo(() => {
        const destinationDepartmentId = delivery?.destinationDepartmentId;
        if (!destinationDepartmentId) {
            return null;
        }

        return departments.find((department) => String(department.departmentId) === destinationDepartmentId) || null;
    }, [delivery?.destinationDepartmentId, departments]);
    const originDepartment = useMemo(() => {
        const originDepartmentId = delivery?.originDepartmentId;
        if (!originDepartmentId) {
            return null;
        }

        return departments.find((department) => String(department.departmentId) === originDepartmentId) || null;
    }, [delivery?.originDepartmentId, departments]);
    const cancellationWindowTimeLeft = useMemo(
        () => cancellationTimeLeft(shipment?.createdAt, cancellationWindowMinutes, currentTime),
        [cancellationWindowMinutes, currentTime, shipment?.createdAt],
    );
    const shipmentCanBeCanceled = Boolean(
        shipment
        && !shipment.locked
        && draftShipmentStatuses.includes(shipment.shipmentStatus)
        && Boolean(delivery?.originDepartmentId)
        && Boolean(delivery?.destinationDepartmentId)
        && cancellationWindowTimeLeft !== null
        && cancellationWindowTimeLeft > 0
    );
    const showCancellationWindow = Boolean(
        shipment
        && draftShipmentStatuses.includes(shipment.shipmentStatus)
    );
    const shipmentWarnings = useMemo(() => {
        if (!shipment) {
            return [];
        }

        const warnings: string[] = [];
        if (shipment.locked) {
            warnings.push(pl.shipments.dashboard.lockedWarning);
        }
        if (showCancellationWindow && cancellationWindowTimeLeft === 0) {
            warnings.push(pl.shipments.dashboard.cancellationExpiredWarning);
        }
        return warnings;
    }, [cancellationWindowTimeLeft, shipment, showCancellationWindow]);
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

    const openNoteForm = () => {
        setOperationMenuAnchor(null);
        setActiveDetailTab("overview");
        setActiveWorkspaceTab("notes");
        window.requestAnimationFrame(() => {
            noteInputRef.current?.scrollIntoView({behavior: "smooth", block: "center"});
            noteInputRef.current?.focus();
        });
    };

    const openDocumentPicker = () => {
        setOperationMenuAnchor(null);
        attachmentInputRef.current?.click();
    };

    const addShipmentNote = async () => {
        if (!shipment) {
            return;
        }
        const body = noteDraft.trim();
        if (!body || body.length > 4000) {
            setNotice({severity: "error", message: pl.shipments.dashboard.noteValidationError});
            return;
        }

        setSavingNote(true);
        try {
            const response = await ShipmentContentService.addNote(shipment.shipmentId.value, {body, internal: internalNote});
            setShipmentNotes((current) => [response.data, ...current]);
            setNoteDraft("");
            setInternalNote(false);
            setNotesError(null);
            setActiveWorkspaceTab("notes");
            setNotice({severity: "success", message: pl.shipments.dashboard.noteAdded});
        } catch (error) {
            showError(error, pl.shipments.dashboard.noteAddError);
        } finally {
            setSavingNote(false);
        }
    };

    const uploadShipmentDocument = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!shipment || !file) {
            return;
        }
        if (file.size === 0 || file.size > 5 * 1024 * 1024) {
            setNotice({severity: "error", message: pl.shipments.dashboard.documentSizeError});
            return;
        }

        setUploadingDocument(true);
        try {
            const response = await ShipmentContentService.addDocument(shipment.shipmentId.value, file);
            setShipmentDocuments((current) => [response.data, ...current]);
            setDocumentsError(null);
            setActiveWorkspaceTab("documents");
            setNotice({severity: "success", message: pl.shipments.dashboard.documentAdded});
        } catch (error) {
            showError(error, pl.shipments.dashboard.documentAddError);
        } finally {
            setUploadingDocument(false);
        }
    };

    const downloadShipmentDocument = async (shipmentDocument: ShipmentDocument) => {
        if (!shipment) {
            return;
        }
        setDownloadingAttachmentId(shipmentDocument.documentId);
        try {
            await ShipmentContentService.downloadDocument(shipment.shipmentId.value, shipmentDocument);
        } catch (error) {
            showError(error, pl.shipments.dashboard.documentDownloadError);
        } finally {
            setDownloadingAttachmentId(null);
        }
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
        setReturnPackage(null);
        try {
            const response = decodedTrackingNumber
                ? await ShipmentService.getControlCenterByTrackingNumber(decodedTrackingNumber)
                : await ShipmentService.getControlCenter(shipmentId || "");
            applyShipment(response.data.shipment);
            setDeliveryReloadKey((current) => current + 1);
            setRouteLog(response.data.routeLog);
            setReturnPackage(response.data.returnPackage ?? null);
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
        setNoteDraft("");
        setInternalNote(false);
    }, [shipment?.shipmentId.value]);

    useEffect(() => {
        const currentShipmentId = shipment?.shipmentId.value;
        setShipmentNotes([]);
        setShipmentDocuments([]);
        setNotesError(null);
        setDocumentsError(null);
        if (!currentShipmentId) {
            setLoadingNotes(false);
            setLoadingDocuments(false);
            return;
        }

        let active = true;
        setLoadingNotes(true);
        setLoadingDocuments(true);
        ShipmentContentService.listNotes(currentShipmentId)
            .then((response) => {
                if (active) {
                    setShipmentNotes(response.data);
                }
            })
            .catch((error: unknown) => {
                if (active) {
                    setNotesError(getBackendErrorMessage(error, pl.shipments.dashboard.workspace.notesLoadError));
                }
            })
            .finally(() => {
                if (active) {
                    setLoadingNotes(false);
                }
            });
        ShipmentContentService.listDocuments(currentShipmentId)
            .then((response) => {
                if (active) {
                    setShipmentDocuments(response.data);
                }
            })
            .catch((error: unknown) => {
                if (active) {
                    setDocumentsError(getBackendErrorMessage(error, pl.shipments.dashboard.workspace.documentsLoadError));
                }
            })
            .finally(() => {
                if (active) {
                    setLoadingDocuments(false);
                }
            });

        return () => {
            active = false;
        };
    }, [contentReloadKey, shipment?.shipmentId.value]);

    useEffect(() => {
        const currentShipmentId = shipment?.shipmentId.value;
        if (!currentShipmentId) {
            setDelivery(null);
            setLoadingDelivery(false);
            setDeliveryError(null);
            return;
        }

        let active = true;
        setLoadingDelivery(true);
        setDeliveryError(null);
        DeliveryService.getByShipmentId(currentShipmentId)
            .then((response) => {
                if (active) {
                    setDelivery(response.data);
                }
            })
            .catch((error: unknown) => {
                if (!active) {
                    return;
                }
                const apiError = error as {status?: number; response?: {status?: number}};
                if (apiError.status === 404 || apiError.response?.status === 404) {
                    setDelivery(null);
                    setDeliveryError(null);
                } else {
                    setDelivery(null);
                    setDeliveryError(getBackendErrorMessage(error, pl.deliveries.loadDetailsError));
                }
            })
            .finally(() => {
                if (active) {
                    setLoadingDelivery(false);
                }
            });

        return () => {
            active = false;
        };
    }, [deliveryReloadKey, shipment?.shipmentId.value]);

    useEffect(() => {
        DepartmentService.getAll()
            .then((response) => setDepartments(Array.isArray(response.data) ? response.data : []))
            .catch(() => setDepartments([]));
    }, []);

    useEffect(() => {
        let active = true;
        const pickupPointId = delivery?.deliveryPickupPointId;

        setDeliveryPickupPointCode(null);
        if (pickupPointId) {
            PickupPointService.getById(pickupPointId)
                .then((response) => {
                    if (active) {
                        setDeliveryPickupPointCode(response.data.code);
                    }
                })
                .catch(() => {
                    if (active) {
                        setDeliveryPickupPointCode(null);
                    }
                });
        }

        return () => {
            active = false;
        };
    }, [delivery?.deliveryPickupPointId]);

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
                    : availableShipmentStatuses[0] || configuredDraftStatus
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
            : availableShipmentStatuses[0] || configuredDraftStatus);
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
            setReturnPackage(response.data.returnPackage ?? null);
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
            dimensions: shipment.dimensions,
            weight: shipment.weight,
            customerReference: shipment.customerReference,
            contentDescription: shipment.contentDescription,
            declaredValue: shipment.declaredValue,
            shipmentPriority: shipment.shipmentPriority,
            packagingType: shipment.packagingType,
            serviceLevel: shipment.serviceLevel,
            priceAmount: String(shipment.price?.amount ?? ""),
            currency: shipment.price?.currency || "PLN",
            pickupMethod: (delivery?.pickupMethod as PickupMethodDto | null) || "DEPARTMENT",
            deliveryMethod: (delivery?.method as DeliveryMethodDto | null) || "COURIER",
            pickupPointId: delivery?.pickupPointId || undefined,
            deliveryPickupPointId: delivery?.deliveryPickupPointId ? {value: delivery.deliveryPickupPointId} : null,
            deliveryPickupPointCode,
        };

        setOperationMenuAnchor(null);
        navigate("/shipments/create", {state: {similarShipment}});
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
            setReturnPackage(response.data.returnPackage ?? null);
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
                {recentDetails.map((detail) => {
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
                                <p>{shipmentEventDescription(detail.description, statusKey)}</p>
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

    const partySummary = (personType: PersonType, person: PersonApi) => (
        <article className="shipment-dashboard-party">
            <div className="shipment-dashboard-party-heading">
                <span className="shipment-dashboard-party-icon"><PersonPinCircle fontSize="small" /></span>
                <div>
                    <span>{personType === "SENDER" ? pl.shipments.form.sections.sender : pl.shipments.form.sections.receiver}</span>
                    <strong>{fullName(person)}</strong>
                </div>
            </div>
            <p>{personAddress(person)}</p>
            <p>{person.telephoneNumber || pl.common.dash}</p>
            <p>{person.email || pl.common.dash}</p>
            <button type="button" onClick={() => selectDetailTab(personType === "SENDER" ? "sender" : "recipient")}>
                {pl.shipments.dashboard.showFullData}
            </button>
        </article>
    );

    const workspaceTabs: Array<{
        id: ShipmentWorkspaceTab;
        label: string;
        count?: number;
        icon: React.ReactNode;
    }> = [
        {id: "history", label: pl.shipments.dashboard.workspace.history, count: details.length, icon: <History fontSize="small" />},
        {id: "notes", label: pl.shipments.dashboard.workspace.notes, count: shipmentNotes.length, icon: <ChatBubbleOutline fontSize="small" />},
        {id: "documents", label: pl.shipments.dashboard.workspace.documents, count: shipmentDocuments.length, icon: <DocumentScanner fontSize="small" />},
        {id: "related", label: pl.shipments.dashboard.workspace.related, count: shipment?.shipmentRelatedId?.value ? 1 : 0, icon: <Cable fontSize="small" />},
        {id: "audit", label: pl.shipments.dashboard.workspace.audit, icon: <FactCheckOutlined fontSize="small" />},
    ];

    const renderWorkspaceContent = () => {
        if (activeWorkspaceTab === "history") {
            if (!details.length) {
                return <div className="shipment-workspace-empty">{pl.shipments.dashboard.workspace.emptyHistory}</div>;
            }

            return (
                <div className="shipment-workspace-table-wrap">
                    <table className="shipment-workspace-table">
                        <thead>
                            <tr>
                                <th>{pl.shipments.dashboard.workspace.dateTime}</th>
                                <th>{pl.shipments.dashboard.workspace.operation}</th>
                                <th>{pl.shipments.routeHistory.department}</th>
                                <th>{pl.shipments.routeHistory.user}</th>
                                <th>{pl.shipments.routeHistory.terminal}</th>
                                <th>{pl.shipments.dashboard.workspace.details}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.map((detail) => (
                                <tr key={`${detail.id}-${detail.processType}-${detail.timestamp}`}>
                                    <td><i className={`shipment-workspace-status-dot tm-status-${String(detailStatus(detail)).toLowerCase()}`} />{formatDateTime(detail.timestamp)}</td>
                                    <td><strong>{detail.processType || pl.shipments.routeHistory.defaultOperation}</strong></td>
                                    <td>{detailDepartment(detail)}</td>
                                    <td>{detailUser(detail)}</td>
                                    <td>{detailTerminal(detail)}</td>
                                    <td>{shipmentEventDescription(detail.description, detailStatus(detail))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (activeWorkspaceTab === "notes") {
            if (loadingNotes) {
                return <div className="shipment-workspace-empty"><CircularProgress size={22} />{pl.shipments.dashboard.workspace.loadingNotes}</div>;
            }
            if (notesError) {
                return <div className="shipment-workspace-empty" role="alert"><span>{notesError}</span><Button onClick={() => setContentReloadKey((current) => current + 1)}>{pl.deliveries.retry}</Button></div>;
            }
            if (!shipmentNotes.length) {
                return <div className="shipment-workspace-empty">{pl.shipments.dashboard.workspace.emptyNotes}</div>;
            }
            return (
                <div className="shipment-content-list">
                    {shipmentNotes.map((note) => (
                        <article className="shipment-content-item" key={note.noteId}>
                            <div className="shipment-content-meta">
                                <time dateTime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
                                <span>{pl.shipments.dashboard.workspace.author}: {note.authorUserId}</span>
                                {note.internal ? <Chip label={pl.shipments.dashboard.internalNote} size="small" /> : null}
                            </div>
                            <p>{note.body}</p>
                        </article>
                    ))}
                </div>
            );
        }

        if (activeWorkspaceTab === "documents") {
            if (loadingDocuments) {
                return <div className="shipment-workspace-empty"><CircularProgress size={22} />{pl.shipments.dashboard.workspace.loadingDocuments}</div>;
            }
            if (documentsError) {
                return <div className="shipment-workspace-empty" role="alert"><span>{documentsError}</span><Button onClick={() => setContentReloadKey((current) => current + 1)}>{pl.deliveries.retry}</Button></div>;
            }
            if (!shipmentDocuments.length) {
                return <div className="shipment-workspace-empty">{pl.shipments.dashboard.workspace.emptyDocuments}</div>;
            }
            return (
                <div className="shipment-content-list">
                    {shipmentDocuments.map((shipmentDocument) => (
                        <article className="shipment-content-item shipment-content-document" key={shipmentDocument.documentId}>
                            <div>
                                <strong>{shipmentDocument.filename}</strong>
                                <div className="shipment-content-meta">
                                    <time dateTime={shipmentDocument.createdAt}>{formatDateTime(shipmentDocument.createdAt)}</time>
                                    <span>{pl.shipments.dashboard.workspace.author}: {shipmentDocument.uploadedByUserId}</span>
                                    <span>{pl.shipments.dashboard.sizeKilobytes.replace("{size}", String(Math.ceil(shipmentDocument.sizeBytes / 1024)))}</span>
                                </div>
                            </div>
                            <Button
                                aria-label={`${pl.shipments.dashboard.downloadAttachment}: ${shipmentDocument.filename}`}
                                disabled={downloadingAttachmentId === shipmentDocument.documentId}
                                onClick={() => downloadShipmentDocument(shipmentDocument)}
                                size="small"
                                startIcon={downloadingAttachmentId === shipmentDocument.documentId ? <CircularProgress size={16} /> : <Download fontSize="small" />}
                                variant="outlined"
                            >
                                {pl.shipments.dashboard.downloadAttachment}
                            </Button>
                        </article>
                    ))}
                </div>
            );
        }

        if (activeWorkspaceTab === "related" && shipment?.shipmentRelatedId?.value) {
            return (
                <div className="shipment-workspace-related">
                    <div>
                        <span>{pl.shipments.summary.relatedShipment}</span>
                        <strong>#{shipment.shipmentRelatedId.value}</strong>
                    </div>
                    <Button variant="outlined" onClick={() => navigate(`/shipments/${shipment.shipmentRelatedId?.value}/edit`)}>
                        {pl.shipments.actions.details}
                    </Button>
                </div>
            );
        }

        const emptyMessages: Record<Exclude<ShipmentWorkspaceTab, "history">, string> = {
            notes: pl.shipments.dashboard.workspace.emptyNotes,
            documents: pl.shipments.dashboard.workspace.emptyDocuments,
            related: pl.shipments.dashboard.workspace.emptyRelated,
            audit: pl.shipments.dashboard.workspace.emptyAudit,
        };

        return <div className="shipment-workspace-empty">{emptyMessages[activeWorkspaceTab]}</div>;
    };

    const latestDeliveryStep = delivery?.steps.reduce((latest, step) => (
        !latest || step.stepNumber > latest.stepNumber ? step : latest
    ), undefined as Delivery["steps"][number] | undefined);

    return (
        <div className="shipments-page shipment-cc-page">
            <input
                accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.xlsx"
                aria-label={pl.shipments.dashboard.addAttachment}
                hidden
                onChange={uploadShipmentDocument}
                ref={attachmentInputRef}
                type="file"
            />
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
                            <MenuItem
                                className="shipment-document-menu-item"
                                disabled={!shipmentStatusMutable || savingStatus}
                                onClick={() => {
                                    setOperationMenuAnchor(null);
                                    openStatusDialog();
                                }}
                            >
                                {savingStatus ? <CircularProgress size={18} /> : <Edit fontSize="small" />}
                                {pl.shipments.actions.changeStatus}
                            </MenuItem>
                            <MenuItem className="shipment-document-menu-item" disabled>
                                <PersonAdd fontSize="small" />
                                {pl.shipments.actions.assignCourier}
                            </MenuItem>
                            <MenuItem className="shipment-document-menu-item" disabled>
                                <LocationCity fontSize="small" />
                                {pl.shipments.actions.changeDepartment}
                            </MenuItem>
                            <MenuItem className="shipment-document-menu-item" disabled>
                                <Loop fontSize="small" />
                                {pl.shipments.actions.reroute}
                            </MenuItem>
                            <MenuItem className="shipment-document-menu-item" disabled={!shipment} onClick={openNoteForm}>
                                <ChatBubbleOutline fontSize="small" />
                                {pl.shipments.actions.addNote}
                            </MenuItem>
                            <MenuItem className="shipment-document-menu-item" disabled={!shipment || uploadingDocument || loadingDocuments} onClick={openDocumentPicker}>
                                <DocumentScanner fontSize="small" />
                                {pl.shipments.actions.addDocument}
                            </MenuItem>
                            <MenuItem className="shipment-document-menu-item shipment-operation-danger" disabled>
                                <ReportProblemOutlined fontSize="small" />
                                {pl.shipments.actions.markProblematic}
                            </MenuItem>
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

                {!loadingShipment && shipment ? <ShipmentReturnSummary returnPackage={returnPackage} /> : null}

                {loadingShipment ? (
                    <div className="shipments-panel shipment-edit-loader">
                        <CircularProgress size={30} />
                        <span>{pl.shipments.page.editLoadingSubtitle}</span>
                    </div>
                ) : shipment ? (
                    <div className="shipment-dashboard-layout">
                        <main className="shipment-dashboard-main">
                            {activeDetailTab === "overview" ? (
                                <>
                                    <section id="shipment-overview" className="shipment-dashboard-card shipment-dashboard-data-card">
                                        <div className="shipment-dashboard-card-header">
                                            <div className="shipment-dashboard-card-title">
                                                <span><LocalShipping fontSize="small" /></span>
                                                <Typography variant="h6">{pl.shipments.form.sections.shipmentData}</Typography>
                                            </div>
                                            <Chip className={`tm-status tm-status-${shipment.shipmentStatus.toLowerCase()}`} label={pl.shipments.status[shipment.shipmentStatus]} size="small" />
                                        </div>

                                        <div className="shipment-dashboard-facts shipment-dashboard-facts-primary">
                                            <div><span>{pl.shipments.summary.tracking}</span><strong>{shipment.trackingNumber?.value || pl.common.dash}</strong></div>
                                            <div><span>{pl.shipments.summary.id}</span><strong>#{shipment.shipmentId.value}</strong></div>
                                            <div><span>{pl.shipments.summary.type}</span><strong>{pl.shipments.type[shipment.shipmentType]}</strong></div>
                                            <div><span>{pl.shipments.summary.relatedShipment}</span><strong>{shipment.shipmentRelatedId?.value ? `#${shipment.shipmentRelatedId.value}` : pl.common.dash}</strong></div>
                                            <div className="shipment-dashboard-person-fact">
                                                <span>{pl.shipments.form.sections.sender}</span>
                                                <strong>{fullName(sender)}</strong>
                                                <small>{personAddress(sender)}</small>
                                            </div>
                                            <div className="shipment-dashboard-person-fact">
                                                <span>{pl.shipments.form.sections.receiver}</span>
                                                <strong>{fullName(recipient)}</strong>
                                                <small>{personAddress(recipient)}</small>
                                            </div>
                                            <div><span>{pl.shipments.summary.originDepartment}</span><strong>{originDepartment?.departmentCode?.value || pl.common.dash}</strong></div>
                                            <div>
                                                <span>{pl.shipments.summary.destination}</span>
                                                <div className="shipment-destination-control">
                                                    <strong className="shipment-destination-value">{destinationDepartment?.departmentCode?.value || pl.common.dash}</strong>
                                                    <IconButton
                                                        aria-expanded={Boolean(destinationInfoAnchor)}
                                                        aria-haspopup="dialog"
                                                        aria-label={pl.shipments.summary.showDepartmentDetails}
                                                        className="shipment-destination-info-button"
                                                        size="small"
                                                        onClick={(event) => setDestinationInfoAnchor((currentAnchor) => currentAnchor ? null : event.currentTarget)}
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
                                                                <div><dt>{pl.shipments.form.fields.city}</dt><dd>{destinationDepartment.address.city || pl.common.dash}</dd></div>
                                                                <div><dt>{pl.shipments.form.fields.street}</dt><dd>{destinationDepartment.address.street || pl.common.dash}</dd></div>
                                                            </dl>
                                                        ) : <p className="shipment-department-popover-empty">{pl.shipments.summary.departmentDetailsUnavailable}</p>}
                                                    </Menu>
                                                </div>
                                            </div>
                                            <div><span>{pl.shipments.summary.createdAt}</span><strong>{formatDateTime(shipment.createdAt || undefined)}</strong></div>
                                            <div><span>{pl.shipments.dashboard.plannedDelivery}</span><strong>{pl.common.dash}</strong></div>
                                            <div><span>{pl.shipments.summary.status}</span><strong>{pl.shipments.status[shipment.shipmentStatus]}</strong></div>
                                            <div><span>{pl.shipments.dashboard.service}</span><strong>{pl.shipments.priority[shipment.shipmentPriority]}</strong></div>
                                        </div>

                                        <div className="shipment-dashboard-metrics">
                                            <div><span>{pl.shipments.dashboard.weight}</span><strong>{shipment.weight ? `${shipment.weight.value} ${shipment.weight.unit}` : pl.common.dash}</strong></div>
                                            <div><span>{pl.shipments.dashboard.dimensions}</span><strong>{shipment.dimensions ? `${shipment.dimensions.length} × ${shipment.dimensions.width} × ${shipment.dimensions.height} ${shipment.dimensions.unit}` : pl.common.dash}</strong></div>
                                            <div><span>{pl.shipments.dashboard.volume}</span><strong>{pl.common.dash}</strong></div>
                                            <div><span>{pl.shipments.dashboard.pieces}</span><strong>{pl.common.dash}</strong></div>
                                            <div><span>{pl.shipments.dashboard.declaredValue}</span><strong>{shipment.declaredValue ? `${shipment.declaredValue.amount.toLocaleString(pl.common.locale)} ${shipment.declaredValue.currency}` : pl.common.dash}</strong></div>
                                        </div>

                                        <div className="shipment-dashboard-additional">
                                            <strong>{pl.shipments.dashboard.additionalInformation}</strong>
                                            <div>
                                                <span>{pl.shipments.summary.pickupPoint}: <b>{delivery?.pickupPointId || pl.common.dash}</b></span>
                                                <span>{pl.shipments.summary.deliveryPickupPoint}: <b>{deliveryPickupPointCode || pl.common.dash}</b></span>
                                                <span>{pl.shipments.form.fields.pickupMethod}: <b>{delivery?.pickupMethod ? pl.shipments.pickupMethod[delivery.pickupMethod as PickupMethodDto] : pl.common.dash}</b></span>
                                                <span>{pl.shipments.form.fields.deliveryMethod}: <b>{delivery?.method ? pl.shipments.deliveryMethod[delivery.method as DeliveryMethodDto] : pl.common.dash}</b></span>
                                                <span>{pl.shipments.form.fields.priority}: <b>{pl.shipments.priority[shipment.shipmentPriority]}</b></span>
                                                <span>{pl.shipments.form.fields.issuerCountry}: <b>{shipment.sender.countryCode || pl.common.dash}</b></span>
                                                <span>{pl.shipments.form.fields.receiverCountry}: <b>{shipment.recipient.countryCode || pl.common.dash}</b></span>
                                                <span>{pl.shipments.summary.updatedAt}: <b>{formatDateTime(shipment.updatedAt || undefined)}</b></span>
                                                <span>{pl.shipments.dashboard.insurance}: <b>{pl.common.dash}</b></span>
                                                <span>{pl.shipments.dashboard.containerNumber}: <b>{pl.common.dash}</b></span>
                                                <span>{pl.shipments.dashboard.waybillNumber}: <b>{pl.common.dash}</b></span>
                                                {showCancellationWindow ? <span>{pl.shipments.summary.cancellationWindow}: <b>{formatCancellationTimeLeft(cancellationWindowTimeLeft)}</b></span> : null}
                                            </div>
                                        </div>
                                    </section>

                                    <div className="shipment-dashboard-lower-grid">
                                        <section className="shipment-dashboard-card shipment-workspace" id="shipment-workspace">
                                            <div className="shipment-workspace-tabs" role="tablist" aria-label={pl.shipments.dashboard.workspace.history}>
                                                {workspaceTabs.map((tab) => (
                                                    <button
                                                        aria-controls={`shipment-workspace-panel-${tab.id}`}
                                                        aria-selected={activeWorkspaceTab === tab.id}
                                                        className={activeWorkspaceTab === tab.id ? "shipment-workspace-tab-active" : ""}
                                                        id={`shipment-workspace-tab-${tab.id}`}
                                                        key={tab.id}
                                                        role="tab"
                                                        type="button"
                                                        onClick={() => setActiveWorkspaceTab(tab.id)}
                                                    >
                                                        {tab.icon}
                                                        <span>{tab.label}</span>
                                                        {tab.count !== undefined ? <small>{tab.count}</small> : null}
                                                    </button>
                                                ))}
                                            </div>
                                            <div
                                                aria-labelledby={`shipment-workspace-tab-${activeWorkspaceTab}`}
                                                id={`shipment-workspace-panel-${activeWorkspaceTab}`}
                                                role="tabpanel"
                                            >
                                                {renderWorkspaceContent()}
                                            </div>
                                        </section>

                                    </div>

                                    <section className="shipment-dashboard-card shipment-dashboard-delivery" aria-label={pl.deliveries.informationTitle}>
                                        <div className="shipment-dashboard-card-header">
                                            <div className="shipment-dashboard-card-title">
                                                <span><LocalShipping fontSize="small" /></span>
                                                <Typography variant="h6">{pl.deliveries.informationTitle}</Typography>
                                            </div>
                                            {delivery ? <Chip className={`tm-status tm-status-${String(delivery.deliveryStatus || "unknown").toLowerCase()}`}
                                                label={deliveryStatusLabel(delivery.deliveryStatus)} size="small" /> : null}
                                        </div>

                                        <div className="shipment-delivery-content">
                                            {loadingDelivery ? (
                                                <div className="shipment-delivery-state"><CircularProgress size={22} />{pl.deliveries.loadingDetails}</div>
                                            ) : deliveryError ? (
                                                <div className="shipment-delivery-state shipment-delivery-error" role="alert">
                                                    <span>{deliveryError}</span>
                                                    <Button variant="outlined" size="small" onClick={() => setDeliveryReloadKey((current) => current + 1)}>
                                                        {pl.deliveries.retry}
                                                    </Button>
                                                </div>
                                            ) : delivery ? (
                                                <>
                                                    <div className="shipment-delivery-facts">
                                                        <div><span>{pl.deliveries.columns.id}</span><strong title={delivery.id}>{delivery.id}</strong></div>
                                                        <div><span>{pl.deliveries.lifecycleLabel}</span><strong>{deliveryLifecycleLabel(delivery.lifecycleStatus)}</strong></div>
                                                        <div><span>{pl.deliveries.methodLabel}</span><strong>{deliveryMethodLabel(delivery.method)}</strong></div>
                                                        <div><span>{pl.deliveries.columns.created}</span><strong>{formatDeliveryDateTime(delivery.createdAt)}</strong></div>
                                                        <div><span>{pl.deliveries.plannedLabel}</span><strong>{formatDeliveryDateTime(delivery.plannedAt)}</strong></div>
                                                        <div><span>{pl.deliveries.deliveredLabel}</span><strong>{formatDeliveryDateTime(delivery.deliveredAt)}</strong></div>
                                                        <div><span>{pl.deliveries.columns.steps}</span><strong>{delivery.steps.length}</strong></div>
                                                    </div>
                                                    {latestDeliveryStep ? (
                                                        <div className="shipment-delivery-latest-step">
                                                            <div className="shipment-delivery-step-heading">
                                                                <strong>{pl.deliveries.historyTitle}</strong>
                                                                <span>{formatDeliveryDateTime(latestDeliveryStep.attemptedAt)}</span>
                                                            </div>
                                                            <div className="shipment-delivery-step-summary">
                                                                <Chip
                                                                    className={`tm-status tm-status-${String(latestDeliveryStep.deliveryStatus || "unknown").toLowerCase()}`}
                                                                    label={deliveryStatusLabel(latestDeliveryStep.deliveryStatus)}
                                                                    size="small"
                                                                />
                                                                <span>{deliveryOutcomeLabel(latestDeliveryStep.outcome)}</span>
                                                            </div>
                                                            <div className="shipment-delivery-step-facts">
                                                                <div><span>{pl.deliveries.userLabel}</span><strong>{latestDeliveryStep.userId || pl.common.dash}</strong></div>
                                                                <div><span>{pl.deliveries.departmentLabel}</span><strong>{latestDeliveryStep.departmentId || pl.common.dash}</strong></div>
                                                                <div><span>{pl.deliveries.courierLabel}</span><strong>{latestDeliveryStep.supplierId || pl.common.dash}</strong></div>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    <div className="shipment-delivery-actions">
                                                        <Button
                                                            startIcon={<History fontSize="small" />}
                                                            variant="outlined"
                                                            onClick={() => setDeliveryHistoryOpen(true)}
                                                        >
                                                            {pl.deliveries.showAttempts}
                                                        </Button>
                                                        <Button variant="outlined" onClick={() => navigate(`/deliveries/${encodeURIComponent(delivery.id)}/edit`)}>
                                                            {pl.deliveries.detailsTitle}
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="shipment-delivery-state">{pl.deliveries.noDeliveryForShipment}</div>
                                            )}
                                        </div>
                                    </section>


                                    <div className="shipment-dashboard-bottom-tools">
                                        <section className="shipment-dashboard-card shipment-operator-notes">
                                            <div className="shipment-dashboard-card-title"><span><ChatBubbleOutline fontSize="small" /></span><Typography variant="h6">{pl.shipments.dashboard.operatorNotes}</Typography></div>
                                            <div className="shipment-operator-note-form">
                                                <textarea
                                                    aria-label={pl.shipments.dashboard.operatorNotes}
                                                    maxLength={4000}
                                                    onChange={(event) => setNoteDraft(event.target.value)}
                                                    placeholder={pl.shipments.dashboard.notePlaceholder}
                                                    ref={noteInputRef}
                                                    value={noteDraft}
                                                />
                                                <label><input checked={internalNote} onChange={(event) => setInternalNote(event.target.checked)} type="checkbox" /> {pl.shipments.dashboard.internalNote}</label>
                                                <Button disabled={!noteDraft.trim() || savingNote || loadingNotes || !shipment} onClick={addShipmentNote} startIcon={savingNote ? <CircularProgress size={16} /> : <Add fontSize="small" />}>{pl.shipments.actions.addNote}</Button>
                                            </div>
                                        </section>

                                        <section className="shipment-dashboard-card shipment-attachments">
                                            <div className="shipment-attachments-header">
                                                <div className="shipment-dashboard-card-title"><span><DocumentScanner fontSize="small" /></span><Typography variant="h6">{pl.shipments.dashboard.attachments}</Typography></div>
                                                <Button disabled={uploadingDocument || loadingDocuments || !shipment} onClick={openDocumentPicker} size="small" startIcon={uploadingDocument ? <CircularProgress size={16} /> : <Upload fontSize="small" />} variant="outlined">{pl.shipments.dashboard.addAttachment}</Button>
                                            </div>
                                            {loadingDocuments ? <p>{pl.shipments.dashboard.workspace.loadingDocuments}</p> : documentsError ? (
                                                <p role="alert">{documentsError}</p>
                                            ) : shipmentDocuments.length ? (
                                                <ul className="shipment-attachment-list">
                                                    {shipmentDocuments.slice(0, 3).map((shipmentDocument) => (
                                                        <li key={shipmentDocument.documentId}>
                                                            <span title={shipmentDocument.filename}>{shipmentDocument.filename}</span>
                                                            <Button
                                                                aria-label={`${pl.shipments.dashboard.downloadAttachment}: ${shipmentDocument.filename}`}
                                                                disabled={downloadingAttachmentId === shipmentDocument.documentId}
                                                                onClick={() => downloadShipmentDocument(shipmentDocument)}
                                                                size="small"
                                                            >
                                                                {downloadingAttachmentId === shipmentDocument.documentId ? <CircularProgress size={16} /> : <Download fontSize="small" />}
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <p>{pl.shipments.dashboard.noAttachments}</p>}
                                        </section>
                                    </div>
                                </>
                            ) : null}
                            {activeDetailTab === "sender" ? personFields(pl.shipments.form.sections.sender, "SENDER", sender) : null}
                            {activeDetailTab === "recipient" ? personFields(pl.shipments.form.sections.receiver, "RECIPIENT", recipient) : null}
                        </main>

                        <aside className="shipment-dashboard-workflow">
                            <section className="shipment-dashboard-card shipment-dashboard-next-operation">
                                <div className="shipment-dashboard-card-title"><span><CheckCircleOutline fontSize="small" /></span><Typography variant="h6">{pl.shipments.dashboard.nextOperation}</Typography></div>
                                <span>{pl.shipments.dashboard.currentStage}</span>
                                <strong>{pl.shipments.status[shipment.shipmentStatus]}</strong>
                                <p>{pl.shipments.dashboard.nextOperationUnavailable}</p>
                                {currentCourierDetail ? <small>{pl.shipments.summary.lastActivity.replace("{date}", formatDateTime(currentCourierDetail.timestamp)).replace("{department}", detailDepartment(currentCourierDetail))}</small> : null}
                                <Button disabled fullWidth startIcon={<Route fontSize="small" />}>{pl.shipments.dashboard.startOperation}</Button>
                            </section>

                            <section className={`shipment-dashboard-card shipment-dashboard-warnings${shipmentWarnings.length ? " shipment-dashboard-warnings-active" : ""}`}>
                                <div className="shipment-dashboard-card-title"><span><WarningAmberOutlined fontSize="small" /></span><Typography variant="h6">{pl.shipments.dashboard.warnings}</Typography></div>
                                {shipmentWarnings.length ? (
                                    <ul>{shipmentWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                                ) : <p><CheckCircleOutline fontSize="small" /> {pl.shipments.dashboard.noWarnings}</p>}
                            </section>

                            <section className="shipment-dashboard-card shipment-dashboard-route">
                                <div className="shipment-dashboard-card-title"><span><Route fontSize="small" /></span><Typography variant="h6">{pl.shipments.dashboard.shipmentRoute}</Typography></div>
                                {routeStops.length ? (
                                    <ol>{routeStops.map((stop, index) => (
                                        <li className={index === routeStops.length - 1 ? "shipment-dashboard-route-current" : ""} key={stop}>
                                            <i />
                                            <span>{stop}</span>
                                            {index === routeStops.length - 1 ? <small>{pl.shipments.dashboard.currentStop}</small> : null}
                                        </li>
                                    ))}</ol>
                                ) : <p><LocationOn fontSize="small" /> {pl.shipments.dashboard.routeEmpty}</p>}
                            </section>
                        </aside>

                        <aside className="shipment-dashboard-right-rail">
                            <section className="shipment-dashboard-card shipment-cc-side" id="shipment-history">
                                <div className="shipment-cc-side-header">
                                    <div>
                                        <Typography variant="h6">{pl.shipments.routeHistory.title}</Typography>
                                        <span>{pl.shipments.dashboard.recentEvents.replace("{count}", String(recentDetails.length))}</span>
                                    </div>
                                    <Button disabled={!shipment} size="small" startIcon={<Map fontSize="small" />} variant="outlined" onClick={() => navigate(historyPath)}>
                                        {pl.shipments.routeHistory.openDetails}
                                    </Button>
                                </div>
                                {renderRouteHistory()}
                            </section>

                            <section className="shipment-dashboard-card shipment-dashboard-finance">
                                <div className="shipment-dashboard-card-title"><span><AttachMoney fontSize="small" /></span><Typography variant="h6">{pl.shipments.dashboard.financialData}</Typography></div>
                                <dl>
                                    <div><dt>{pl.shipments.dashboard.basePrice}</dt><dd>{formatPrice(shipment)}</dd></div>
                                    <div><dt>{pl.shipments.dashboard.surcharges}</dt><dd>{pl.common.dash}</dd></div>
                                    <div className="shipment-dashboard-finance-total"><dt>{pl.shipments.dashboard.total}</dt><dd>{formatPrice(shipment)}</dd></div>
                                    <div><dt>{pl.shipments.dashboard.paymentMethod}</dt><dd>{pl.shipments.dashboard.unavailable}</dd></div>
                                    <div><dt>{pl.shipments.dashboard.paymentStatus}</dt><dd>{pl.shipments.dashboard.unavailable}</dd></div>
                                    <div><dt>{pl.shipments.dashboard.invoice}</dt><dd>{pl.shipments.dashboard.unavailable}</dd></div>
                                </dl>
                            </section>

                            <section className="shipment-dashboard-card shipment-dashboard-parties">
                                <div className="shipment-dashboard-card-title"><span><PersonPinCircle fontSize="small" /></span><Typography variant="h6">{pl.shipments.dashboard.parties}</Typography></div>
                                {partySummary("SENDER", sender)}
                                {partySummary("RECIPIENT", recipient)}
                            </section>
                        </aside>
                    </div>
                ) : (
                    <Alert severity="error">{pl.shipments.messages.loadViewError}</Alert>
                )}
            </div>

            <Dialog
                className="shipment-delivery-history-dialog"
                fullWidth
                maxWidth="md"
                open={deliveryHistoryOpen}
                onClose={() => setDeliveryHistoryOpen(false)}
            >
                <DialogTitle className="shipment-delivery-history-title">
                    <History fontSize="small" />
                    <span>{pl.deliveries.attemptsDialogTitle}</span>
                </DialogTitle>
                <DialogContent className="shipment-delivery-history-content">
                    {delivery?.steps.length ? (
                        [...delivery.steps]
                            .sort((first, second) => first.stepNumber - second.stepNumber)
                            .map((step) => (
                                <article className="shipment-delivery-history-item" key={`${step.stepNumber}-${step.attemptedAt}`}>
                                    <header>
                                        <div className="shipment-delivery-history-item-heading">
                                            <strong>{pl.deliveries.stepNumberLabel} {step.stepNumber}</strong>
                                            <Chip
                                                className={`tm-status tm-status-${String(step.deliveryStatus || "unknown").toLowerCase()}`}
                                                label={deliveryStatusLabel(step.deliveryStatus)}
                                                size="small"
                                            />
                                            <span>{deliveryOutcomeLabel(step.outcome)}</span>
                                        </div>
                                        <time>{formatDeliveryDateTime(step.attemptedAt)}</time>
                                    </header>
                                    <div className="shipment-delivery-history-facts">
                                        <div><span>{pl.deliveries.userLabel}</span><strong>{step.userId || pl.common.dash}</strong></div>
                                        <div><span>{pl.deliveries.departmentLabel}</span><strong>{departmentCodeLabel(departments, step.departmentId)}</strong></div>
                                        <div><span>{pl.deliveries.courierLabel}</span><strong>{step.supplierId || pl.common.dash}</strong></div>
                                        <div><span>{pl.deliveries.vehicleLabel}</span><strong>{step.vehicleId || pl.common.dash}</strong></div>
                                    </div>
                                    {step.comment ? (
                                        <p><strong>{pl.deliveries.commentLabel}:</strong> {step.comment}</p>
                                    ) : null}
                                    {step.failureReason ? (
                                        <p><strong>{pl.deliveries.failureReasonLabel}:</strong> {step.failureReason}</p>
                                    ) : null}
                                </article>
                            ))
                    ) : (
                        <div className="shipment-delivery-history-empty">{pl.deliveries.noSteps}</div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeliveryHistoryOpen(false)}>{pl.common.close}</Button>
                </DialogActions>
            </Dialog>

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

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentDetails;
