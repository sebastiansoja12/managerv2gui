import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, MenuItem, TextField, Typography} from "components/ui";
import {ArrowBack, LocalShipping, Refresh, Save} from "components/ui/icons";
import {Link, useNavigate, useParams} from "react-router-dom";
import {getBackendErrorMessage} from "../../api/errorMessage";
import DeliveryService from "../../hooks/DeliveryService";
import pl from "../../i18n/translate";
import {
    deliveryLifecycleLabel,
    deliveryMethodLabel,
    deliveryOutcomeLabel,
    deliveryStatusLabel,
    deliveryTargetLabel,
    deliveryTypeLabel,
    formatDeliveryDateTime,
} from "./deliveryLabels";
import {Delivery} from "./model/Delivery";
import "./styles/deliveries.css";

const deliveryMethods = ["COURIER", "PICKUP_POINT", "LOCKER"] as const;

function DeliveryEdit() {
    const {deliveryId} = useParams();
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [method, setMethod] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;
        if (!deliveryId) {
            setLoading(false);
            setError(pl.deliveries.loadDetailsError);
            return;
        }
        setLoading(true);
        setError(null);
        setNotice(null);
        DeliveryService.get(deliveryId)
            .then((response) => {
                if (active) {
                    setDelivery(response.data);
                    setMethod(response.data.method || "");
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

    const saveMethod = async () => {
        if (!delivery || !method) {
            setError(pl.deliveries.methodRequired);
            return;
        }
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const response = await DeliveryService.changeMethod(delivery.id, method);
            setDelivery(response.data);
            setMethod(response.data.method || "");
            setNotice(pl.deliveries.saveSuccess);
        } catch (saveError) {
            setError(getBackendErrorMessage(saveError, pl.deliveries.saveError));
        } finally {
            setSaving(false);
        }
    };

    const canEdit = delivery && delivery.lifecycleStatus !== "CANCELED" && delivery.lifecycleStatus !== "COMPLETED";

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
                        <Button variant="outlined" startIcon={<Refresh/>} disabled={loading || saving}
                                onClick={() => setReloadKey((current) => current + 1)}>{pl.common.refresh}</Button>
                    </div>
                </header>
                {error && <Alert severity="error">{error}</Alert>}
                {notice && <Alert severity="success">{notice}</Alert>}
                {loading ? <div className="deliveries-state"><CircularProgress size={24}/>{pl.deliveries.loadingDetails}</div> : delivery && (
                    <div className="deliveries-detail-layout">
                        <div className="deliveries-detail-main">
                            <section className="deliveries-card" aria-label={pl.deliveries.informationTitle}>
                                <Typography variant="h6">{pl.deliveries.informationTitle}</Typography>
                                <div className="deliveries-info-grid">
                                    <article className="deliveries-info-tile">
                                        <h3>{pl.deliveries.deliveryCardTitle}</h3>
                                        <dl className="deliveries-metadata">
                                            <div><dt>{pl.deliveries.columns.id}</dt><dd>{delivery.id}</dd></div>
                                            <div><dt>{pl.deliveries.columns.type}</dt><dd>{deliveryTypeLabel(delivery.type)}</dd></div>
                                            <div><dt>{pl.deliveries.columns.status}</dt><dd>{deliveryStatusLabel(delivery.deliveryStatus)}</dd></div>
                                            <div><dt>{pl.deliveries.lifecycleLabel}</dt><dd>{deliveryLifecycleLabel(delivery.lifecycleStatus)}</dd></div>
                                        </dl>
                                    </article>
                                    <article className="deliveries-info-tile">
                                        <h3>{pl.deliveries.destinationCardTitle}</h3>
                                        <dl className="deliveries-metadata">
                                            <div><dt>{pl.deliveries.columns.target}</dt><dd>{deliveryTargetLabel(delivery.targetType)} · {delivery.targetId}</dd></div>
                                            <div><dt>{pl.deliveries.columns.shipment}</dt><dd>{delivery.shipmentId
                                                ? <Link className="deliveries-shipment-link" to={`/shipments/${encodeURIComponent(delivery.shipmentId)}/edit`}>
                                                    {delivery.shipmentId} ↗</Link> : pl.common.dash}</dd></div>
                                            <div><dt>{pl.deliveries.methodLabel}</dt><dd>{deliveryMethodLabel(delivery.method)}</dd></div>
                                        </dl>
                                    </article>
                                    <article className="deliveries-info-tile">
                                        <h3>{pl.deliveries.timeCardTitle}</h3>
                                        <dl className="deliveries-metadata">
                                            <div><dt>{pl.deliveries.columns.created}</dt><dd>{formatDeliveryDateTime(delivery.createdAt)}</dd></div>
                                            <div><dt>{pl.deliveries.plannedLabel}</dt><dd>{formatDeliveryDateTime(delivery.plannedAt)}</dd></div>
                                            <div><dt>{pl.deliveries.deliveredLabel}</dt><dd>{formatDeliveryDateTime(delivery.deliveredAt)}</dd></div>
                                            <div><dt>{pl.deliveries.columns.steps}</dt><dd>{delivery.steps.length}</dd></div>
                                        </dl>
                                    </article>
                                </div>
                            </section>
                            {canEdit && <section className="deliveries-card" aria-label={pl.deliveries.editTitle}>
                                <Typography variant="h6">{pl.deliveries.editTitle}</Typography>
                                <div className="deliveries-edit-controls">
                                <TextField select size="small" label={pl.deliveries.methodLabel} value={method}
                                           onChange={(event) => setMethod(event.target.value)}>
                                    {deliveryMethods.map((value) => <MenuItem key={value} value={value}>{deliveryMethodLabel(value)}</MenuItem>)}
                                </TextField>
                                <Button variant="contained" startIcon={<Save/>} disabled={saving || !method || method === delivery.method}
                                        onClick={saveMethod}>{pl.deliveries.save}</Button>
                                </div>
                            </section>}
                        </div>
                        <section className="deliveries-card deliveries-history-card" aria-label={pl.deliveries.historyTitle}>
                            <Typography variant="h6">{pl.deliveries.historyTitle}</Typography>
                            {delivery.steps.length === 0 ? <div className="deliveries-state">{pl.deliveries.noSteps}</div> : (
                                <ol className="deliveries-timeline">
                                    {[...delivery.steps].sort((left, right) => left.stepNumber - right.stepNumber).map((step) => (
                                        <li key={step.stepNumber}>
                                            <span className="deliveries-step-number">{step.stepNumber}</span>
                                            <div>
                                                <strong>{deliveryStatusLabel(step.deliveryStatus)}</strong>
                                                <p>{deliveryOutcomeLabel(step.outcome)}</p>
                                                <dl className="deliveries-attempt-details">
                                                    <div><dt>{pl.deliveries.userLabel}</dt><dd>{step.userId || pl.common.dash}</dd></div>
                                                    <div><dt>{pl.deliveries.departmentLabel}</dt><dd>{step.departmentId || pl.common.dash}</dd></div>
                                                    <div><dt>{pl.deliveries.courierLabel}</dt><dd>{step.supplierId || pl.common.dash}</dd></div>
                                                    <div><dt>{pl.deliveries.attemptDateLabel}</dt><dd>{formatDeliveryDateTime(step.attemptedAt)}</dd></div>
                                                </dl>
                                                {(step.method || step.vehicleId) && <p>{deliveryMethodLabel(step.method || delivery.method)}{step.vehicleId ? ` · ${pl.deliveries.vehicleLabel}: ${step.vehicleId}` : ""}</p>}
                                                {step.comment && <p>{step.comment}</p>}
                                                {step.failureReason && step.failureReason !== step.comment && <p>{step.failureReason}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DeliveryEdit;
