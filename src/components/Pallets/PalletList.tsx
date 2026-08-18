import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
    Typography,
} from "components/ui";
import {
    ArchiveOutlined,
    Block,
    Edit,
    FactCheckOutlined,
    InfoOutlined,
    Inventory2,
    LocalShipping,
    QrCode2,
    Refresh,
    TableView,
} from "components/ui/icons";
import DepartmentService from "../../hooks/DepartmentService";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import Department from "../../class/depots/Department";
import {AppTabDefinition} from "../AppShell/types";
import {PalletDto, PalletListVariant, PalletPageDto, PalletStatusDto} from "./model/Pallet";
import PalletCarrierDialog from "./PalletCarrierDialog";
import {departmentLabel, isPalletEditable, isPalletTransportEditable} from "./PalletDetailsView";
import PalletEditDialog from "./PalletEditDialog";
import {formatPalletDate, formatPalletWeight, palletErrorMessage, palletStatusLabel, palletStatusTone} from "./palletLabels";
import {palletDetailsTab} from "./palletNavigation";
import {usePalletDocuments} from "./usePalletDocuments";
import "./styles/pallets.css";

const FETCH_SIZE = 200;
const PAGE_SIZE = 20;
const CANCELLABLE_STATUSES: PalletStatusDto[] = ["CREATED", "PREPARING", "NOT_READY", "READY"];
const ALL_STATUSES: PalletStatusDto[] = ["CREATED", "PREPARING", "NOT_READY", "READY", "LOADED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

export const isPalletCancellable = (pallet: PalletDto) => CANCELLABLE_STATUSES.includes(pallet.palletStatus);

type SortKey = "trackingNumber" | "status" | "shipments" | "grossWeight" | "origin" | "destination" | "carrier" | "modified";
type SortDirection = "asc" | "desc";
type CarrierFilter = "ALL" | "WITH" | "WITHOUT";

type PalletListProps = {
    variant: PalletListVariant;
    onOpenTab?: (tab: AppTabDefinition) => void;
};

const variantIcon: Record<PalletListVariant, React.ElementType> = {
    all: Inventory2,
    cancelled: Block,
    empty: ArchiveOutlined,
};

const weightInKilograms = (pallet: PalletDto) => {
    const value = Number(pallet.grossWeight);
    if (!Number.isFinite(value)) {
        return -1;
    }
    return pallet.grossWeightUnit === "G" ? value / 1000 : pallet.grossWeightUnit === "T" ? value * 1000 : value;
};

function PalletList({variant, onOpenTab}: PalletListProps) {
    const translations = pl.pallets.list;
    const variantTranslations = translations.variants[variant];
    const [palletPage, setPalletPage] = useState<PalletPageDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<PalletStatusDto | "ALL">("ALL");
    const [carrierFilter, setCarrierFilter] = useState<CarrierFilter>("ALL");
    const [originFilter, setOriginFilter] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("modified");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [page, setPage] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [palletToCancel, setPalletToCancel] = useState<PalletDto | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [carrierOpen, setCarrierOpen] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    const departmentsById = useMemo(
        () => new Map(departments.map((department) => [String(department.departmentId), department])),
        [departments],
    );
    const departmentById = useCallback(
        (departmentId?: number | string | null) => departmentLabel(departmentsById.get(String(departmentId ?? ""))),
        [departmentsById],
    );
    const documents = usePalletDocuments(departmentById);

    const loadPallets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await PalletService.search({variant, page: 0, size: FETCH_SIZE});
            setPalletPage(response.data);
        } catch (loadError) {
            setPalletPage(null);
            setError(palletErrorMessage(loadError, translations.loadError));
        } finally {
            setLoading(false);
        }
    }, [translations.loadError, variant]);

    useEffect(() => {
        loadPallets();
    }, [loadPallets]);

    useEffect(() => {
        DepartmentService.getAll()
            .then((response) => setDepartments(response.data))
            .catch(() => setDepartments([]));
    }, []);

    const pallets = useMemo(() => palletPage?.content || [], [palletPage]);

    const filtered = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return pallets.filter((pallet) => {
            if (statusFilter !== "ALL" && pallet.palletStatus !== statusFilter) {
                return false;
            }
            if (carrierFilter === "WITH" && !pallet.carrier) {
                return false;
            }
            if (carrierFilter === "WITHOUT" && pallet.carrier) {
                return false;
            }
            if (originFilter && String(pallet.originDepartmentId ?? "") !== originFilter) {
                return false;
            }
            if (!normalizedQuery) {
                return true;
            }
            return [
                pallet.trackingNumber,
                pallet.sealNumber,
                pallet.carrier?.carrierName,
                pallet.carrier?.vehicleRegistrationNumber,
                pallet.carrier?.driverName,
                departmentById(pallet.originDepartmentId),
                departmentById(pallet.destinationDepartmentId),
            ].some((value) => value && value.toLowerCase().includes(normalizedQuery));
        });
    }, [carrierFilter, departmentById, originFilter, pallets, query, statusFilter]);

    const sorted = useMemo(() => {
        const value = (pallet: PalletDto): string | number => {
            switch (sortKey) {
                case "trackingNumber":
                    return pallet.trackingNumber;
                case "status":
                    return palletStatusLabel(pallet.palletStatus);
                case "shipments":
                    return pallet.shipmentIds.length;
                case "grossWeight":
                    return weightInKilograms(pallet);
                case "origin":
                    return departmentById(pallet.originDepartmentId);
                case "destination":
                    return departmentById(pallet.destinationDepartmentId);
                case "carrier":
                    return pallet.carrier?.carrierName || "";
                default:
                    return pallet.modified ? new Date(pallet.modified).getTime() : 0;
            }
        };
        const direction = sortDirection === "asc" ? 1 : -1;
        return [...filtered].sort((left, right) => {
            const leftValue = value(left);
            const rightValue = value(right);
            const result = typeof leftValue === "number" && typeof rightValue === "number"
                ? leftValue - rightValue
                : String(leftValue).localeCompare(String(rightValue), pl.common.locale, {numeric: true});
            return result * direction;
        });
    }, [departmentById, filtered, sortDirection, sortKey]);

    useEffect(() => {
        setPage(0);
    }, [query, statusFilter, carrierFilter, originFilter, sortKey, sortDirection, variant]);

    const lastPage = Math.max(0, Math.ceil(sorted.length / PAGE_SIZE) - 1);
    const visible = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const selected = pallets.find((pallet) => pallet.palletId === selectedId) || null;

    const changeSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortDirection((current) => current === "asc" ? "desc" : "asc");
            return;
        }
        setSortKey(key);
        setSortDirection(key === "modified" || key === "grossWeight" || key === "shipments" ? "desc" : "asc");
    };

    const replacePallet = (updated: PalletDto) => {
        setPalletPage((current) => current ? {
            ...current,
            content: current.content.map((pallet) => pallet.palletId === updated.palletId ? updated : pallet),
        } : current);
    };

    const openDetails = (pallet: PalletDto) => onOpenTab?.(palletDetailsTab(pallet.trackingNumber));

    const cancelPallet = async () => {
        if (!palletToCancel) {
            return;
        }
        setCancelling(true);
        setCancelError(null);
        try {
            await PalletService.cancel(palletToCancel.palletId);
            setPalletToCancel(null);
            await loadPallets();
        } catch (cancelPalletError) {
            setCancelError(palletErrorMessage(cancelPalletError, translations.cancelError));
        } finally {
            setCancelling(false);
        }
    };

    const resetFilters = () => {
        setQuery("");
        setStatusFilter("ALL");
        setCarrierFilter("ALL");
        setOriginFilter("");
    };

    const Icon = variantIcon[variant];
    const columns: Array<{key: SortKey; label: string}> = [
        {key: "trackingNumber", label: translations.columns.trackingNumber},
        {key: "status", label: translations.columns.status},
        {key: "shipments", label: translations.columns.shipments},
        {key: "grossWeight", label: translations.columns.grossWeight},
        {key: "origin", label: translations.columns.origin},
        {key: "destination", label: translations.columns.destination},
        {key: "carrier", label: translations.columns.carrier},
        {key: "modified", label: translations.columns.modified},
    ];

    return (
        <main className="pallet-page">
            <div className="pallet-shell pallet-shell-wide">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><Icon /></span>
                        <div>
                            <Typography variant="h4">{variantTranslations.title}</Typography>
                            <p>{variantTranslations.subtitle}</p>
                        </div>
                    </div>
                    <div className="pallet-actions">
                        <Button disabled={!sorted.length || documents.loading !== null} startIcon={<TableView />} variant="outlined" onClick={() => documents.exportListExcel(sorted)}>
                            {translations.exportList}
                        </Button>
                        <IconButton aria-label={translations.refresh} title={translations.refresh} onClick={loadPallets}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </div>
                </section>

                {error ? <Alert severity="error">{error}</Alert> : null}
                {documents.error ? <Alert severity="error">{documents.error}</Alert> : null}
                {notice ? <Alert severity="success">{notice}</Alert> : null}

                <section className="pallet-panel">
                    <div className="pallet-filters" aria-label={translations.filters.title}>
                        <TextField
                            label={translations.filters.search}
                            placeholder={translations.filters.searchPlaceholder}
                            size="small"
                            value={query}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                        />
                        {variant === "all" ? (
                            <TextField select label={translations.filters.status} size="small" value={statusFilter} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value as PalletStatusDto | "ALL")}>
                                <MenuItem value="ALL">{pl.common.all}</MenuItem>
                                {ALL_STATUSES.map((status) => <MenuItem key={status} value={status}>{palletStatusLabel(status)}</MenuItem>)}
                            </TextField>
                        ) : null}
                        <TextField select label={translations.filters.carrier} size="small" value={carrierFilter} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setCarrierFilter(event.target.value as CarrierFilter)}>
                            <MenuItem value="ALL">{pl.common.all}</MenuItem>
                            <MenuItem value="WITH">{translations.filters.withCarrier}</MenuItem>
                            <MenuItem value="WITHOUT">{translations.filters.withoutCarrier}</MenuItem>
                        </TextField>
                        <TextField select label={translations.filters.origin} size="small" value={originFilter} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setOriginFilter(event.target.value)}>
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {departments.map((department) => (
                                <MenuItem key={department.departmentId} value={String(department.departmentId)}>{departmentLabel(department)}</MenuItem>
                            ))}
                        </TextField>
                        <Button variant="text" onClick={resetFilters}>{translations.filters.reset}</Button>
                    </div>

                    <div className="pallet-results-layout">
                        <div className="pallet-table-wrap">
                            <table className="pallet-table pallet-list-table">
                                <thead>
                                    <tr>
                                        {columns.map((column) => (
                                            <th aria-sort={sortKey === column.key ? (sortDirection === "asc" ? "ascending" : "descending") : "none"} key={column.key}>
                                                <button className="pallet-sort" type="button" onClick={() => changeSort(column.key)}>
                                                    {column.label}
                                                    <span aria-hidden="true">{sortKey === column.key ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}</span>
                                                </button>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td className="pallet-empty" colSpan={columns.length}>{translations.loading}</td></tr>
                                    ) : visible.length ? visible.map((pallet) => (
                                        <tr
                                            aria-selected={pallet.palletId === selectedId}
                                            className="pallet-row"
                                            key={pallet.palletId}
                                            tabIndex={0}
                                            onClick={() => setSelectedId(pallet.palletId)}
                                            onDoubleClick={() => openDetails(pallet)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    openDetails(pallet);
                                                } else if (event.key === " ") {
                                                    event.preventDefault();
                                                    setSelectedId(pallet.palletId);
                                                }
                                            }}
                                        >
                                            <td className="pallet-code">{pallet.trackingNumber}</td>
                                            <td><Chip color={palletStatusTone(pallet)} label={palletStatusLabel(pallet.palletStatus)} size="small" /></td>
                                            <td>{pallet.shipmentIds.length}</td>
                                            <td>{formatPalletWeight(pallet.grossWeight, pallet.grossWeightUnit)}</td>
                                            <td>{departmentById(pallet.originDepartmentId)}</td>
                                            <td>{departmentById(pallet.destinationDepartmentId)}</td>
                                            <td>{pallet.carrier ? [pallet.carrier.carrierName, pallet.carrier.vehicleRegistrationNumber].filter(Boolean).join(" · ") : pl.common.dash}</td>
                                            <td>{formatPalletDate(pallet.modified)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td className="pallet-empty" colSpan={columns.length}>{pallets.length ? translations.noMatches : variantTranslations.empty}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <aside className="pallet-selection-actions" aria-label={translations.selectedActions}>
                            <strong>{translations.selectedActions}</strong>
                            <span className="pallet-selection-id">{selected ? selected.trackingNumber : translations.selectPallet}</span>
                            <Button disabled={!selected || !onOpenTab} startIcon={<InfoOutlined />} onClick={() => selected && openDetails(selected)}>
                                {translations.actions.open}
                            </Button>
                            <Button disabled={!selected || !isPalletEditable(selected)} startIcon={<Edit />} variant="outlined" onClick={() => setEditOpen(true)}>
                                {translations.actions.edit}
                            </Button>
                            <Button disabled={!selected || !isPalletTransportEditable(selected)} startIcon={<LocalShipping />} variant="outlined" onClick={() => setCarrierOpen(true)}>
                                {translations.actions.carrier}
                            </Button>
                            <Button disabled={!selected || documents.loading !== null} startIcon={documents.loading === "excel" ? <CircularProgress size={16} /> : <TableView />} variant="outlined" onClick={() => selected && documents.exportExcel(selected)}>
                                {translations.actions.excel}
                            </Button>
                            <Button disabled={!selected || documents.loading !== null} startIcon={documents.loading === "label" ? <CircularProgress size={16} /> : <QrCode2 />} variant="outlined" onClick={() => selected && documents.openDocument(selected, "label")}>
                                {translations.actions.label}
                            </Button>
                            <Button disabled={!selected || documents.loading !== null} startIcon={documents.loading === "transport" ? <CircularProgress size={16} /> : <FactCheckOutlined />} variant="outlined" onClick={() => selected && documents.openDocument(selected, "transport")}>
                                {translations.actions.transportDocument}
                            </Button>
                            <Button color="error" disabled={!selected || !isPalletCancellable(selected)} startIcon={<Block />} variant="outlined" onClick={() => {
                                setCancelError(null);
                                setPalletToCancel(selected);
                            }}>
                                {translations.cancel}
                            </Button>
                        </aside>
                    </div>

                    <div className="pallet-pagination">
                        <span>{translations.pageSummary
                            .replace("{page}", String(page + 1))
                            .replace("{pages}", String(lastPage + 1))
                            .replace("{total}", String(sorted.length))}</span>
                        <Button disabled={page === 0 || loading} variant="outlined" onClick={() => setPage((current) => Math.max(0, current - 1))}>
                            {translations.previous}
                        </Button>
                        <Button disabled={page >= lastPage || loading} variant="outlined" onClick={() => setPage((current) => current + 1)}>
                            {translations.next}
                        </Button>
                    </div>
                </section>
            </div>

            <Dialog open={Boolean(palletToCancel)} onClose={() => !cancelling && setPalletToCancel(null)}>
                <DialogTitle>{translations.cancelDialog.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {translations.cancelDialog.description.replace("{trackingNumber}", palletToCancel?.trackingNumber || "")}
                    </DialogContentText>
                    {cancelError ? <Alert severity="error">{cancelError}</Alert> : null}
                </DialogContent>
                <DialogActions>
                    <Button disabled={cancelling} variant="outlined" onClick={() => setPalletToCancel(null)}>
                        {translations.cancelDialog.back}
                    </Button>
                    <Button color="error" disabled={cancelling} onClick={cancelPallet}>
                        {translations.cancelDialog.confirm}
                    </Button>
                </DialogActions>
            </Dialog>
            {selected ? (
                <>
                    <PalletEditDialog
                        departmentLabel={departmentLabel}
                        departments={departments}
                        open={editOpen}
                        pallet={selected}
                        onClose={() => setEditOpen(false)}
                        onSaved={(updated) => {
                            setEditOpen(false);
                            replacePallet(updated);
                            setNotice(pl.pallets.edit.saved);
                        }}
                    />
                    <PalletCarrierDialog
                        open={carrierOpen}
                        pallet={selected}
                        onClose={() => setCarrierOpen(false)}
                        onSaved={(updated) => {
                            setCarrierOpen(false);
                            replacePallet(updated);
                            setNotice(pl.pallets.carrier.saved);
                        }}
                    />
                </>
            ) : null}
            {documents.dialog}
        </main>
    );
}

export default PalletList;
