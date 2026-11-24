import React, {useEffect, useState} from "react";
import {Alert, Box, Button, Chip, CircularProgress, Typography} from "components/ui";
import {ArrowBack, History, LocalShipping, Print, Refresh, TableView} from "components/ui/icons";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {ApiResult} from "../../api/ApiResult";
import {getBackendErrorMessage} from "../../api/errorMessage";
import Department from "../../class/depots/Department";
import CarrierService from "../../hooks/CarrierService";
import CourierService from "../../hooks/CourierService";
import DeliveryService from "../../hooks/DeliveryService";
import DepartmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import {CarrierDto} from "../Carriers/model/Carrier";
import {CourierDto} from "../Couriers/dto/CourierDto";
import DeliveryChangeHistory from "./details/DeliveryChangeHistory";
import DeliveryDialogHost from "./details/DeliveryDialogHost";
import DeliveryHistoryPanel from "./details/DeliveryHistoryPanel";
import DeliveryLifecycleProgress from "./details/DeliveryLifecycleProgress";
import {DeliveryDialogState, DeliveryStepAction, isDeliveryActive} from "./details/deliveryDetails";
import DeliveryCarrierTile from "./details/tiles/DeliveryCarrierTile";
import DeliveryConditionsTile from "./details/tiles/DeliveryConditionsTile";
import DeliveryMapTile from "./details/tiles/DeliveryMapTile";
import DeliveryProofTile from "./details/tiles/DeliveryProofTile";
import DeliveryRelatedTile from "./details/tiles/DeliveryRelatedTile";
import DeliveryRouteTile from "./details/tiles/DeliveryRouteTile";
import DeliveryStatusTile from "./details/tiles/DeliveryStatusTile";
import DeliveryTargetTile from "./details/tiles/DeliveryTargetTile";
import {DeliveryCard} from "./details/tiles/DeliveryTile";
import AuditLogTimeline from "../AuditLog/AuditLogTimeline";
import {useDeliveryContext} from "./details/useDeliveryContext";
import {exportDeliveryExcel, exportDeliveryPdf} from "./deliveryExport";
import {deliveryLifecycleLabel, deliveryStatusLabel, deliveryTargetLabel} from "./deliveryLabels";
import {Delivery, DeliveryStep} from "./model/Delivery";
import "../Shipment/styles/shipments.css";
import "./styles/deliveries.css";

type DeliveryDetailTab = "overview" | "target" | "route" | "changes";

function DeliveryEdit() {
    const {deliveryId} = useParams();
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [couriers, setCouriers] = useState<CourierDto[]>([]);
    const [carriers, setCarriers] = useState<CarrierDto[]>([]);
    const [searchParams] = useSearchParams();
    const [dialog, setDialog] = useState<DeliveryDialogState | null>(
        () => searchParams.get("dialog") === "route" ? {kind: "route"} : null);
    const [activeTab, setActiveTab] = useState<DeliveryDetailTab>(
        () => searchParams.get("dialog") === "route" ? "route" : "overview");
    const context = useDeliveryContext(delivery);
    const detailTabs: Array<[DeliveryDetailTab, string]> = [
        ["overview", pl.shipments.detailTabs.overview],
        ["target", pl.deliveries.destinationCardTitle],
        ["route", pl.deliveries.details.routeTitle],
        ["changes", pl.deliveries.details.changeHistoryTitle],
    ];

    useEffect(() => {
        let active = true;
        DepartmentService.getAll()
            .then((response) => {
                if (active) {
                    setDepartments(Array.isArray(response.data) ? response.data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setDepartments([]);
                }
            });
        CourierService.getAll()
            .then((response) => {
                if (active) {
                    setCouriers(Array.isArray(response.data) ? response.data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setCouriers([]);
                }
            });
        CarrierService.findAll(false)
            .then((response) => {
                if (active) {
                    setCarriers(Array.isArray(response.data) ? response.data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setCarriers([]);
                }
            });
        return () => {active = false;};
    }, []);

    useEffect(() => {
        let active = true;
        if (!deliveryId) {
            setLoading(false);
            setError(pl.deliveries.loadDetailsError);
            return;
        }
        setLoading(true);
        setError(null);
        DeliveryService.get(deliveryId)
            .then((response) => {
                if (active) {
                    setDelivery(response.data);
                }
            })
            .catch((loadError) => {
                if (active) {
                    setDelivery(null);
                    setError(getBackendErrorMessage(loadError, pl.deliveries.loadDetailsError));
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => {active = false;};
    }, [deliveryId, reloadKey]);

    const runOperation = async (operation: () => Promise<ApiResult<Delivery | void>>) => {
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            const response = await operation();
            if (response.data) {
                setDelivery(response.data);
            } else {
                setReloadKey((current) => current + 1);
            }
            setDialog(null);
            setNotice(pl.deliveries.saveSuccess);
        } catch (operationError) {
            setError(getBackendErrorMessage(operationError, pl.deliveries.saveError));
        } finally {
            setBusy(false);
        }
    };

    const runExport = async (exporter: (value: Delivery, values: Department[]) => Promise<void>) => {
        if (!delivery) {
            return;
        }
        setError(null);
        try {
            await exporter(delivery, departments);
        } catch {
            setError(pl.deliveries.exportError);
        }
    };

    const locked = busy || !delivery || !isDeliveryActive(delivery);

    const openStepAction = (action: DeliveryStepAction, step: DeliveryStep) => setDialog({kind: action, step});

    const statusClass = `tm-status tm-status-${String(delivery?.deliveryStatus || "unknown").toLowerCase()}`;

    return (
        <div className="shipments-page shipment-cc-page dlv-detail-page">
            <div className="shipments-shell shipment-cc-shell">
                <div className="shipments-header">
                    <div className="shipments-title">
                        <span className="shipments-title-icon"><LocalShipping/></span>
                        <Box>
                            <span className="shipment-cc-kicker">{pl.deliveries.detailsTitle}</span>
                            <div className="shipment-cc-title-row">
                                <Typography variant="h4">{delivery?.id || deliveryId}</Typography>
                                {delivery && <Chip className={statusClass} size="small"
                                                   label={deliveryStatusLabel(delivery.deliveryStatus)}/>}
                            </div>
                            {delivery && <Typography variant="body2" color="text.secondary">
                                {`${deliveryTargetLabel(delivery.targetType)} · ${deliveryLifecycleLabel(delivery.lifecycleStatus)}`}
                            </Typography>}
                        </Box>
                    </div>
                    <div className="shipment-edit-header-actions" role="group"
                         aria-label={pl.deliveries.details.operationsTitle}>
                        <Button variant="outlined" startIcon={<ArrowBack/>} onClick={() => navigate("/deliveries")}>{pl.deliveries.backToList}</Button>
                        <Button variant="outlined" startIcon={<Refresh/>} disabled={loading || busy}
                                onClick={() => setReloadKey((current) => current + 1)}>{pl.common.refresh}</Button>
                        <Button variant="outlined" startIcon={<Print/>} disabled={loading || busy || !delivery}
                                onClick={() => runExport(exportDeliveryPdf)}>{pl.deliveries.exportPdf}</Button>
                        <Button variant="outlined" startIcon={<TableView/>} disabled={loading || busy || !delivery}
                                onClick={() => runExport(exportDeliveryExcel)}>{pl.deliveries.exportExcel}</Button>
                    </div>
                </div>
                {error && <Alert severity="error">{error}</Alert>}
                {notice && <Alert severity="success">{notice}</Alert>}
                {delivery && !loading && !isDeliveryActive(delivery)
                    && <Alert severity="info">{pl.deliveries.details.lockedHint}</Alert>}
                {loading ? (
                    <div className="shipments-panel shipment-edit-loader">
                        <CircularProgress size={30}/>
                        <span>{pl.deliveries.loadingDetails}</span>
                    </div>
                ) : delivery && (
                    <>
                        <DeliveryLifecycleProgress delivery={delivery}/>
                        <div className="shipment-detail-tabs" role="tablist" aria-label={pl.deliveries.detailsTitle}>
                            {detailTabs.map(([value, label]) => (
                                <button key={value} type="button" role="tab" aria-selected={activeTab === value}
                                        className={activeTab === value ? "shipment-detail-tab-active" : ""}
                                        onClick={() => setActiveTab(value)}>{label}</button>
                            ))}
                        </div>
                        <div className="dlv-detail-layout">
                            <main className="dlv-detail-main" aria-label={pl.deliveries.informationTitle}>
                                {activeTab === "overview" && <>
                                    <DeliveryStatusTile delivery={delivery} editDisabled={locked} onOpen={setDialog}/>
                                    <DeliveryConditionsTile delivery={delivery} editDisabled={locked}
                                                            onEdit={() => setDialog({kind: "conditions"})}/>
                                    <DeliveryCarrierTile delivery={delivery} couriers={couriers} carriers={carriers}
                                                         editDisabled={locked} onEdit={() => setDialog({kind: "carrier"})}/>
                                    <DeliveryProofTile delivery={delivery} signature={context.signature}/>
                                </>}
                                {activeTab === "target" && <>
                                    <DeliveryTargetTile delivery={delivery} shipment={context.shipment}/>
                                    <DeliveryRelatedTile relations={context.relations}/>
                                </>}
                                {activeTab === "route" && <>
                                    <DeliveryRouteTile delivery={delivery} departments={departments}
                                                       pickupPoints={context.pickupPoints} editDisabled={locked}
                                                       onEdit={() => setDialog({kind: "route"})}/>
                                    <DeliveryMapTile delivery={delivery} departments={departments}
                                                     pickupPoints={context.pickupPoints}/>
                                </>}
                                {activeTab === "changes" && <>
                                    <section className="shipment-dashboard-card dlv-detail-card dlv-detail-card-wide"
                                             aria-label={pl.deliveries.details.changeHistoryTitle}>
                                        <div className="shipment-dashboard-card-header">
                                            <div className="shipment-dashboard-card-title">
                                                <span><History fontSize="small"/></span>
                                                <Typography variant="h6">{pl.deliveries.details.changeHistoryTitle}</Typography>
                                            </div>
                                        </div>
                                        <div className="dlv-detail-card-body">
                                            <DeliveryChangeHistory history={context.history} departments={departments}
                                                                   couriers={couriers} pickupPoints={context.pickupPoints}/>
                                        </div>
                                    </section>
                                    <DeliveryCard wide title={pl.auditLog.title}>
                                        <div className="dlv-detail-card-body">
                                            <AuditLogTimeline
                                                departmentLabel={(departmentId) => departments.find((department) =>
                                                    department.departmentId === departmentId)?.departmentCode?.value
                                                    || String(departmentId)}
                                                reloadKey={reloadKey}
                                                resourceId={delivery.id}
                                                resourceType="DELIVERY"
                                            />
                                        </div>
                                    </DeliveryCard>
                                </>}
                            </main>
                            <aside className="dlv-detail-rail">
                                <DeliveryHistoryPanel delivery={delivery} departments={departments} couriers={couriers}
                                                      busy={busy} onStepAction={openStepAction}/>
                            </aside>
                        </div>
                        <DeliveryDialogHost dialog={dialog} delivery={delivery} departments={departments}
                                            couriers={couriers} carriers={carriers} pickupPoints={context.pickupPoints} busy={busy}
                                            onClose={() => setDialog(null)}
                                            onRun={runOperation}/>
                    </>
                )}
            </div>
        </div>
    );
}

export default DeliveryEdit;
