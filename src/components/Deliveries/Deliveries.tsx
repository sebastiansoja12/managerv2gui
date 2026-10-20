import React, {useCallback, useEffect, useState} from "react";
import {Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField,
    Typography} from "components/ui";
import {LocalShipping, Refresh} from "components/ui/icons";
import {useNavigate} from "react-router-dom";
import {getBackendErrorMessage} from "../../api/errorMessage";
import Department from "../../class/depots/Department";
import DeliveryService from "../../hooks/DeliveryService";
import DepartmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import DeliveryFilters from "./list/DeliveryFilters";
import DeliveryTable from "./list/DeliveryTable";
import {
    defaultDeliveryListFilters,
    defaultDeliveryListSort,
    DeliveryListFilters,
    DeliveryListSort,
    deliveryPageSizes,
    toggleSort,
} from "./list/deliveryListModel";
import {DeliveryListItem, DeliverySortField} from "./model/Delivery";
import {exportDeliveryExcel, exportDeliveryPdf} from "./deliveryExport";
import "./styles/deliveries.css";

function Deliveries() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState<number>(25);
    const [filters, setFilters] = useState<DeliveryListFilters>(defaultDeliveryListFilters);
    const [sort, setSort] = useState<DeliveryListSort>(defaultDeliveryListSort);
    const [reloadKey, setReloadKey] = useState(0);
    const [deliveries, setDeliveries] = useState<DeliveryListItem[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [deliveryToCancel, setDeliveryToCancel] = useState<DeliveryListItem | null>(null);
    const [canceling, setCanceling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const changeFilters = useCallback((next: DeliveryListFilters) => {
        setFilters(next);
        setPage(0);
    }, []);

    const changeSort = (field: DeliverySortField) => {
        setSort((current) => toggleSort(current, field));
        setPage(0);
    };

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
        return () => {active = false;};
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        DeliveryService.query(page, pageSize, {...filters, sort: sort.field, direction: sort.direction})
            .then((response) => {
                if (!active) {
                    return;
                }
                setDeliveries(response.data.items);
                setHasNextPage(response.data.hasNext);
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
        return () => {active = false;};
    }, [filters, page, pageSize, reloadKey, sort]);

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

    const exportDelivery = async (delivery: DeliveryListItem, format: "excel" | "pdf") => {
        setExporting(true);
        setExportError(null);
        try {
            const response = await DeliveryService.get(delivery.id);
            if (format === "excel") {
                await exportDeliveryExcel(response.data, departments);
            } else {
                await exportDeliveryPdf(response.data, departments);
            }
        } catch (failure) {
            setExportError(getBackendErrorMessage(failure, pl.deliveries.exportError));
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="deliveries-page">
            <div className="deliveries-shell">
                <header className="deliveries-header">
                    <div className="deliveries-title">
                        <span className="deliveries-title-icon"><LocalShipping/></span>
                        <div>
                            <Typography variant="h4">{pl.deliveries.title}</Typography>
                            <Typography variant="body2">{pl.deliveries.subtitle}</Typography>
                        </div>
                    </div>
                    <Button variant="outlined" startIcon={<Refresh/>} disabled={loading}
                            onClick={() => setReloadKey((current) => current + 1)}>
                        {pl.common.refresh}
                    </Button>
                </header>

                <section className="deliveries-card" aria-label={pl.deliveries.listTitle}>
                    <div className="deliveries-card-heading">
                        <Typography variant="h6">{pl.deliveries.listTitle}</Typography>
                        <div className="deliveries-list-meta">
                            <span>{pl.deliveries.page.replace("{page}", String(page + 1))}</span>
                            <TextField select size="small" label={pl.deliveries.filters.pageSize} value={String(pageSize)}
                                       onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                                           setPageSize(Number(event.target.value));
                                           setPage(0);
                                       }}>
                                {deliveryPageSizes.map((size) => <MenuItem key={size} value={String(size)}>{size}</MenuItem>)}
                            </TextField>
                        </div>
                    </div>
                    <DeliveryFilters filters={filters} departments={departments} onChange={changeFilters}/>
                    {exportError && <Alert severity="error">{exportError}</Alert>}
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
                        <DeliveryTable deliveries={deliveries} departments={departments} sort={sort} busy={exporting}
                                       onSort={changeSort}
                                       onOpen={(delivery) => navigate(`/deliveries/${encodeURIComponent(delivery.id)}/edit`)}
                                       onExport={exportDelivery}
                                       onCancel={(delivery) => {
                                           setCancelError(null);
                                           setDeliveryToCancel(delivery);
                                       }}/>
                    ) : null}
                    <div className="deliveries-pagination">
                        <Button variant="outlined" disabled={loading || page === 0}
                                onClick={() => setPage((current) => current - 1)}>{pl.deliveries.previous}</Button>
                        <Button variant="outlined" disabled={loading || !hasNextPage}
                                onClick={() => setPage((current) => current + 1)}>{pl.deliveries.next}</Button>
                    </div>
                </section>

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
