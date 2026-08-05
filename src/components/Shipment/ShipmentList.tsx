import React, {ChangeEvent, useEffect, useMemo, useRef, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "components/ui";
import {
    AccessTime,
    Add,
    AttachMoney,
    FilterList,
    InfoOutlined,
    Person,
    Print,
    QrCode2,
    Route,
    TableView,
} from "components/ui/icons";
import {Link, useNavigate} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import DocumentService from "../../hooks/DocumentService";
import TrackingService from "../../hooks/TrackingService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {
    ExternalTrackingResult,
    TrackingProvider,
    TrackingProviderId,
} from "../GlobalConfiguration/model/TrackingIntegration";
import {
    departmentCodeValue,
    shipmentPriorities,
    ShipmentDto,
    ShipmentPriorityDto,
    ShipmentSearchRequestApi,
    ShipmentStatusDto,
} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {exportShipmentExcel} from "./shipmentExcelExport";
import "./styles/shipments.css";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

type ShipmentRow = {
    id: string;
    dimensions: string;
    sender: string;
    recipient: string;
    deliveryDate: string;
    price: string;
    user: string;
    destination: string;
    relatedShipmentId: string | null;
    status: ShipmentStatusDto;
};

const shipmentTranslations = pl.shipments;
const shipmentListCache: {
    loaded: boolean;
    shipments: ShipmentDto[];
    promise: Promise<ShipmentDto[]> | null;
} = {
    loaded: false,
    shipments: [],
    promise: null,
};
const trackingProviderCache: {loaded: boolean; providers: TrackingProvider[]} = {
    loaded: false,
    providers: [],
};
const SHIPMENT_PAGE_SIZE = 100;

const formatPersonName = (firstName?: string, lastName?: string, fallback = "-") => {
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    return fullName || fallback;
};

const formatDeliveryDate = (date?: string | null) => {
    if (!date) {
        return "-";
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString(pl.common.locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatPrice = (shipment: ShipmentDto) => {
    if (!shipment.price) {
        return "-";
    }

    return `${shipment.price.amount.toLocaleString(pl.common.locale)} ${shipment.price.currency}`;
};

const mapShipmentToRow = (shipment: ShipmentDto): ShipmentRow => ({
    id: `#${shipment.shipmentId.value}`,
    dimensions: shipment.dimensions
        ? `${shipment.dimensions.length} × ${shipment.dimensions.width} × ${shipment.dimensions.height} ${shipment.dimensions.unit}`
        : pl.common.dash,
    sender: formatPersonName(shipment.sender?.firstName, shipment.sender?.lastName, shipmentTranslations.table.fallbackSender),
    recipient: formatPersonName(shipment.recipient?.firstName, shipment.recipient?.lastName, shipmentTranslations.table.fallbackRecipient),
    deliveryDate: formatDeliveryDate(shipment.signature?.signedAt),
    price: formatPrice(shipment),
    user: shipmentTranslations.table.unassigned,
    destination: departmentCodeValue(shipment.destination) || shipment.recipient?.city || "-",
    relatedShipmentId: shipment.shipmentRelatedId?.value || null,
    status: shipment.shipmentStatus,
});

const statusClassName = (status: ShipmentStatusDto) => `tm-status tm-status-${status.toLowerCase()}`;

const avatarFor = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";

const loadShipments = async (criteria: ShipmentSearchRequestApi = {}) => {
    const response = await ShipmentService.search({
        ...criteria,
        page: 0,
        size: SHIPMENT_PAGE_SIZE,
    });
    return response.data;
};

const loadInitialShipments = () => {
    if (shipmentListCache.loaded) {
        return Promise.resolve(shipmentListCache.shipments);
    }

    if (!shipmentListCache.promise) {
        shipmentListCache.promise = loadShipments()
            .then((shipments) => {
                shipmentListCache.loaded = true;
                shipmentListCache.shipments = shipments;
                return shipments;
            })
            .finally(() => {
                shipmentListCache.promise = null;
            });
    }

    return shipmentListCache.promise;
};

type ShipmentStatusFilter = ShipmentStatusDto | "ALL";

const DEFAULT_STATUS_FILTER: ShipmentStatusFilter = "ALL";

type ShipmentListProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
    variant?: "list" | "details";
};

const ShipmentList: React.FC<ShipmentListProps> = ({onOpenTab, variant = "list"}) => {
    const navigate = useNavigate();
    const [lookupTrackingNumber, setLookupTrackingNumber] = useState<string>("");
    const [lookupId, setLookupId] = useState<string>("");
    const [appliedLookupTrackingNumber, setAppliedLookupTrackingNumber] = useState<string>("");
    const [appliedLookupId, setAppliedLookupId] = useState<string>("");
    const [activeStatus, setActiveStatus] = useState<ShipmentStatusFilter>(DEFAULT_STATUS_FILTER);
    const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);
    const [shipmentPriorityFilter, setShipmentPriorityFilter] = useState<ShipmentPriorityDto | "">("");
    const [senderNameFilter, setSenderNameFilter] = useState<string>("");
    const [recipientNameFilter, setRecipientNameFilter] = useState<string>("");
    const [destinationFilter, setDestinationFilter] = useState<string>("");
    const [minPriceFilter, setMinPriceFilter] = useState<string>("");
    const [maxPriceFilter, setMaxPriceFilter] = useState<string>("");
    const [currencyFilter, setCurrencyFilter] = useState<string>("");
    const [lockedFilter, setLockedFilter] = useState<"ALL" | "YES" | "NO">("ALL");
    const [createdFromFilter, setCreatedFromFilter] = useState<string>("");
    const [createdToFilter, setCreatedToFilter] = useState<string>("");
    const [shipments, setShipments] = useState<ShipmentDto[]>(shipmentListCache.shipments);
    const [readModelSearchResults, setReadModelSearchResults] = useState<ShipmentDto[] | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchSource, setSearchSource] = useState<"SYSTEM" | "EXTERNAL">("SYSTEM");
    const [trackingProviders, setTrackingProviders] = useState<TrackingProvider[]>(trackingProviderCache.providers);
    const [trackingProvider, setTrackingProvider] = useState<TrackingProviderId | "">("");
    const [externalLoading, setExternalLoading] = useState(false);
    const [externalResult, setExternalResult] = useState<ExternalTrackingResult | null>(null);
    const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
    const [documentLoading, setDocumentLoading] = useState<"excel" | "label" | null>(null);
    const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
    const qrPreviewRef = useRef<HTMLIFrameElement | null>(null);

    const displayedShipments = readModelSearchResults || shipments;

    const visibleShipments = useMemo(() => {
        return displayedShipments
            .filter((shipment) => activeStatus === "ALL" || shipment.shipmentStatus === activeStatus)
            .filter((shipment) => !appliedLookupId || shipment.shipmentId.value.toString() === appliedLookupId)
            .filter((shipment) => {
                const trackingNumber = shipment.trackingNumber?.value || "";
                return !appliedLookupTrackingNumber || trackingNumber.toLowerCase().includes(appliedLookupTrackingNumber.toLowerCase());
            });
    }, [
        activeStatus,
        appliedLookupId,
        appliedLookupTrackingNumber,
        displayedShipments,
    ]);

    const shipmentRows = useMemo(() => {
        return visibleShipments.map(mapShipmentToRow);
    }, [visibleShipments]);
    const selectedShipment = visibleShipments.find((shipment) => shipment.shipmentId.value === selectedShipmentId) || null;

    const statusCounts = useMemo(() => {
        const counts = shipmentTranslations.statusTabs.reduce((result, status) => {
            result[status] = 0;
            return result;
        }, {} as Record<ShipmentStatusDto, number>);

        displayedShipments.forEach((shipment) => {
            counts[shipment.shipmentStatus] += 1;
        });
        return counts;
    }, [displayedShipments]);

    const normalizeShipmentId = (value: string): string => {
        const trimmedValue = value.trim();
        if (!/^\d+$/.test(trimmedValue) || /^0+$/.test(trimmedValue)) {
            throw new Error(shipmentTranslations.table.invalidShipmentId);
        }

        return trimmedValue;
    };

    const showError = (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        const message = apiError.message || (error as Error).message || shipmentTranslations.messages.operationFailed;
        setNotice({severity: "error", message});
    };

    const findByTrackingNumber = () => {
        const trackingNumber = lookupTrackingNumber.trim();
        if (searchSource === "EXTERNAL") {
            if (!trackingProvider) {
                setNotice({severity: "error", message: shipmentTranslations.externalSearch.noProviders});
                return;
            }

            setExternalLoading(true);
            setExternalResult(null);
            TrackingService.search(trackingProvider, [trackingNumber])
                .then((response) => {
                    const result = response.data[0];
                    if (!result) {
                        setNotice({severity: "error", message: shipmentTranslations.table.localFilterNotFound});
                        return;
                    }
                    setExternalResult(result);
                })
                .catch(showError)
                .finally(() => setExternalLoading(false));
            return;
        }

        const shipment = displayedShipments.find((current) => current.trackingNumber?.value?.toLowerCase().includes(trackingNumber.toLowerCase()));
        if (!shipment) {
            setNotice({severity: "error", message: shipmentTranslations.table.localFilterNotFound});
            return;
        }

        setAppliedLookupId("");
        setAppliedLookupTrackingNumber(trackingNumber);
        if (shipment.shipmentStatus !== activeStatus) {
            setActiveStatus(shipment.shipmentStatus);
        }
        setNotice({severity: "success", message: shipmentTranslations.table.localFilterApplied});
    };

    const findById = () => {
        let shipmentId: string;
        try {
            shipmentId = normalizeShipmentId(lookupId);
        } catch (error) {
            setNotice({severity: "error", message: (error as Error).message});
            return;
        }

        const shipment = displayedShipments.find((current) => current.shipmentId.value === shipmentId);
        if (!shipment) {
            setNotice({severity: "error", message: shipmentTranslations.table.localFilterNotFound});
            return;
        }

        setAppliedLookupTrackingNumber("");
        setAppliedLookupId(String(shipmentId));
        if (shipment.shipmentStatus !== activeStatus) {
            setActiveStatus(shipment.shipmentStatus);
        }
        setNotice({severity: "success", message: shipmentTranslations.table.localFilterApplied});
    };

    const clearLocalFilters = () => {
        setLookupId("");
        setLookupTrackingNumber("");
        setAppliedLookupId("");
        setAppliedLookupTrackingNumber("");
        setExternalResult(null);
    };

    const priceFilterValue = (value: string): number | null => {
        if (!value.trim()) {
            return null;
        }

        const price = Number(value.replace(",", "."));
        if (!Number.isFinite(price) || price < 0) {
            throw new Error(shipmentTranslations.filters.invalidPrice);
        }

        return price;
    };

    const dateFilterValue = (value: string, endOfDay = false): string | null => {
        if (!value) {
            return null;
        }

        return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`;
    };

    const applyAdvancedFilters = async () => {
        let minPrice: number | null;
        let maxPrice: number | null;

        try {
            minPrice = priceFilterValue(minPriceFilter);
            maxPrice = priceFilterValue(maxPriceFilter);
            if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
                throw new Error(shipmentTranslations.filters.invalidPriceRange);
            }
        } catch (error) {
            setNotice({severity: "error", message: (error as Error).message});
            return;
        }

        const criteria: ShipmentSearchRequestApi = {
            shipmentPriorities: shipmentPriorityFilter ? [shipmentPriorityFilter] : [],
            senderName: senderNameFilter.trim() || null,
            recipientName: recipientNameFilter.trim() || null,
            destination: destinationFilter.trim() || null,
            minPrice,
            maxPrice,
            currency: currencyFilter.trim().toUpperCase() || null,
            locked: lockedFilter === "ALL" ? null : lockedFilter === "YES",
            createdFrom: dateFilterValue(createdFromFilter),
            createdTo: dateFilterValue(createdToFilter, true),
        };

        setLoading(true);
        try {
            const filteredShipments = await loadShipments(criteria);
            setReadModelSearchResults(filteredShipments);
            clearLocalFilters();
            setNotice({severity: "success", message: shipmentTranslations.filters.applied});
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    const resetAdvancedFilters = () => {
        setShipmentPriorityFilter("");
        setSenderNameFilter("");
        setRecipientNameFilter("");
        setDestinationFilter("");
        setMinPriceFilter("");
        setMaxPriceFilter("");
        setCurrencyFilter("");
        setLockedFilter("ALL");
        setCreatedFromFilter("");
        setCreatedToFilter("");
        clearLocalFilters();
        setReadModelSearchResults(null);
    };

    useEffect(() => {
        if (searchSource !== "EXTERNAL") {
            setExternalResult(null);
            return;
        }

        if (trackingProviderCache.loaded) {
            setTrackingProviders([...trackingProviderCache.providers]);
            setTrackingProvider((current) => current || trackingProviderCache.providers[0]?.id || "");
            return;
        }

        TrackingService.getAvailableProviders()
            .then((response) => {
                trackingProviderCache.loaded = true;
                trackingProviderCache.providers = response.data;
                setTrackingProviders([...response.data]);
                setTrackingProvider(response.data[0]?.id || "");
            })
            .catch(() => setNotice({
                severity: "error",
                message: shipmentTranslations.externalSearch.providerLoadError,
            }));
    }, [searchSource]);

    const openShipmentDetails = (shipment: ShipmentDto) => {
        const shipmentId = shipment.shipmentId.value;
        const trackingNumber = shipment.trackingNumber?.value;
        const label = trackingNumber
            ? `${pl.home.tiles.shipmentDetails.title} ${trackingNumber}`
            : `${pl.home.tiles.shipmentDetails.title} #${shipmentId}`;
        const path = trackingNumber
            ? `/shipments/tracking/${encodeURIComponent(trackingNumber)}/edit`
            : `/shipments/${shipmentId}/edit`;
        const tab = {
            label,
            path,
        };

        if (onOpenTab) {
            onOpenTab(tab);
            return;
        }

        navigate(tab.path);
    };

    const openRelatedShipment = (shipmentId: string) => {
        const tab = {
            label: `${pl.home.tiles.shipmentDetails.title} #${shipmentId}`,
            path: `/shipments/${shipmentId}/edit`,
        };
        if (onOpenTab) {
            onOpenTab(tab);
        } else {
            navigate(tab.path);
        }
    };

    const exportSelectedShipment = async () => {
        if (!selectedShipment) {
            return;
        }
        setDocumentLoading("excel");
        try {
            await exportShipmentExcel(selectedShipment);
            setNotice({severity: "success", message: shipmentTranslations.messages.documentDownloadSuccess});
        } catch (error) {
            setNotice({severity: "error", message: shipmentTranslations.messages.excelExportError});
        } finally {
            setDocumentLoading(null);
        }
    };

    const showSelectedLabel = async () => {
        if (!selectedShipment) {
            return;
        }
        setDocumentLoading("label");
        try {
            const label = await DocumentService.getQrLabel(selectedShipment.shipmentId.value);
            setQrPreviewUrl(URL.createObjectURL(label.blob));
        } catch (error) {
            setNotice({severity: "error", message: shipmentTranslations.messages.qrCodeDownloadError});
        } finally {
            setDocumentLoading(null);
        }
    };

    useEffect(() => () => {
        if (qrPreviewUrl) {
            URL.revokeObjectURL(qrPreviewUrl);
        }
    }, [qrPreviewUrl]);

    useEffect(() => {
        let active = true;

        if (shipmentListCache.loaded) {
            setShipments([...shipmentListCache.shipments]);
            return () => {
                active = false;
            };
        }

        setLoading(true);
        loadInitialShipments()
            .then((response) => {
                if (active) {
                    setShipments([...response]);
                }
            })
            .catch((error) => {
                if (active) {
                    showError(error);
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
    }, []);

    return (
        <div className="tm-page tm-page-shipment-catalog">
            <div className="tm-content">
                <div className="tm-top-row">
                    <div className="tm-page-heading">
                        <span className="tm-heading-kicker">{pl.common.brand}</span>
                        <Typography variant="h4">
                            {variant === "details" ? pl.shipments.page.detailsTitle : pl.shipments.page.title}
                        </Typography>
                        <p>{variant === "details" ? pl.shipments.page.detailsSubtitle : pl.shipments.page.subtitle}</p>
                    </div>
                    <Button
                        className="tm-add-new"
                        startIcon={<Add />}
                        variant="contained"
                        onClick={() => navigate("/shipments/create")}
                    >
                        {shipmentTranslations.actions.create}
                    </Button>
                </div>

                <section className="tm-card tm-orders-card">
                    <div className="tm-orders-header">
                        <Typography variant="h5">{shipmentTranslations.table.title}</Typography>
                        <div className="tm-toolbar-actions">
                            <Button
                                aria-expanded={filtersExpanded}
                                startIcon={<FilterList />}
                                variant="outlined"
                                onClick={() => setFiltersExpanded((expanded) => !expanded)}
                            >
                                {shipmentTranslations.actions.filters}
                            </Button>
                        </div>
                    </div>

                    <div className="tm-orders-controls">
                        <div className="tm-tabs">
                            {(["ALL", ...shipmentTranslations.statusTabs] as ShipmentStatusFilter[]).map((status) => {
                                const label = status === "ALL" ? pl.common.all : shipmentTranslations.status[status];
                                const count = status === "ALL" ? displayedShipments.length : statusCounts[status];
                                return (
                                    <button
                                        aria-label={label}
                                        aria-pressed={status === activeStatus}
                                        className={status === activeStatus ? "tm-tab-active" : ""}
                                        data-status={status.toLowerCase()}
                                        disabled={loading && status === activeStatus}
                                        key={status}
                                        onClick={() => setActiveStatus(status)}
                                        title={label}
                                        type="button"
                                    >
                                        <span>{label}</span>
                                        <strong>{count}</strong>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="tm-manual-load">
                        <TextField
                            label={shipmentTranslations.externalSearch.source}
                            select
                            size="small"
                            value={searchSource}
                            onChange={(event) => setSearchSource(event.target.value as "SYSTEM" | "EXTERNAL")}
                        >
                            <MenuItem value="SYSTEM">{shipmentTranslations.externalSearch.system}</MenuItem>
                            <MenuItem value="EXTERNAL">{shipmentTranslations.externalSearch.external}</MenuItem>
                        </TextField>
                        {searchSource === "SYSTEM" ? (
                            <div className="tm-filter-cluster">
                                <TextField
                                    label={shipmentTranslations.table.shipmentId}
                                    size="small"
                                    inputProps={{inputMode: "numeric", pattern: "[0-9]*"}}
                                    value={lookupId}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => setLookupId(event.target.value)}
                                />
                                <Button disabled={loading || !lookupId} variant="outlined" onClick={findById}>
                                    {shipmentTranslations.table.filterById}
                                </Button>
                            </div>
                        ) : (
                            <TextField
                                label={shipmentTranslations.externalSearch.provider}
                                select
                                size="small"
                                value={trackingProvider}
                                onChange={(event) => setTrackingProvider(event.target.value as TrackingProviderId)}
                            >
                                {trackingProviders.map((provider) => (
                                    <MenuItem key={provider.id} value={provider.id}>{provider.displayName}</MenuItem>
                                ))}
                            </TextField>
                        )}
                        <div className="tm-filter-cluster tm-filter-cluster-wide">
                            <TextField
                                label={shipmentTranslations.table.trackingNumber}
                                size="small"
                                value={lookupTrackingNumber}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setLookupTrackingNumber(event.target.value)}
                            />
                            <Button disabled={loading || externalLoading || !lookupTrackingNumber || (searchSource === "EXTERNAL" && !trackingProvider)} variant="outlined" onClick={findByTrackingNumber}>
                                {externalLoading ? <CircularProgress size={18}/> : searchSource === "EXTERNAL"
                                    ? shipmentTranslations.externalSearch.search
                                    : shipmentTranslations.table.filterByTracking}
                            </Button>
                        </div>
                        <Button disabled={!appliedLookupId && !appliedLookupTrackingNumber && !externalResult} variant="text" onClick={clearLocalFilters}>
                            {shipmentTranslations.table.clearFilters}
                        </Button>
                    </div>

                    {filtersExpanded ? (
                        <section className="tm-advanced-filters" aria-label={shipmentTranslations.filters.title}>
                            <TextField
                                label={shipmentTranslations.form.fields.priority}
                                select
                                size="small"
                                value={shipmentPriorityFilter}
                                onChange={(event) => setShipmentPriorityFilter(event.target.value as ShipmentPriorityDto | "")}
                            >
                                <MenuItem value="">{pl.common.all}</MenuItem>
                                {shipmentPriorities.map((priority) => (
                                    <MenuItem key={priority} value={priority}>{shipmentTranslations.priority[priority]}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label={shipmentTranslations.table.columns.sender}
                                size="small"
                                value={senderNameFilter}
                                onChange={(event) => setSenderNameFilter(event.target.value)}
                            />
                            <TextField
                                label={shipmentTranslations.table.columns.recipient}
                                size="small"
                                value={recipientNameFilter}
                                onChange={(event) => setRecipientNameFilter(event.target.value)}
                            />
                            <TextField
                                label={shipmentTranslations.table.columns.destination}
                                size="small"
                                value={destinationFilter}
                                onChange={(event) => setDestinationFilter(event.target.value)}
                            />
                            <TextField
                                inputProps={{min: 0, step: "0.01"}}
                                label={shipmentTranslations.filters.minPrice}
                                size="small"
                                type="number"
                                value={minPriceFilter}
                                onChange={(event) => setMinPriceFilter(event.target.value)}
                            />
                            <TextField
                                inputProps={{min: 0, step: "0.01"}}
                                label={shipmentTranslations.filters.maxPrice}
                                size="small"
                                type="number"
                                value={maxPriceFilter}
                                onChange={(event) => setMaxPriceFilter(event.target.value)}
                            />
                            <TextField
                                label={shipmentTranslations.form.fields.currency}
                                size="small"
                                value={currencyFilter}
                                onChange={(event) => setCurrencyFilter(event.target.value)}
                            />
                            <TextField
                                label={shipmentTranslations.filters.locked}
                                select
                                size="small"
                                value={lockedFilter}
                                onChange={(event) => setLockedFilter(event.target.value as "ALL" | "YES" | "NO")}
                            >
                                <MenuItem value="ALL">{pl.common.all}</MenuItem>
                                <MenuItem value="YES">{shipmentTranslations.filters.yes}</MenuItem>
                                <MenuItem value="NO">{shipmentTranslations.filters.no}</MenuItem>
                            </TextField>
                            <TextField
                                label={shipmentTranslations.filters.createdFrom}
                                size="small"
                                type="date"
                                value={createdFromFilter}
                                onChange={(event) => setCreatedFromFilter(event.target.value)}
                            />
                            <TextField
                                label={shipmentTranslations.filters.createdTo}
                                size="small"
                                type="date"
                                value={createdToFilter}
                                onChange={(event) => setCreatedToFilter(event.target.value)}
                            />
                            <div className="tm-filter-actions">
                                <Button disabled={loading} variant="contained" onClick={applyAdvancedFilters}>
                                    {loading ? <CircularProgress size={18}/> : shipmentTranslations.filters.apply}
                                </Button>
                                <Button disabled={loading} variant="text" onClick={resetAdvancedFilters}>
                                    {shipmentTranslations.filters.reset}
                                </Button>
                            </div>
                        </section>
                    ) : undefined}

                    {searchSource === "EXTERNAL" && !trackingProviders.length ? (
                        <Alert severity="info" className="tm-external-empty">
                            {shipmentTranslations.externalSearch.noProviders}
                        </Alert>
                    ) : undefined}

                    {externalResult ? (
                        <section className="tm-external-result" aria-label={shipmentTranslations.externalSearch.resultTitle}>
                            <div className="tm-external-result-header">
                                <div>
                                    <span>{externalResult.provider}</span>
                                    <Typography variant="h6">{externalResult.trackingNumber}</Typography>
                                </div>
                                <Chip label={externalResult.currentStatus || pl.common.dash} color="primary"/>
                            </div>
                            <dl className="tm-external-summary">
                                <div><dt>{shipmentTranslations.externalSearch.currentStatus}</dt><dd>{externalResult.currentStatus || pl.common.dash}</dd></div>
                                <div><dt>{shipmentTranslations.externalSearch.updatedAt}</dt><dd>{externalResult.updatedAt ? new Date(externalResult.updatedAt).toLocaleString(pl.common.locale) : pl.common.dash}</dd></div>
                            </dl>
                            <Typography variant="subtitle1">{shipmentTranslations.externalSearch.events}</Typography>
                            <ol className="tm-external-events">
                                {externalResult.events.map((event, index) => (
                                    <li key={`${event.eventCode || "event"}-${event.timestamp || index}`}>
                                        <time>{event.timestamp ? new Date(event.timestamp).toLocaleString(pl.common.locale) : pl.common.dash}</time>
                                        <strong>{event.name || event.eventCode || pl.common.dash}</strong>
                                        {event.description ? <p>{event.description}</p> : undefined}
                                        {event.location?.name || event.location?.city ? (
                                            <small>{[event.location.name, event.location.city, event.location.country].filter(Boolean).join(", ")}</small>
                                        ) : undefined}
                                    </li>
                                ))}
                                {!externalResult.events.length ? <li>{shipmentTranslations.externalSearch.noEvents}</li> : undefined}
                            </ol>
                        </section>
                    ) : undefined}

                    <div className="tm-results-layout">
                        <div className="tm-table-wrap">
                            <table className="tm-orders-table">
                                <thead>
                                <tr>
                                    <th>{shipmentTranslations.table.columns.id}</th>
                                    <th>{shipmentTranslations.summary.dimensions}</th>
                                    <th><Person fontSize="small" /> {shipmentTranslations.table.columns.sender}</th>
                                    <th><Person fontSize="small" /> {shipmentTranslations.table.columns.recipient}</th>
                                    <th><AccessTime fontSize="small" /> {shipmentTranslations.table.columns.deliveryDate}</th>
                                    <th><AttachMoney fontSize="small" /> {shipmentTranslations.table.columns.price}</th>
                                    <th><Person fontSize="small" /> {shipmentTranslations.table.columns.user}</th>
                                    <th className="tm-destination-heading"><Route fontSize="small" /> {shipmentTranslations.table.columns.destination}</th>
                                    <th>{shipmentTranslations.table.columns.status}</th>
                                    <th>{shipmentTranslations.table.columns.relatedShipment}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {visibleShipments.map((shipment) => {
                                    const row = mapShipmentToRow(shipment);
                                    return (
                                        <tr
                                            aria-selected={selectedShipmentId === shipment.shipmentId.value}
                                            className="tm-clickable-row"
                                            key={row.id}
                                            onClick={() => setSelectedShipmentId(shipment.shipmentId.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    setSelectedShipmentId(shipment.shipmentId.value);
                                                }
                                            }}
                                            tabIndex={0}
                                        >
                                            <td>{row.id}</td>
                                            <td>{row.dimensions}</td>
                                            <td>
                                                <span className="tm-entity">
                                                    <span className="tm-logo-avatar">{avatarFor(row.sender)}</span>
                                                    <span>{row.sender}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <span className="tm-entity">
                                                    <span className="tm-user-avatar">{avatarFor(row.recipient)}</span>
                                                    <span>{row.recipient}</span>
                                                </span>
                                            </td>
                                            <td className="tm-muted-cell">{row.deliveryDate}</td>
                                            <td>{row.price}</td>
                                            <td>
                                                <span className="tm-entity">
                                                    <span className="tm-user-avatar tm-driver-avatar">{avatarFor(row.user)}</span>
                                                    <span>{row.user}</span>
                                                </span>
                                            </td>
                                            <td className="tm-destination-cell">{row.destination}</td>
                                            <td>
                                                <Chip
                                                    className={statusClassName(row.status)}
                                                    label={shipmentTranslations.status[row.status]}
                                                    size="small"
                                                />
                                            </td>
                                            <td>
                                                {row.relatedShipmentId ? (
                                                    <Link
                                                        className="tm-related-shipment-link"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            openRelatedShipment(row.relatedShipmentId!);
                                                        }}
                                                        to={`/shipments/${row.relatedShipmentId}/edit`}
                                                    >
                                                        #{row.relatedShipmentId}
                                                    </Link>
                                                ) : pl.common.dash}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && shipmentRows.length === 0 ? (
                                    <tr>
                                        <td className="tm-empty-row" colSpan={10}>{shipmentTranslations.table.empty}</td>
                                    </tr>
                                ) : undefined}
                                </tbody>
                            </table>
                        </div>
                        <aside className="tm-selection-actions" aria-label={shipmentTranslations.table.selectedActions}>
                            <strong>{shipmentTranslations.table.selectedActions}</strong>
                            <span className="tm-selection-id">
                                {selectedShipment ? `#${selectedShipment.shipmentId.value}` : shipmentTranslations.table.selectShipment}
                            </span>
                            <Button disabled={!selectedShipment} startIcon={<InfoOutlined />} variant="contained" onClick={() => selectedShipment && openShipmentDetails(selectedShipment)}>
                                {shipmentTranslations.actions.display}
                            </Button>
                            <Button disabled={!selectedShipment || Boolean(documentLoading)} startIcon={documentLoading === "excel" ? <CircularProgress size={18} /> : <TableView />} variant="outlined" onClick={exportSelectedShipment}>
                                {shipmentTranslations.actions.exportToExcel}
                            </Button>
                            <Button disabled={!selectedShipment || Boolean(documentLoading)} startIcon={documentLoading === "label" ? <CircularProgress size={18} /> : <QrCode2 />} variant="outlined" onClick={showSelectedLabel}>
                                {shipmentTranslations.actions.showLabel}
                            </Button>
                        </aside>
                    </div>

                    <div className="tm-table-footer">
                        <span>{shipmentTranslations.table.shown} {shipmentRows.length} {shipmentTranslations.table.of} {displayedShipments.length}</span>
                        <div className="tm-pagination">
                            <button type="button">‹</button>
                            {[1, 2, 3, 4, 5].map((page) => (
                                <button className={page === 1 ? "tm-page-active" : ""} key={page} type="button">{page}</button>
                            ))}
                            <button type="button">›</button>
                        </div>
                    </div>
                </section>
            </div>

            <Dialog fullWidth maxWidth="md" open={Boolean(qrPreviewUrl)} onClose={() => setQrPreviewUrl(null)}>
                <DialogTitle>{shipmentTranslations.qrLabel.previewTitle}</DialogTitle>
                <DialogContent className="shipment-qr-preview-content">
                    {qrPreviewUrl ? <iframe className="shipment-qr-preview-frame" ref={qrPreviewRef} src={qrPreviewUrl} title={shipmentTranslations.qrLabel.previewTitle} /> : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQrPreviewUrl(null)}>{pl.common.close}</Button>
                    <Button startIcon={<Print />} variant="contained" onClick={() => {
                        qrPreviewRef.current?.contentWindow?.focus();
                        qrPreviewRef.current?.contentWindow?.print();
                    }}>
                        {shipmentTranslations.actions.printLabel}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentList;
