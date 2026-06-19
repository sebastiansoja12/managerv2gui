import React, {ChangeEvent, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {
    ArrowBack,
    LocalShipping,
    PersonPinCircle,
    Refresh,
    Route,
    Save,
} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import RouteLogService from "../../hooks/RouteLogService";
import {ApiErrorResponse} from "../../api/ApiResult";
import RouteLogRecord from "../RouteLog/model/RouteLogRecord";
import {
    PersonApi,
    PersonType,
    ShipmentDto,
    shipmentStatuses,
    ShipmentStatusDto,
} from "./dto/ShipmentDto";
import pl from "../../i18n/pl";
import "./styles/shipments.css";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

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
    return value || "-";
};

const formatPrice = (shipment?: ShipmentDto | null) => {
    if (!shipment?.price) {
        return "-";
    }

    return `${shipment.price.amount.toLocaleString("pl-PL")} ${shipment.price.currency}`;
};

const formatDateTime = (date?: string) => {
    if (!date) {
        return "-";
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleString("pl-PL", {
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

const detailStatus = (detail: RouteDetail) => detail.shipmentStatus || detail.parcelStatus || "-";

const detailStatusLabel = (status: string) => pl.shipments.status[status as ShipmentStatusDto] || status;

const detailDepartment = (detail: RouteDetail) => detail.departmentCode || detail.depotCode || "-";

const detailTerminal = (detail: RouteDetail) => detail.terminalId?.value || detail.zebraId || "-";

const ShipmentControlCenter: React.FC = () => {
    const navigate = useNavigate();
    const {shipmentId, trackingNumber} = useParams();
    const [shipment, setShipment] = useState<ShipmentDto | null>(null);
    const [routeLog, setRouteLog] = useState<RouteLogRecord | null>(null);
    const [status, setStatus] = useState<ShipmentStatusDto>("CREATED");
    const [sender, setSender] = useState<PersonApi>({...emptyPerson});
    const [recipient, setRecipient] = useState<PersonApi>({...emptyPerson});
    const [loadingShipment, setLoadingShipment] = useState<boolean>(true);
    const [loadingRouteLog, setLoadingRouteLog] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [notice, setNotice] = useState<Notice | null>(null);

    const parsedShipmentId = Number(shipmentId);
    const validShipmentId = Number.isFinite(parsedShipmentId) && parsedShipmentId > 0;
    const decodedTrackingNumber = trackingNumber ? decodeURIComponent(trackingNumber) : "";

    const details = useMemo(() => routeDetails(routeLog), [routeLog]);
    const currentCourierDetail = details.find((detail) => detail.supplierCode || detail.username) || null;

    const showError = (error: unknown, fallback = "Operacja nie powiodła się") => {
        const apiError = error as ApiErrorResponse;
        setNotice({
            severity: "error",
            message: apiError.message || (error as Error).message || fallback,
        });
    };

    const applyShipment = (data: ShipmentDto) => {
        setShipment(data);
        setStatus(data.shipmentStatus);
        setSender(clonePerson(data.sender));
        setRecipient(clonePerson(data.recipient));
    };

    const loadRouteLog = async (shipmentToLoad: ShipmentDto) => {
        setLoadingRouteLog(true);
        try {
            const response = await RouteLogService.get(shipmentToLoad.shipmentId.value);
            setRouteLog(response.data);
        } catch (error) {
            setRouteLog(null);
            setNotice({severity: "info", message: "Brak historii route trackera dla tej przesyłki"});
        } finally {
            setLoadingRouteLog(false);
        }
    };

    const loadShipment = async () => {
        if (!decodedTrackingNumber && !validShipmentId) {
            setLoadingShipment(false);
            setNotice({severity: "error", message: "Niepoprawny numer trackingowy przesyłki"});
            return;
        }

        setLoadingShipment(true);
        try {
            const response = decodedTrackingNumber
                ? await ShipmentService.getByTrackingNumber(decodedTrackingNumber)
                : await ShipmentService.get(parsedShipmentId);
            applyShipment(response.data);
            await loadRouteLog(response.data);
        } catch (error) {
            showError(error, "Nie udało się pobrać przesyłki");
        } finally {
            setLoadingShipment(false);
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

    const saveShipment = async () => {
        if (!shipment) {
            return;
        }

        setSaving(true);
        try {
            if (status !== shipment.shipmentStatus) {
                await ShipmentService.updateStatus({
                    shipmentId: shipment.shipmentId,
                    shipmentStatus: status,
                });
            }

            await ShipmentService.updatePerson(shipment.shipmentId.value, "SENDER", sender);
            await ShipmentService.updatePerson(shipment.shipmentId.value, "RECIPIENT", recipient);

            const response = shipment.trackingNumber?.value
                ? await ShipmentService.getByTrackingNumber(shipment.trackingNumber.value)
                : await ShipmentService.get(shipment.shipmentId.value);
            applyShipment(response.data);
            await loadRouteLog(response.data);
            setNotice({severity: "success", message: "Przesyłka została zapisana"});
        } catch (error) {
            showError(error, "Nie udało się zapisać przesyłki");
        } finally {
            setSaving(false);
        }
    };

    const personFields = (title: string, personType: PersonType, person: PersonApi) => (
        <section className="shipment-edit-section">
            <div className="shipment-edit-section-header">
                <Typography variant="h6">{title}</Typography>
            </div>
            <div className="shipment-details-grid">
                <TextField label="Imię" size="small" value={person.firstName} onChange={(event) => updatePersonField(personType, "firstName", event)} />
                <TextField label="Nazwisko" size="small" value={person.lastName} onChange={(event) => updatePersonField(personType, "lastName", event)} />
                <TextField label="E-mail" size="small" value={person.email} onChange={(event) => updatePersonField(personType, "email", event)} />
                <TextField label="Telefon" size="small" value={person.telephoneNumber} onChange={(event) => updatePersonField(personType, "telephoneNumber", event)} />
                <TextField label="Miasto" size="small" value={person.city} onChange={(event) => updatePersonField(personType, "city", event)} />
                <TextField label="Kod pocztowy" size="small" value={person.postalCode} onChange={(event) => updatePersonField(personType, "postalCode", event)} />
                <TextField className="shipment-details-wide" label="Ulica" size="small" value={person.street} onChange={(event) => updatePersonField(personType, "street", event)} />
            </div>
        </section>
    );

    const renderRouteHistory = () => {
        if (loadingRouteLog) {
            return (
                <div className="shipment-cc-side-empty">
                    <CircularProgress size={24} />
                    <span>Ładowanie historii...</span>
                </div>
            );
        }

        if (!details.length) {
            return (
                <div className="shipment-cc-side-empty">
                    <Route fontSize="small" />
                    <span>Brak wpisów route trackera</span>
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
                                    <strong>{detail.processType || "Operacja"}</strong>
                                    <span>{formatDateTime(detail.timestamp)}</span>
                                </div>
                                <Chip className={`tm-status tm-status-${String(statusKey).toLowerCase()}`} label={detailStatusLabel(statusKey)} size="small" />
                                <p>{detail.description || "Brak opisu operacji"}</p>
                                <dl>
                                    <div><dt>Oddział</dt><dd>{detailDepartment(detail)}</dd></div>
                                    <div><dt>Użytkownik</dt><dd>{detail.username || "-"}</dd></div>
                                    <div><dt>Terminal</dt><dd>{detailTerminal(detail)}</dd></div>
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
                            <Typography variant="h4">ShipmentControlCenter</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {shipment
                                    ? `${shipment.trackingNumber?.value || "-"} · ${fullName(shipment.sender)} → ${fullName(shipment.recipient)}`
                                    : "Centrum kontroli i operacji na przesyłce"}
                            </Typography>
                        </Box>
                    </div>
                    <div className="shipment-edit-header-actions">
                        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate("/shipments/list")}>
                            Lista przesyłek
                        </Button>
                        <Button disabled={loadingShipment} startIcon={<Refresh />} variant="outlined" onClick={loadShipment}>
                            Odśwież
                        </Button>
                        <Button disabled={loadingShipment || saving || !shipment} startIcon={<Save />} variant="contained" onClick={saveShipment}>
                            Zapisz zmiany
                        </Button>
                    </div>
                </div>

                {loadingShipment ? (
                    <div className="shipments-panel shipment-edit-loader">
                        <CircularProgress size={30} />
                        <span>Ładowanie przesyłki...</span>
                    </div>
                ) : shipment ? (
                    <div className="shipment-cc-layout">
                        <main className="shipments-panel shipment-edit-panel">
                            <section className="shipment-details-summary shipment-edit-summary">
                                <div>
                                    <span>Tracking</span>
                                    <strong>{shipment.trackingNumber?.value || "-"}</strong>
                                </div>
                                <div>
                                    <span>ID</span>
                                    <strong>#{shipment.shipmentId.value}</strong>
                                </div>
                                <div>
                                    <span>Rozmiar</span>
                                    <strong>{pl.shipments.size[shipment.shipmentSize]}</strong>
                                </div>
                                <div>
                                    <span>Cena</span>
                                    <strong>{formatPrice(shipment)}</strong>
                                </div>
                                <div>
                                    <span>Status</span>
                                    <strong>{pl.shipments.status[shipment.shipmentStatus]}</strong>
                                </div>
                            </section>

                            <section className="shipment-cc-courier">
                                <div className="shipment-cc-courier-icon">
                                    <PersonPinCircle />
                                </div>
                                <div>
                                    <span>Aktualny kurier</span>
                                    <strong>{currentCourierDetail?.supplierCode || currentCourierDetail?.username || "Nieprzypisany"}</strong>
                                    <p>
                                        {currentCourierDetail
                                            ? `Ostatnia aktywność: ${formatDateTime(currentCourierDetail.timestamp)} · ${detailDepartment(currentCourierDetail)}`
                                            : "Brak informacji o kurierze w route trackerze"}
                                    </p>
                                </div>
                            </section>

                            <section className="shipment-edit-section">
                                <div className="shipment-edit-section-header">
                                    <Typography variant="h6">Operacje na przesyłce</Typography>
                                </div>
                                <TextField
                                    fullWidth
                                    label="Status przesyłki"
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
                            </section>

                            {personFields("Nadawca", "SENDER", sender)}
                            {personFields("Odbiorca", "RECIPIENT", recipient)}
                        </main>

                        <aside className="shipments-panel shipment-cc-side">
                            <div className="shipment-cc-side-header">
                                <div>
                                    <Typography variant="h6">Historia route trackera</Typography>
                                    <span>{details.length} wpisów</span>
                                </div>
                                <Route fontSize="small" />
                            </div>
                            {renderRouteHistory()}
                        </aside>
                    </div>
                ) : (
                    <Alert severity="error">Nie udało się załadować przesyłki.</Alert>
                )}
            </div>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentControlCenter;
