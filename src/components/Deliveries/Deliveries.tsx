import React, {useEffect, useState} from "react";
import {Alert, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "components/ui";
import {Close, Download, Edit, LocalShipping, Refresh} from "components/ui/icons";
import {useNavigate} from "react-router-dom";
import {getBackendErrorMessage} from "../../api/errorMessage";
import DeliveryService from "../../hooks/DeliveryService";
import pl from "../../i18n/translate";
import {Delivery} from "./model/Delivery";
import {exportDeliveryExcel, exportDeliveryPdf} from "./deliveryExport";
import {deliveryStatusLabel, deliveryTargetLabel, deliveryTypeLabel, formatDeliveryDateTime} from "./deliveryLabels";
import "./styles/deliveries.css";

const PAGE_SIZE = 25;

function Deliveries() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [reloadKey, setReloadKey] = useState(0);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [deliveryToCancel, setDeliveryToCancel] = useState<Delivery | null>(null);
    const [canceling, setCanceling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const selectedDelivery = deliveries.find((delivery) => delivery.id === selectedId) || null;

    const cancelDelivery = async () => {
        if (!deliveryToCancel) {
            return;
        }
        setCanceling(true);
        setCancelError(null);
        try {
            await DeliveryService.cancel(deliveryToCancel.id);
            setDeliveryToCancel(null);
            setReloadKey((current) => current + 1);
        } catch (cancelFailure) {
            setCancelError(getBackendErrorMessage(cancelFailure, pl.deliveries.cancelError));
        } finally {
            setCanceling(false);
        }
    };

    const exportSelected = async (format: "excel" | "pdf") => {
        if (!selectedDelivery) return;
        setExporting(true);
        setExportError(null);
        try {
            const response = await DeliveryService.get(selectedDelivery.id);
            if (format === "excel") {
                await exportDeliveryExcel(response.data);
            } else {
                await exportDeliveryPdf(response.data);
            }
        } catch (failure) {
            setExportError(getBackendErrorMessage(failure, pl.deliveries.exportError));
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        DeliveryService.getRecent(page * PAGE_SIZE, PAGE_SIZE + 1)
            .then((response) => {
                if (!active) {
                    return;
                }
                const visibleDeliveries = response.data.slice(0, PAGE_SIZE);
                setDeliveries(visibleDeliveries);
                setSelectedId((current) => visibleDeliveries.some((delivery) => delivery.id === current) ? current : null);
                setHasNextPage(response.data.length > PAGE_SIZE);
            })
            .catch((loadError) => {
                if (active) {
                    setError(getBackendErrorMessage(loadError, pl.deliveries.loadError));
                    setDeliveries([]);
                    setHasNextPage(false);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [page, reloadKey]);

    return (
        <div className="deliveries-page">
            <div className="deliveries-shell">
                <header className="deliveries-header">
                    <div className="deliveries-title">
                        <span className="deliveries-title-icon"><LocalShipping /></span>
                        <div>
                            <Typography variant="h4">{pl.deliveries.title}</Typography>
                            <Typography variant="body2">{pl.deliveries.subtitle}</Typography>
                        </div>
                    </div>
                    <Button variant="outlined" startIcon={<Refresh />} disabled={loading}
                            onClick={() => setReloadKey((current) => current + 1)}>
                        {pl.common.refresh}
                    </Button>
                </header>

                <div className="deliveries-overview">
                <section className="deliveries-card" aria-label={pl.deliveries.listTitle}>
                    <div className="deliveries-card-heading">
                        <Typography variant="h6">{pl.deliveries.listTitle}</Typography>
                        <span>{pl.deliveries.page.replace("{page}", String(page + 1))}</span>
                    </div>
                    {error && <Alert severity="error" action={
                        <Button variant="text" onClick={() => setReloadKey((current) => current + 1)}>
                            {pl.deliveries.retry}
                        </Button>
                    }>{error}</Alert>}
                    {loading ? (
                        <div className="deliveries-state"><CircularProgress size={24}/>{pl.deliveries.loading}</div>
                    ) : !error && deliveries.length === 0 ? (
                        <div className="deliveries-state">{pl.deliveries.empty}</div>
                    ) : !error ? (
                        <div className="deliveries-table-wrap">
                            <table className="deliveries-table">
                                <thead>
                                <tr>
                                    <th className="deliveries-selection-column"><span className="visually-hidden">{pl.deliveries.selectDelivery}</span></th>
                                    <th>{pl.deliveries.columns.id}</th>
                                    <th>{pl.deliveries.columns.shipment}</th>
                                    <th>{pl.deliveries.columns.target}</th>
                                    <th>{pl.deliveries.columns.type}</th>
                                    <th>{pl.deliveries.columns.status}</th>
                                    <th>{pl.deliveries.columns.created}</th>
                                    <th>{pl.deliveries.columns.steps}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {deliveries.map((delivery) => (
                                    <tr key={delivery.id} className={selectedId === delivery.id ? "is-selected" : ""}
                                        onClick={() => setSelectedId(delivery.id)}>
                                        <td><input type="radio" name="selected-delivery" checked={selectedId === delivery.id}
                                                   aria-label={`${pl.deliveries.selectDelivery} ${delivery.id}`}
                                                   onChange={() => setSelectedId(delivery.id)}/></td>
                                        <td className="deliveries-id" title={delivery.id}>{delivery.id}</td>
                                        <td>{delivery.shipmentId || pl.common.dash}</td>
                                        <td>{deliveryTargetLabel(delivery.targetType)} · {delivery.targetId}</td>
                                        <td>{deliveryTypeLabel(delivery.type)}</td>
                                        <td><Chip size="small" label={delivery.lifecycleStatus === "CANCELED"
                                            ? pl.deliveries.lifecycle.CANCELED : deliveryStatusLabel(delivery.deliveryStatus)}/></td>
                                        <td>{formatDeliveryDateTime(delivery.createdAt)}</td>
                                        <td>{delivery.steps.length}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                    <div className="deliveries-pagination">
                        <Button variant="outlined" disabled={loading || page === 0}
                                onClick={() => setPage((current) => current - 1)}>{pl.deliveries.previous}</Button>
                        <Button variant="outlined" disabled={loading || !hasNextPage}
                                onClick={() => setPage((current) => current + 1)}>{pl.deliveries.next}</Button>
                    </div>
                </section>
                <aside className="deliveries-action-panel" aria-label={pl.deliveries.actionsTitle}>
                    <Typography variant="h6">{pl.deliveries.actionsTitle}</Typography>
                    <p>{selectedDelivery ? `${pl.deliveries.selectedDelivery}: ${selectedDelivery.id}` : pl.deliveries.selectHint}</p>
                    {exportError && <Alert severity="error">{exportError}</Alert>}
                    <Button variant="outlined" startIcon={<Edit/>} disabled={!selectedDelivery || exporting}
                            onClick={() => selectedDelivery && navigate(`/deliveries/${encodeURIComponent(selectedDelivery.id)}/edit`)}>
                        {pl.deliveries.edit}</Button>
                    <Button variant="outlined" color="error" startIcon={<Close/>}
                            disabled={!selectedDelivery || exporting || selectedDelivery.lifecycleStatus === "CANCELED" || selectedDelivery.lifecycleStatus === "COMPLETED"}
                            onClick={() => {setCancelError(null); setDeliveryToCancel(selectedDelivery);}}>
                        {pl.deliveries.cancel}</Button>
                    <div className="deliveries-action-divider"/>
                    <Button variant="outlined" startIcon={<Download/>} disabled={!selectedDelivery || exporting}
                            onClick={() => exportSelected("excel")}>{pl.deliveries.exportExcel}</Button>
                    <Button variant="outlined" startIcon={<Download/>} disabled={!selectedDelivery || exporting}
                            onClick={() => exportSelected("pdf")}>{pl.deliveries.exportPdf}</Button>
                </aside>
                </div>

                <Dialog open={Boolean(deliveryToCancel)} onClose={() => !canceling && setDeliveryToCancel(null)}>
                    <DialogTitle>{pl.deliveries.cancelTitle}</DialogTitle>
                    <DialogContent>
                        <Typography>{pl.deliveries.cancelConfirmation.replace("{id}", deliveryToCancel?.id || "")}</Typography>
                        {cancelError && <Alert severity="error">{cancelError}</Alert>}
                    </DialogContent>
                    <DialogActions>
                        <Button disabled={canceling} onClick={() => setDeliveryToCancel(null)}>{pl.deliveries.back}</Button>
                        <Button color="error" variant="contained" disabled={canceling} onClick={cancelDelivery}>
                            {pl.deliveries.cancel}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    );
}

export default Deliveries;
