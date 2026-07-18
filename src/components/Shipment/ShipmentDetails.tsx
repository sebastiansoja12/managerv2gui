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
    Menu,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {
    ArrowDropDown,
    ArrowBack,
    Download,
    Edit,
    LocalShipping,
    Map,
    PersonPinCircle,
    QrCode2,
    Refresh,
    Route,
    Save,
    TableView,
    Print,
} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import DocumentService from "../../hooks/DocumentService";
import {getBackendErrorMessage} from "../../api/errorMessage";
import RouteLogRecord from "../RouteLog/model/RouteLogRecord";
import {
    PersonApi,
    PersonType,
    ShipmentDto,
    shipmentTypes,
    shipmentStatuses,
    ShipmentStatusDto,
    ShipmentTypeDto,
} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";
import "./styles/shipments.css";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

type DocumentAction = "qr" | "excel";

type RouteDetail = RouteLogRecord["routeLogRecordDetails"]["routeLogRecordDetailSet"][number];

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

const detailDepartment = (detail: RouteDetail) => detail.departmentCode || detail.depotCode || pl.common.dash;

const detailTerminal = (detail: RouteDetail) => detail.terminalId?.value || detail.zebraId || pl.common.dash;

const formatBoolean = (value: boolean) => value ? pl.shipments.dangerousGood.yes : pl.shipments.dangerousGood.no;

const ShipmentDetails: React.FC = () => {
    const navigate = useNavigate();
    const {shipmentId, trackingNumber} = useParams();
    const [shipment, setShipment] = useState<ShipmentDto | null>(null);
    const [routeLog, setRouteLog] = useState<RouteLogRecord | null>(null);
    const [status, setStatus] = useState<ShipmentStatusDto>("CREATED");
    const [shipmentType, setShipmentType] = useState<ShipmentTypeDto>("PARENT");
    const [sender, setSender] = useState<PersonApi>({...emptyPerson});
    const [recipient, setRecipient] = useState<PersonApi>({...emptyPerson});
    const [loadingShipment, setLoadingShipment] = useState<boolean>(true);
    const [loadingRouteLog, setLoadingRouteLog] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [savingStatus, setSavingStatus] = useState<boolean>(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
    const [downloadingDocument, setDownloadingDocument] = useState<DocumentAction | null>(null);
    const [qrMenuAnchor, setQrMenuAnchor] = useState<HTMLElement | null>(null);
    const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const qrPreviewRef = useRef<HTMLIFrameElement | null>(null);

    const validShipmentId = Boolean(shipmentId && /^\d+$/.test(shipmentId) && !/^0+$/.test(shipmentId));
    const decodedTrackingNumber = trackingNumber ? decodeURIComponent(trackingNumber) : "";

    const details = useMemo(() => routeDetails(routeLog), [routeLog]);
    const currentCourierDetail = details.find((detail) => detail.supplierCode || detail.username) || null;
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

    const printQrLabel = () => {
        qrPreviewRef.current?.contentWindow?.focus();
        qrPreviewRef.current?.contentWindow?.print();
    };

    const applyShipment = (data: ShipmentDto) => {
        setShipment(data);
        setStatus(data.shipmentStatus);
        setShipmentType(data.shipmentType);
        setSender(clonePerson(data.sender));
        setRecipient(clonePerson(data.recipient));
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

    const updatePersonField = (
        personType: PersonType,
        field: keyof PersonApi,
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const value = event.target.value;
        if (personType === "SENDER") {
            setSender((current) => ({...current, [field]: value}));
            return;
        }

        setRecipient((current) => ({...current, [field]: value}));
    };

    const openStatusDialog = () => {
        if (!shipment) {
            return;
        }

        setStatus(shipment.shipmentStatus);
        setStatusDialogOpen(true);
    };

    const closeStatusDialog = () => {
        if (!savingStatus) {
            setStatusDialogOpen(false);
        }
    };

    const saveShipmentStatus = async () => {
        if (!shipment) {
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

    const saveShipment = async () => {
        if (!shipment) {
            return;
        }

        setSaving(true);
        try {
            if (shipmentType !== shipment.shipmentType) {
                await ShipmentService.changeShipmentType(shipment.shipmentId.value, shipmentType);
            }

            await ShipmentService.updatePerson(shipment.shipmentId.value, "SENDER", sender);
            await ShipmentService.updatePerson(shipment.shipmentId.value, "RECIPIENT", recipient);

            const response = shipment.trackingNumber?.value
                ? await ShipmentService.getControlCenterByTrackingNumber(shipment.trackingNumber.value)
                : await ShipmentService.getControlCenter(shipment.shipmentId.value);
            applyShipment(response.data.shipment);
            setRouteLog(response.data.routeLog);
            setNotice({severity: "success", message: pl.shipments.messages.saveSuccess});
        } catch (error) {
            showError(error, pl.shipments.messages.saveError);
        } finally {
            setSaving(false);
        }
    };

    const personFields = (title: string, personType: PersonType, person: PersonApi) => (
        <section className={`shipment-edit-section shipment-details-segment shipment-details-person-${personType.toLowerCase()}`}>
            <div className="shipment-edit-section-header">
                <Typography variant="h6">{title}</Typography>
            </div>
            <div className="shipment-details-grid">
                <TextField
                    label={pl.shipments.form.fields.firstName}
                    size="small"
                    value={person.firstName}
                    onChange={(event) => updatePersonField(personType, "firstName", event)}
                />

                <TextField
                    label={pl.shipments.form.fields.lastName}
                    size="small"
                    value={person.lastName}
                    onChange={(event) => updatePersonField(personType, "lastName", event)}
                />

                <TextField
                    label={pl.shipments.form.fields.email}
                    size="small"
                    value={person.email}
                    onChange={(event) => updatePersonField(personType, "email", event)}
                />

                <TextField
                    label={pl.shipments.form.fields.phone}
                    size="small"
                    value={person.telephoneNumber}
                    onChange={(event) => updatePersonField(personType, "telephoneNumber", event)}
                />

                <TextField
                    label={pl.shipments.form.fields.city}
                    size="small"
                    value={person.city}
                    onChange={(event) => updatePersonField(personType, "city", event)}
                />

                <TextField
                    label={pl.shipments.form.fields.postalCode}
                    size="small"
                    value={person.postalCode}
                    onChange={(event) => updatePersonField(personType, "postalCode", event)}
                />

                <TextField
                    className="shipment-details-wide"
                    label={pl.shipments.form.fields.street}
                    size="small"
                    value={person.street}
                    onChange={(event) => updatePersonField(personType, "street", event)}
                />
            </div>
        </section>
    );

    const renderDangerousGood = () => {
        const dangerousGood = shipment?.dangerousGood;

        return (
            <section className="shipment-edit-section shipment-details-segment shipment-details-dangerous-good">
                <div className="shipment-edit-section-header">
                    <Typography variant="h6">{pl.shipments.form.sections.dangerousGood}</Typography>
                    <Chip
                        className={dangerousGood ? "shipment-dangerous-chip-active" : "shipment-dangerous-chip-empty"}
                        label={dangerousGood ? pl.shipments.dangerousGood.active : pl.shipments.dangerousGood.emptyStatus}
                        size="small"
                    />
                </div>

                {dangerousGood ? (
                    <>
                        <div className="shipment-dangerous-good-grid">
                            <div>
                                <span>{pl.shipments.form.fields.name}</span>
                                <strong>{dangerousGood.name || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.classification}</span>
                                <strong>{dangerousGood.classificationCode || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.weight}</span>
                                <strong>{dangerousGood.weight ? `${dangerousGood.weight.value} ${dangerousGood.weight.unit}` : pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.packaging}</span>
                                <strong>{dangerousGood.packaging || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.countryOfOrigin}</span>
                                <strong>{dangerousGood.countryOfOrigin || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.emergencyContact}</span>
                                <strong>{dangerousGood.emergencyContact || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.safetyDataSheet}</span>
                                <strong>{dangerousGood.safetyDataSheet || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.hazardSymbols}</span>
                                <strong>{dangerousGood.hazardSymbols?.length ? dangerousGood.hazardSymbols.join(", ") : pl.common.dash}</strong>
                            </div>
                        </div>

                        <div className="shipment-dangerous-good-flags">
                            <Chip label={`${pl.shipments.form.fields.flammable}: ${formatBoolean(dangerousGood.flammable)}`} size="small" />
                            <Chip label={`${pl.shipments.form.fields.corrosive}: ${formatBoolean(dangerousGood.corosive)}`} size="small" />
                            <Chip label={`${pl.shipments.form.fields.toxic}: ${formatBoolean(dangerousGood.toxic)}`} size="small" />
                        </div>

                        <div className="shipment-dangerous-good-notes">
                            <div>
                                <span>{pl.shipments.form.fields.description}</span>
                                <p>{dangerousGood.description || pl.common.dash}</p>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.storageRequirements}</span>
                                <p>{dangerousGood.storageRequirements || pl.common.dash}</p>
                            </div>
                            <div>
                                <span>{pl.shipments.form.fields.handlingInstructions}</span>
                                <p>{dangerousGood.handlingInstructions || pl.common.dash}</p>
                            </div>
                        </div>
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
                                <p>{detail.description || pl.shipments.routeHistory.noDescription}</p>
                                <dl>
                                    <div><dt>{pl.shipments.routeHistory.department}</dt><dd>{detailDepartment(detail)}</dd></div>
                                    <div><dt>{pl.shipments.routeHistory.user}</dt><dd>{detail.username || pl.common.dash}</dd></div>
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
                        <Button disabled={loadingShipment || saving || !shipment} startIcon={<Save />} variant="contained" onClick={saveShipment}>
                            {pl.common.saveChanges}
                        </Button>
                    </div>
                </div>

                {loadingShipment ? (
                    <div className="shipments-panel shipment-edit-loader">
                        <CircularProgress size={30} />
                        <span>{pl.shipments.page.editLoadingSubtitle}</span>
                    </div>
                ) : shipment ? (
                    <div className="shipment-cc-layout">
                        <main className="shipments-panel shipment-edit-panel">
                            <section className="shipment-edit-section shipment-details-segment shipment-details-info-segment">
                                <div className="shipment-edit-section-header">
                                    <Typography variant="h6">{pl.shipments.form.sections.shipmentData}</Typography>
                                    <Chip className={`tm-status tm-status-${shipment.shipmentStatus.toLowerCase()}`} label={pl.shipments.status[shipment.shipmentStatus]} size="small" />
                                </div>

                                <div className="shipment-details-summary shipment-edit-summary">
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
                                        <span>{pl.shipments.summary.destination}</span>
                                        <strong>{shipment.destination || pl.common.dash}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.price}</span>
                                        <strong>{formatPrice(shipment)}</strong>
                                    </div>
                                    <div>
                                        <span>{pl.shipments.summary.status}</span>
                                        <strong>{pl.shipments.status[shipment.shipmentStatus]}</strong>
                                    </div>
                                </div>

                                <div className="shipment-details-grid shipment-details-operations-grid">
                                    <div className="shipment-status-control">
                                        <span>{pl.shipments.form.fields.shipmentStatus}</span>
                                        <div>
                                            <Chip
                                                className={`tm-status tm-status-${shipment.shipmentStatus.toLowerCase()}`}
                                                label={pl.shipments.status[shipment.shipmentStatus]}
                                                size="small"
                                            />
                                            <Button
                                                disabled={savingStatus}
                                                size="small"
                                                startIcon={<Edit fontSize="small" />}
                                                variant="outlined"
                                                onClick={openStatusDialog}
                                            >
                                                {pl.shipments.actions.changeStatus}
                                            </Button>
                                        </div>
                                    </div>

                                    <TextField
                                        fullWidth
                                        label={pl.shipments.form.fields.shipmentType}
                                        select
                                        size="small"
                                        value={shipmentType}
                                        onChange={(event) => setShipmentType(event.target.value as ShipmentTypeDto)}
                                    >
                                        {shipmentTypes.map((currentShipmentType) => (
                                            <MenuItem key={currentShipmentType} value={currentShipmentType}>
                                                {pl.shipments.type[currentShipmentType]}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </div>
                            </section>

                            <section className="shipment-cc-courier shipment-details-segment">
                                <div className="shipment-cc-courier-icon">
                                    <PersonPinCircle />
                                </div>
                                <div>
                                    <span>{pl.shipments.summary.currentCourier}</span>
                                    <strong>{currentCourierDetail?.supplierCode || currentCourierDetail?.username || pl.shipments.table.unassigned}</strong>
                                    <p>
                                        {currentCourierDetail
                                            ? pl.shipments.summary.lastActivity
                                                .replace("{date}", formatDateTime(currentCourierDetail.timestamp))
                                                .replace("{department}", detailDepartment(currentCourierDetail))
                                            : pl.shipments.summary.noCourierInfo}
                                    </p>
                                </div>
                            </section>

                            {renderDangerousGood()}
                            {personFields(pl.shipments.form.sections.sender, "SENDER", sender)}
                            {personFields(pl.shipments.form.sections.receiver, "RECIPIENT", recipient)}
                        </main>

                        <aside className="shipments-panel shipment-cc-side">
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
                fullWidth
                maxWidth="xs"
                open={statusDialogOpen}
                onClose={closeStatusDialog}
            >
                <DialogTitle>{pl.shipments.statusDialog.title}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label={pl.shipments.form.fields.shipmentStatus}
                        margin="dense"
                        select
                        size="small"
                        value={status}
                        onChange={(event) => setStatus(event.target.value as ShipmentStatusDto)}
                    >
                        {shipmentStatuses.map((shipmentStatus) => (
                            <MenuItem key={shipmentStatus} value={shipmentStatus}>
                                {pl.shipments.status[shipmentStatus]}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button disabled={savingStatus} onClick={closeStatusDialog}>{pl.common.cancel}</Button>
                    <Button
                        startIcon={savingStatus ? <CircularProgress size={18} /> : <Save />}
                        variant="contained"
                        onClick={saveShipmentStatus}
                    >
                        {pl.common.saveChanges}
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
