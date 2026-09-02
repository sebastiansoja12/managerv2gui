import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, Typography} from "components/ui";
import {ArrowBack, LocalShipping, Refresh} from "components/ui/icons";
import {useNavigate, useParams} from "react-router-dom";
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
import DeliveryDialogHost from "./details/DeliveryDialogHost";
import DeliveryHistoryPanel from "./details/DeliveryHistoryPanel";
import DeliveryLifecycleProgress from "./details/DeliveryLifecycleProgress";
import DeliveryOperationsToolbar from "./details/DeliveryOperationsToolbar";
import {DeliveryDialogState, DeliveryStepAction, isDeliveryActive} from "./details/deliveryDetails";
import DeliveryCarrierTile from "./details/tiles/DeliveryCarrierTile";
import DeliveryConditionsTile from "./details/tiles/DeliveryConditionsTile";
import DeliveryMapTile from "./details/tiles/DeliveryMapTile";
import DeliveryProofTile from "./details/tiles/DeliveryProofTile";
import DeliveryRelatedTile from "./details/tiles/DeliveryRelatedTile";
import DeliveryRouteTile from "./details/tiles/DeliveryRouteTile";
import DeliveryStatusTile from "./details/tiles/DeliveryStatusTile";
import DeliveryTargetTile from "./details/tiles/DeliveryTargetTile";
import {useDeliveryContext} from "./details/useDeliveryContext";
import {exportDeliveryExcel, exportDeliveryPdf} from "./deliveryExport";
import {Delivery, DeliveryStep} from "./model/Delivery";
import "./styles/deliveries.css";

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
    const [dialog, setDialog] = useState<DeliveryDialogState | null>(null);
    const context = useDeliveryContext(delivery);

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

    return (
        <div className="deliveries-page">
            <div className="deliveries-shell">
                <header className="deliveries-header">
                    <div className="deliveries-title">
                        <span className="deliveries-title-icon"><LocalShipping/></span>
                        <div>
                            <Typography variant="h4">{pl.deliveries.detailsTitle}</Typography>
                            <Typography variant="body2">{delivery?.id || deliveryId}</Typography>
                        </div>
                    </div>
                    <div className="deliveries-header-actions">
                        <Button variant="outlined" startIcon={<ArrowBack/>} onClick={() => navigate("/deliveries")}>{pl.deliveries.backToList}</Button>
                        <Button variant="outlined" startIcon={<Refresh/>} disabled={loading || busy}
                                onClick={() => setReloadKey((current) => current + 1)}>{pl.common.refresh}</Button>
                    </div>
                </header>
                {error && <Alert severity="error">{error}</Alert>}
                {notice && <Alert severity="success">{notice}</Alert>}
                {loading ? <div className="deliveries-state"><CircularProgress size={24}/>{pl.deliveries.loadingDetails}</div> : delivery && (
                    <>
                        <DeliveryOperationsToolbar delivery={delivery} busy={busy}
                                                   onExportPdf={() => runExport(exportDeliveryPdf)}
                                                   onExportExcel={() => runExport(exportDeliveryExcel)}/>
                        <DeliveryLifecycleProgress delivery={delivery}/>
                        <div className="deliveries-detail-split">
                            <section className="deliveries-dashboard" aria-label={pl.deliveries.informationTitle}>
                                <div className="deliveries-cell">
                                    <DeliveryStatusTile delivery={delivery} editDisabled={locked} onOpen={setDialog}/>
                                </div>
                                <div className="deliveries-cell">
                                    <DeliveryTargetTile delivery={delivery} shipment={context.shipment}/>
                                </div>
                                <div className="deliveries-cell">
                                    <DeliveryCarrierTile delivery={delivery} couriers={couriers} carriers={carriers} editDisabled={locked}
                                                         onEdit={() => setDialog({kind: "carrier"})}/>
                                </div>
                                <div className="deliveries-cell">
                                    <DeliveryRouteTile delivery={delivery} departments={departments}
                                                       pickupPoints={context.pickupPoints} editDisabled={locked}
                                                       onEdit={() => setDialog({kind: "route"})}/>
                                </div>
                                <div className="deliveries-cell">
                                    <DeliveryConditionsTile delivery={delivery} editDisabled={locked}
                                                            onEdit={() => setDialog({kind: "conditions"})}/>
                                </div>
                                <div className="deliveries-cell">
                                    <DeliveryProofTile delivery={delivery} signature={context.shipment?.signature || null}/>
                                </div>
                                <div className="deliveries-cell deliveries-cell-full">
                                    <DeliveryMapTile delivery={delivery} departments={departments}
                                                     pickupPoints={context.pickupPoints}/>
                                </div>
                                <div className="deliveries-cell deliveries-cell-full">
                                    <DeliveryRelatedTile relations={context.relations}/>
                                </div>
                            </section>
                            <aside className="deliveries-history-aside">
                                <DeliveryHistoryPanel delivery={delivery} history={context.history}
                                                      departments={departments} couriers={couriers}
                                                      pickupPoints={context.pickupPoints} busy={busy}
                                                      onStepAction={openStepAction}/>
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
