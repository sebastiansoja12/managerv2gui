import React, {FormEvent, useCallback, useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    TextField,
    Typography,
} from "components/ui";
import {
    Add,
    Block,
    CheckCircle,
    DeleteOutline,
    Edit,
    Inventory2,
    LocalShipping,
    QrCode2,
    QrCodeScanner,
    Refresh,
    Send,
    TableView,
    FactCheckOutlined,
    ViewList,
} from "components/ui/icons";
import DeliveryService from "../../hooks/DeliveryService";
import DepartmentService from "../../hooks/DepartmentService";
import PalletService from "../../hooks/PalletService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import Department from "../../class/depots/Department";
import {AppTabDefinition} from "../AppShell/types";
import {Delivery} from "../Deliveries/model/Delivery";
import {deliveryLifecycleLabel, deliveryMethodLabel, deliveryStatusLabel, formatDeliveryDateTime} from "../Deliveries/deliveryLabels";
import {departmentCodeValue, ShipmentDetailsDto, ShipmentDto} from "../Shipment/dto/ShipmentDto";
import {PalletDto, PalletHistoryEntryDto, PalletManualStatusDto} from "./model/Pallet";
import PalletAddShipmentsDialog from "./PalletAddShipmentsDialog";
import PalletCarrierDialog from "./PalletCarrierDialog";
import PalletEditDialog from "./PalletEditDialog";
import PalletHistoryTimeline from "./PalletHistoryTimeline";
import PalletSummary from "./PalletSummary";
import {isPalletCancellable} from "./PalletList";
import {
    formatPalletDate,
    formatPalletWeight,
    palletErrorLabel,
    palletErrorMessage,
    palletStatusLabel,
    palletStatusTone,
    transportTypeLabel,
} from "./palletLabels";
import {usePalletDocuments} from "./usePalletDocuments";
import "./styles/pallets.css";

type PalletDetailsViewProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

type PalletItem = {
    shipmentId: string;
    shipment: ShipmentDto | null;
    details: ShipmentDetailsDto | null;
    error: string | null;
};

const CONTENT_MODIFIABLE_STATUSES = ["CREATED", "PREPARING", "NOT_READY", "READY"];
const FINISHED_STATUSES = ["DELIVERED", "CANCELLED"];
const TRANSPORT_LOCKED_STATUSES = ["IN_TRANSIT", "DELIVERED", "CANCELLED"];

const toKilograms = (value: number, unit?: string | null) => {
    switch (unit) {
        case "G":
            return value / 1000;
        case "T":
            return value * 1000;
        default:
            return value;
    }
};

export const departmentLabel = (department?: Department | null) => department
    ? [department.departmentCode?.value, department.address?.city].filter(Boolean).join(" · ")
    : pl.common.dash;

export const isPalletContentEditable = (pallet: PalletDto) =>
    CONTENT_MODIFIABLE_STATUSES.includes(pallet.palletStatus) && pallet.storageStatus !== "LOCKED";

export const isPalletEditable = (pallet: PalletDto) => !FINISHED_STATUSES.includes(pallet.palletStatus);

export const isPalletTransportEditable = (pallet: PalletDto) => !TRANSPORT_LOCKED_STATUSES.includes(pallet.palletStatus);

function PalletDetailsView({onOpenTab}: PalletDetailsViewProps) {
    const translations = pl.pallets.details;
    const {trackingNumber: trackingNumberParam = ""} = useParams();
    const trackingNumber = decodeURIComponent(trackingNumberParam);

    const [pallet, setPallet] = useState<PalletDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [items, setItems] = useState<PalletItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [history, setHistory] = useState<PalletHistoryEntryDto[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionInfo, setActionInfo] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [addFromListOpen, setAddFromListOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [carrierOpen, setCarrierOpen] = useState(false);
    const [newShipmentNumber, setNewShipmentNumber] = useState("");

    const departmentsById = useMemo(
        () => new Map(departments.map((department) => [String(department.departmentId), department])),
        [departments],
    );
    const departmentById = useCallback(
        (departmentId?: number | string | null) => departmentLabel(departmentsById.get(String(departmentId ?? ""))),
        [departmentsById],
    );
    const documents = usePalletDocuments(departmentById);

    const loadPallet = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await PalletService.getByTrackingNumber(trackingNumber);
            setPallet(response.data);
        } catch (error) {
            setPallet(null);
            setLoadError(palletErrorMessage(error, translations.loadError));
        } finally {
            setLoading(false);
        }
    }, [trackingNumber, translations.loadError]);

    useEffect(() => {
        loadPallet();
    }, [loadPallet]);

    useEffect(() => {
        DepartmentService.getAll()
            .then((response) => setDepartments(response.data))
            .catch(() => setDepartments([]));
    }, []);

    const shipmentIdsKey = pallet ? pallet.shipmentIds.map(String).join(",") : "";

    useEffect(() => {
        if (!pallet) {
            setItems([]);
            return;
        }
        let active = true;
        const shipmentIds = pallet.shipmentIds.map(String);
        setItemsLoading(true);
        Promise.allSettled(shipmentIds.map((shipmentId) => ShipmentService.getControlCenter(shipmentId)))
            .then((results) => {
                if (!active) {
                    return;
                }
                setItems(results.map((result, index) => result.status === "fulfilled"
                    ? {shipmentId: shipmentIds[index], shipment: result.value.data.shipment, details: result.value.data, error: null}
                    : {shipmentId: shipmentIds[index], shipment: null, details: null, error: translations.items.loadError}));
            })
            .finally(() => active && setItemsLoading(false));
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pallet?.palletId, shipmentIdsKey]);

    useEffect(() => {
        if (!pallet) {
            setDelivery(null);
            return;
        }
        let active = true;
        setDeliveryLoading(true);
        DeliveryService.getByPalletId(pallet.palletId)
            .then((response) => active && setDelivery(response.data))
            .catch(() => active && setDelivery(null))
            .finally(() => active && setDeliveryLoading(false));
        return () => {
            active = false;
        };
    }, [pallet?.palletId, pallet?.palletStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!pallet) {
            setHistory([]);
            return;
        }
        let active = true;
        setHistoryLoading(true);
        setHistoryError(null);
        PalletService.getHistory(pallet.palletId)
            .then((response) => active && setHistory(response.data || []))
            .catch((error) => {
                if (active) {
                    setHistory([]);
                    setHistoryError(palletErrorMessage(error, pl.pallets.history.loadError));
                }
            })
            .finally(() => active && setHistoryLoading(false));
        return () => {
            active = false;
        };
    }, [pallet?.palletId, pallet?.modified, pallet?.palletStatus, pallet?.carrier?.assignedAt, shipmentIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const cargoWeightKg = useMemo(() => items.reduce((sum, item) => {
        const weight = item.shipment?.weight;
        return weight?.value ? sum + toKilograms(Number(weight.value), weight.unit) : sum;
    }, 0), [items]);

    const runAction = async (action: () => Promise<PalletDto | null>, successMessage?: string) => {
        if (busy) {
            return;
        }
        setBusy(true);
        setActionError(null);
        setActionInfo(null);
        try {
            const updatedPallet = await action();
            if (updatedPallet) {
                setPallet(updatedPallet);
            }
            if (successMessage) {
                setActionInfo(successMessage);
            }
        } catch (error) {
            setActionError(palletErrorMessage(error, translations.actionError));
        } finally {
            setBusy(false);
        }
    };

    const addShipment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const shipmentNumber = newShipmentNumber.trim();
        if (!pallet || !shipmentNumber) {
            setActionError(translations.items.numberRequired);
            return;
        }
        runAction(async () => {
            const shipment = await ShipmentService.getByTrackingNumber(shipmentNumber);
            const shipmentId = String(shipment.data.shipmentId.value);
            const response = await PalletService.addShipments(pallet.palletId, [shipmentId]);
            setNewShipmentNumber("");
            return response.data;
        }, translations.items.added.replace("{trackingNumber}", shipmentNumber));
    };

    const removeShipment = (item: PalletItem) => {
        if (!pallet) {
            return;
        }
        runAction(async () => (await PalletService.removeShipment(pallet.palletId, item.shipmentId)).data,
            translations.items.removed.replace("{trackingNumber}", item.shipment?.trackingNumber?.value || item.shipmentId));
    };

    const loadPalletOnTruck = () => {
        if (!pallet) {
            return;
        }
        runAction(async () => {
            const response = await PalletService.scan(pallet.trackingNumber);
            if (!response.data.success) {
                throw new Error(palletErrorLabel(response.data.errorCode) || response.data.errorMessage || translations.actionError);
            }
            return (await PalletService.getByTrackingNumber(pallet.trackingNumber)).data;
        }, translations.loadSuccess);
    };

    const changeStatus = (palletStatus: PalletManualStatusDto) => {
        if (!pallet) {
            return;
        }
        const statusTranslations = translations.statusActions;
        const confirmation = palletStatus === "IN_TRANSIT" ? statusTranslations.confirmDispatch : statusTranslations.confirmDelivered;
        if (!window.confirm(confirmation.replace("{trackingNumber}", pallet.trackingNumber))) {
            return;
        }
        runAction(async () => (await PalletService.changeStatus(pallet.palletId, palletStatus)).data,
            palletStatus === "IN_TRANSIT" ? statusTranslations.dispatched : statusTranslations.delivered);
    };

    const cancelPallet = () => {
        if (!pallet || !window.confirm(pl.pallets.list.cancelDialog.description.replace("{trackingNumber}", pallet.trackingNumber))) {
            return;
        }
        runAction(async () => (await PalletService.cancel(pallet.palletId)).data, translations.cancelled);
    };

    if (loading) {
        return (
            <main className="pallet-page">
                <div className="pallet-shell"><p className="pallet-hint"><CircularProgress size={18} /> {translations.loading}</p></div>
            </main>
        );
    }

    if (!pallet) {
        return (
            <main className="pallet-page">
                <div className="pallet-shell">
                    <Alert severity="error">{loadError || translations.loadError}</Alert>
                    <div><Button startIcon={<Refresh />} variant="outlined" onClick={loadPallet}>{translations.refresh}</Button></div>
                </div>
            </main>
        );
    }

    const editable = isPalletContentEditable(pallet);
    const maxWeightKg = pallet.maxGrossWeight ? Number(pallet.maxGrossWeight) : null;
    const grossWeightKg = pallet.grossWeight ? toKilograms(Number(pallet.grossWeight), pallet.grossWeightUnit) : null;
    const usedWeightKg = grossWeightKg ?? cargoWeightKg;
    const utilization = maxWeightKg ? Math.min(100, Math.round((usedWeightKg / maxWeightKg) * 100)) : null;
    const overweight = (maxWeightKg !== null && usedWeightKg > maxWeightKg) || pallet.loadBlockReason === "OVERWEIGHT";
    const formatKg = (value: number) => `${value.toLocaleString(pl.common.locale, {maximumFractionDigits: 3})} KG`;
    const carrier = pallet.carrier;
    const actions = translations.actions;

    return (
        <main className="pallet-page">
            <div className="pallet-shell">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><Inventory2 /></span>
                        <div>
                            <Typography variant="h4">{translations.title} <span className="pallet-code">{pallet.trackingNumber}</span></Typography>
                            <p>
                                <Chip color={palletStatusTone(pallet)} label={palletStatusLabel(pallet.palletStatus)} size="small" />
                            </p>
                        </div>
                    </div>
                    <IconButton aria-label={translations.refresh} title={translations.refresh} onClick={loadPallet}>
                        <Refresh fontSize="small" />
                    </IconButton>
                </section>

                <nav aria-label={actions.title} className="pallet-toolbar">
                    <Button disabled={busy || !isPalletEditable(pallet)} startIcon={<Edit />} onClick={() => setEditOpen(true)}>
                        {actions.edit}
                    </Button>
                    <Button disabled={busy || !isPalletTransportEditable(pallet)} startIcon={<LocalShipping />} variant="outlined" onClick={() => setCarrierOpen(true)}>
                        {carrier ? actions.changeCarrier : actions.assignCarrier}
                    </Button>
                    <Button disabled={documents.loading !== null} startIcon={documents.loading === "label" ? <CircularProgress size={16} /> : <QrCode2 />} variant="outlined" onClick={() => documents.openDocument(pallet, "label")}>
                        {actions.label}
                    </Button>
                    <Button disabled={documents.loading !== null} startIcon={documents.loading === "transport" ? <CircularProgress size={16} /> : <FactCheckOutlined />} variant="outlined" onClick={() => documents.openDocument(pallet, "transport")}>
                        {actions.transportDocument}
                    </Button>
                    <Button disabled={documents.loading !== null} startIcon={documents.loading === "excel" ? <CircularProgress size={16} /> : <TableView />} variant="outlined" onClick={() => documents.exportExcel(pallet)}>
                        {actions.excel}
                    </Button>
                    {pallet.loadable ? (
                        <Button disabled={busy} startIcon={<QrCodeScanner />} variant="outlined" onClick={loadPalletOnTruck}>{translations.load}</Button>
                    ) : null}
                    {pallet.palletStatus === "LOADED" ? (
                        <Button
                            disabled={busy || !carrier}
                            startIcon={<Send />}
                            title={carrier ? undefined : translations.statusActions.carrierRequired}
                            variant="outlined"
                            onClick={() => changeStatus("IN_TRANSIT")}
                        >
                            {translations.statusActions.dispatch}
                        </Button>
                    ) : null}
                    {pallet.palletStatus === "IN_TRANSIT" ? (
                        <Button disabled={busy} startIcon={<CheckCircle />} variant="outlined" onClick={() => changeStatus("DELIVERED")}>
                            {translations.statusActions.markDelivered}
                        </Button>
                    ) : null}
                    {isPalletCancellable(pallet) ? (
                        <Button color="error" disabled={busy} startIcon={<Block />} variant="outlined" onClick={cancelPallet}>
                            {translations.cancel}
                        </Button>
                    ) : null}
                </nav>

                {overweight ? (
                    <Alert severity="warning">
                        {translations.weight.overweightWarning
                            .replace("{gross}", formatKg(usedWeightKg))
                            .replace("{max}", maxWeightKg !== null ? formatKg(maxWeightKg) : pl.common.dash)}
                    </Alert>
                ) : null}
                {pallet.palletStatus === "LOADED" && !carrier ? (
                    <Alert severity="info">{translations.statusActions.carrierRequired}</Alert>
                ) : null}
                {actionError ? <Alert severity="error">{actionError}</Alert> : null}
                {documents.error ? <Alert severity="error">{documents.error}</Alert> : null}
                {actionInfo ? <Alert severity="success">{actionInfo}</Alert> : null}

                <PalletSummary pallet={pallet} />

                <section className="pallet-details-grid">
                    <div className="pallet-details-column">
                        <div className="pallet-panel">
                            <div className="pallet-panel-header">
                                <div>
                                    <Typography variant="h5">{translations.items.title}</Typography>
                                    <p>{translations.items.count.replace("{count}", String(pallet.shipmentIds.length))}</p>
                                </div>
                            </div>
                            {editable ? (
                                <div className="pallet-items-toolbar">
                                    <form className="pallet-scan-form" onSubmit={addShipment}>
                                        <TextField
                                            autoComplete="off"
                                            disabled={busy}
                                            label={translations.items.inputLabel}
                                            placeholder={translations.items.placeholder}
                                            size="small"
                                            value={newShipmentNumber}
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewShipmentNumber(event.target.value)}
                                        />
                                        <Button disabled={busy} startIcon={<Add />} type="submit" variant="outlined">{translations.items.add}</Button>
                                    </form>
                                    <Button disabled={busy} startIcon={<ViewList />} onClick={() => setAddFromListOpen(true)}>
                                        {translations.items.addFromList}
                                    </Button>
                                </div>
                            ) : (
                                <p className="pallet-hint">{translations.items.locked}</p>
                            )}
                            <div className="pallet-table-wrap">
                                <table className="pallet-table">
                                    <thead>
                                        <tr>
                                            <th>{translations.items.columns.trackingNumber}</th>
                                            <th>{translations.items.columns.status}</th>
                                            <th>{translations.items.columns.recipient}</th>
                                            <th>{translations.items.columns.destination}</th>
                                            <th>{translations.items.columns.weight}</th>
                                            {editable ? <th aria-label={translations.items.columns.actions} /> : null}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsLoading ? (
                                            <tr><td className="pallet-empty" colSpan={6}>{translations.items.loading}</td></tr>
                                        ) : items.length ? items.map((item) => {
                                            const itemTrackingNumber = item.shipment?.trackingNumber?.value;
                                            return (
                                                <tr key={item.shipmentId}>
                                                    <td className="pallet-code">
                                                        {itemTrackingNumber && onOpenTab ? (
                                                            <button
                                                                className="pallet-link"
                                                                onClick={() => onOpenTab({
                                                                    label: `${pl.shipments.page.detailsTitle} ${itemTrackingNumber}`,
                                                                    path: `/shipments/tracking/${encodeURIComponent(itemTrackingNumber)}/edit`,
                                                                })}
                                                                type="button"
                                                            >
                                                                {itemTrackingNumber}
                                                            </button>
                                                        ) : itemTrackingNumber || item.shipmentId}
                                                    </td>
                                                    <td>{item.shipment ? pl.shipments.status[item.shipment.shipmentStatus] : item.error}</td>
                                                    <td>{item.shipment
                                                        ? [item.shipment.recipient?.city, [item.shipment.recipient?.firstName, item.shipment.recipient?.lastName].filter(Boolean).join(" ")].filter(Boolean).join(" · ")
                                                        : pl.common.dash}</td>
                                                    <td>{item.shipment?.destination ? departmentCodeValue(item.shipment.destination) || pl.common.dash : pl.common.dash}</td>
                                                    <td>{item.shipment?.weight ? `${item.shipment.weight.value} ${item.shipment.weight.unit}` : pl.common.dash}</td>
                                                    {editable ? (
                                                        <td className="pallet-actions-cell">
                                                            <IconButton
                                                                aria-label={translations.items.remove.replace("{trackingNumber}", itemTrackingNumber || item.shipmentId)}
                                                                disabled={busy}
                                                                size="small"
                                                                title={translations.items.remove.replace("{trackingNumber}", itemTrackingNumber || item.shipmentId)}
                                                                onClick={() => removeShipment(item)}
                                                            >
                                                                <DeleteOutline fontSize="small" />
                                                            </IconButton>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td className="pallet-empty" colSpan={6}>{translations.items.empty}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="pallet-panel">
                            <div className="pallet-panel-header">
                                <div>
                                    <Typography variant="h5">{translations.route.title}</Typography>
                                    <p>{translations.route.description}</p>
                                </div>
                            </div>
                            <PalletHistoryTimeline
                                departmentsById={departmentsById}
                                entries={history}
                                error={historyError}
                                loading={historyLoading}
                            />
                        </div>
                    </div>

                    <div className="pallet-details-column">
                        <div className="pallet-panel">
                            <Typography variant="h5">{translations.weight.title}</Typography>
                            <p className="pallet-hint">{translations.weight.autoHint}</p>
                            {utilization !== null ? (
                                <>
                                    <div aria-label={translations.weight.utilization} className="pallet-weight-meter" data-overweight={overweight} role="meter"
                                         aria-valuemin={0} aria-valuemax={100} aria-valuenow={utilization}>
                                        <span style={{width: `${utilization}%`}} />
                                    </div>
                                    <div className="pallet-weight-caption">
                                        <span>{translations.weight.utilizationValue.replace("{value}", String(utilization))}</span>
                                        {overweight ? <strong>{pl.pallets.blockReasons.OVERWEIGHT}</strong> : null}
                                    </div>
                                </>
                            ) : null}
                            <dl className="pallet-definition-list">
                                <div><dt>{translations.weight.currentGross}</dt><dd>{formatPalletWeight(pallet.grossWeight, pallet.grossWeightUnit)}</dd></div>
                                <div><dt>{translations.weight.cargo}</dt><dd>{cargoWeightKg ? formatKg(cargoWeightKg) : pl.common.dash}</dd></div>
                                <div><dt>{translations.weight.currentMax}</dt><dd>{formatPalletWeight(pallet.maxGrossWeight, pallet.maxGrossWeightUnit)}</dd></div>
                            </dl>
                            <p className="pallet-hint">{maxWeightKg !== null ? translations.weight.maxLocked : translations.weight.maxInEdit}</p>
                        </div>

                        <div className="pallet-panel">
                            <div className="pallet-panel-header">
                                <Typography variant="h5">{pl.pallets.carrier.title}</Typography>
                                {isPalletTransportEditable(pallet) ? (
                                    <Button disabled={busy} startIcon={<LocalShipping />} variant="text" onClick={() => setCarrierOpen(true)}>
                                        {carrier ? actions.changeCarrier : actions.assignCarrier}
                                    </Button>
                                ) : null}
                            </div>
                            {carrier ? (
                                <dl className="pallet-definition-list">
                                    <div><dt>{pl.pallets.carrier.carrier}</dt><dd>{carrier.carrierName}</dd></div>
                                    <div><dt>{pl.pallets.carrier.transportType}</dt><dd>{transportTypeLabel(carrier.transportType)}</dd></div>
                                    <div><dt>{pl.pallets.carrier.driver}</dt><dd>{[carrier.driverName, carrier.driverPhone].filter(Boolean).join(" · ") || pl.common.dash}</dd></div>
                                    <div><dt>{pl.pallets.carrier.vehicle}</dt><dd className="pallet-code">{[carrier.vehicleRegistrationNumber, carrier.trailerRegistrationNumber].filter(Boolean).join(" / ") || pl.common.dash}</dd></div>
                                    <div><dt>{pl.pallets.carrier.assignedAt}</dt><dd>{formatPalletDate(carrier.assignedAt)}{carrier.assignedBy ? ` · ${carrier.assignedBy}` : ""}</dd></div>
                                </dl>
                            ) : (
                                <p className="pallet-hint">{pl.pallets.carrier.none}</p>
                            )}
                            {!isPalletTransportEditable(pallet) ? <p className="pallet-hint">{pl.pallets.carrier.locked}</p> : null}
                        </div>

                        <div className="pallet-panel">
                            <div className="pallet-panel-header">
                                <Typography variant="h5">{translations.info.title}</Typography>
                                {isPalletEditable(pallet) ? (
                                    <Button disabled={busy} startIcon={<Edit />} variant="text" onClick={() => setEditOpen(true)}>{actions.edit}</Button>
                                ) : null}
                            </div>
                            <dl className="pallet-definition-list">
                                <div><dt>{translations.departments.origin}</dt><dd>{departmentById(pallet.originDepartmentId)}</dd></div>
                                <div><dt>{translations.departments.destination}</dt><dd>{departmentById(pallet.destinationDepartmentId)}</dd></div>
                                <div><dt>{pl.pallets.edit.palletType}</dt><dd>{pallet.palletType ? pl.pallets.palletType[pallet.palletType] : pl.common.dash}</dd></div>
                                <div><dt>{pl.pallets.edit.priority}</dt><dd>{pallet.handlingPriority ? pl.pallets.priority[pallet.handlingPriority] : pl.common.dash}</dd></div>
                                <div><dt>{pl.pallets.edit.refrigerated}</dt><dd>{pallet.refrigerated ? pl.pallets.edit.yes : pl.pallets.edit.no}</dd></div>
                                <div><dt>{pl.pallets.edit.dimensions}</dt><dd>{pallet.dimension ? `${pallet.dimension.length} × ${pallet.dimension.width} × ${pallet.dimension.height} cm` : pl.common.dash}</dd></div>
                                <div><dt>{translations.info.sealNumber}</dt><dd className="pallet-code">{pallet.sealNumber || pl.common.dash}</dd></div>
                                <div><dt>{translations.info.storageStatus}</dt><dd>{pallet.storageStatus ? pl.pallets.storageStatus[pallet.storageStatus as keyof typeof pl.pallets.storageStatus] || pallet.storageStatus : pl.common.dash}</dd></div>
                                <div><dt>{translations.info.palletId}</dt><dd className="pallet-code">{pallet.palletId}</dd></div>
                                <div><dt>{translations.info.created}</dt><dd>{formatPalletDate(pallet.created)}</dd></div>
                                <div><dt>{translations.info.modified}</dt><dd>{formatPalletDate(pallet.modified)}</dd></div>
                            </dl>
                        </div>

                        <div className="pallet-panel">
                            <div className="pallet-panel-header">
                                <Typography variant="h5">{translations.delivery.title}</Typography>
                                {delivery && onOpenTab ? (
                                    <Button
                                        startIcon={<LocalShipping />}
                                        variant="outlined"
                                        onClick={() => onOpenTab({
                                            label: `${pl.deliveries.detailsTitle} ${delivery.id}`,
                                            path: `/deliveries/${encodeURIComponent(delivery.id)}/edit`,
                                        })}
                                    >
                                        {translations.delivery.open}
                                    </Button>
                                ) : null}
                            </div>
                            {deliveryLoading ? (
                                <p className="pallet-hint">{translations.delivery.loading}</p>
                            ) : delivery ? (
                                <dl className="pallet-definition-list">
                                    <div><dt>{translations.delivery.id}</dt><dd className="pallet-code">{delivery.id}</dd></div>
                                    <div><dt>{translations.delivery.status}</dt><dd>{deliveryStatusLabel(delivery.deliveryStatus)}</dd></div>
                                    <div><dt>{translations.delivery.lifecycle}</dt><dd>{deliveryLifecycleLabel(delivery.lifecycleStatus)}</dd></div>
                                    <div><dt>{translations.delivery.method}</dt><dd>{deliveryMethodLabel(delivery.method)}</dd></div>
                                    <div><dt>{translations.delivery.created}</dt><dd>{formatDeliveryDateTime(delivery.createdAt)}</dd></div>
                                    <div><dt>{translations.delivery.delivered}</dt><dd>{formatDeliveryDateTime(delivery.deliveredAt)}</dd></div>
                                    <div><dt>{translations.delivery.steps}</dt><dd>{delivery.steps.length}</dd></div>
                                </dl>
                            ) : (
                                <p className="pallet-hint">{translations.delivery.empty}</p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
            <PalletAddShipmentsDialog
                open={addFromListOpen}
                pallet={pallet}
                onClose={() => setAddFromListOpen(false)}
                onAdded={(updatedPallet, addedCount) => {
                    setAddFromListOpen(false);
                    setPallet(updatedPallet);
                    setActionError(null);
                    setActionInfo(translations.addFromList.added.replace("{count}", String(addedCount)));
                }}
            />
            <PalletEditDialog
                departmentLabel={departmentLabel}
                departments={departments}
                open={editOpen}
                pallet={pallet}
                onClose={() => setEditOpen(false)}
                onSaved={(updatedPallet) => {
                    setEditOpen(false);
                    setPallet(updatedPallet);
                    setActionError(null);
                    setActionInfo(pl.pallets.edit.saved);
                }}
            />
            <PalletCarrierDialog
                open={carrierOpen}
                pallet={pallet}
                onClose={() => setCarrierOpen(false)}
                onSaved={(updatedPallet) => {
                    setCarrierOpen(false);
                    setPallet(updatedPallet);
                    setActionError(null);
                    setActionInfo(pl.pallets.carrier.saved);
                }}
            />
            {documents.dialog}
        </main>
    );
}

export default PalletDetailsView;
