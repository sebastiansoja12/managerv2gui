import React, {ChangeEvent, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "components/ui";
import {
    AccessTime,
    Add,
    AttachMoney,
    Category,
    ContentCopy,
    Edit,
    FileDownload,
    FilterList,
    GridView,
    InfoOutlined,
    MoreVert,
    OpenInFull,
    Person,
    Route,
    Tune,
    ViewList,
} from "components/ui/icons";
import {useNavigate} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import TrackingService from "../../hooks/TrackingService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {
    ExternalTrackingResult,
    TrackingProvider,
    TrackingProviderId,
} from "../GlobalConfiguration/model/TrackingIntegration";
import {departmentCodeValue, ShipmentDto, ShipmentSearchRequestApi, ShipmentStatusDto} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import "./styles/shipments.css";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

type ShipmentRow = {
    id: string;
    size: string;
    sender: string;
    recipient: string;
    deliveryDate: string;
    price: string;
    user: string;
    destination: string;
    status: ShipmentStatusDto;
};

const shipmentTranslations = pl.shipments;
const shipmentListCache: {loaded: boolean; shipments: ShipmentDto[]} = {
    loaded: false,
    shipments: [],
};
const shipmentTrendCache: {loaded: boolean; currentWeekShipments: ShipmentDto[]; previousWeekShipments: ShipmentDto[]} = {
    loaded: false,
    currentWeekShipments: [],
    previousWeekShipments: [],
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
    size: shipmentTranslations.size[shipment.shipmentSize] || shipment.shipmentSize,
    sender: formatPersonName(shipment.sender?.firstName, shipment.sender?.lastName, shipmentTranslations.table.fallbackSender),
    recipient: formatPersonName(shipment.recipient?.firstName, shipment.recipient?.lastName, shipmentTranslations.table.fallbackRecipient),
    deliveryDate: formatDeliveryDate(shipment.signature?.signedAt),
    price: formatPrice(shipment),
    user: shipmentTranslations.table.unassigned,
    destination: departmentCodeValue(shipment.destination) || shipment.recipient?.city || "-",
    status: shipment.shipmentStatus,
});

const statusClassName = (status: ShipmentStatusDto) => `tm-status tm-status-${status.toLowerCase()}`;

const avatarFor = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";

const loadShipments = async (criteria: ShipmentSearchRequestApi = {}) => {
    const collectedShipments: ShipmentDto[] = [];
    let page = 0;

    while (true) {
        const response = await ShipmentService.search({
            ...criteria,
            page,
            size: SHIPMENT_PAGE_SIZE,
        });

        collectedShipments.push(...response.data);

        if (response.data.length < SHIPMENT_PAGE_SIZE) {
            break;
        }

        page += 1;
    }

    return collectedShipments;
};

const toApiLocalDateTime = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, "0");

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
    ].join("-") + `T${[
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds()),
    ].join(":")}`;
};

const weekRange = (weeksBack: number) => {
    const end = new Date();
    end.setMilliseconds(0);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    start.setDate(start.getDate() - (weeksBack * 7));
    end.setDate(end.getDate() - (weeksBack * 7));

    return {
        createdFrom: toApiLocalDateTime(start),
        createdTo: toApiLocalDateTime(end),
    };
};

const amountValue = (shipment: ShipmentDto) => {
    const amount = Number(shipment.price?.amount || 0);
    return Number.isFinite(amount) ? amount : 0;
};

const calculateShipmentValue = (shipmentsToCount: ShipmentDto[]) => shipmentsToCount.reduce(
    (sum, shipment) => sum + amountValue(shipment),
    0
);

const calculateTrendPercent = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) {
        return currentValue > 0 ? 100 : 0;
    }

    return ((currentValue - previousValue) / previousValue) * 100;
};

const formatTrendPercent = (value: number) => {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toLocaleString(pl.common.locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    })}%`;
};

const trendClassName = (value: number) => {
    if (value > 0) {
        return "tm-trend-up";
    }

    if (value < 0) {
        return "tm-trend-down";
    }

    return "tm-trend-neutral";
};

const trendIndicator = (value: number) => {
    if (value > 0) {
        return "↑";
    }

    if (value < 0) {
        return "↓";
    }

    return "→";
};

type MoneyBucket = {
    currency: string;
    total: number;
    standard: number;
    express: number;
};

const calculateMoneyBuckets = (shipmentsToCount: ShipmentDto[]) => {
    const buckets = new Map<string, MoneyBucket>();

    shipmentsToCount.forEach((shipment) => {
        const amount = amountValue(shipment);
        const currency = shipment.price?.currency || "PLN";
        const bucket = buckets.get(currency) || {
            currency,
            total: 0,
            standard: 0,
            express: 0,
        };

        bucket.total += amount;
        if (shipment.shipmentPriority === "EXPRESS") {
            bucket.express += amount;
        } else {
            bucket.standard += amount;
        }
        buckets.set(currency, bucket);
    });

    return Array.from(buckets.values()).sort((left, right) => right.total - left.total);
};

const formatCompactNumber = (value: number) => {
    const absoluteValue = Math.abs(value);
    const format = (scaledValue: number, maximumFractionDigits: number) => scaledValue.toLocaleString(pl.common.locale, {
        maximumFractionDigits,
        minimumFractionDigits: scaledValue % 1 === 0 ? 0 : 1,
    });

    if (absoluteValue >= 1_000_000) {
        return `${format(value / 1_000_000, 1)}M`;
    }

    if (absoluteValue >= 1_000) {
        return `${format(value / 1_000, absoluteValue >= 100_000 ? 0 : 1)}K`;
    }

    return value.toLocaleString(pl.common.locale, {
        maximumFractionDigits: 0,
    });
};

const formatMoneyBuckets = (buckets: MoneyBucket[], key: keyof Pick<MoneyBucket, "total" | "standard" | "express">) => {
    if (!buckets.length) {
        return `0 PLN`;
    }

    return buckets
        .filter((bucket) => bucket[key] > 0)
        .map((bucket) => `${formatCompactNumber(bucket[key])} ${bucket.currency}`)
        .join(" + ") || `0 ${buckets[0].currency}`;
};

const DEFAULT_STATUS_FILTER: ShipmentStatusDto = "CREATED";

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
    const [activeStatus, setActiveStatus] = useState<ShipmentStatusDto>(DEFAULT_STATUS_FILTER);
    const [dangerousGoodsFilter, setDangerousGoodsFilter] = useState<"ALL" | "YES" | "NO">("ALL");
    const [unNumberFilter, setUnNumberFilter] = useState<string>("");
    const [hazardClassFilter, setHazardClassFilter] = useState<string>("");
    const [shipments, setShipments] = useState<ShipmentDto[]>(shipmentListCache.shipments);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchSource, setSearchSource] = useState<"SYSTEM" | "EXTERNAL">("SYSTEM");
    const [trackingProviders, setTrackingProviders] = useState<TrackingProvider[]>(trackingProviderCache.providers);
    const [trackingProvider, setTrackingProvider] = useState<TrackingProviderId | "">("");
    const [currentWeekShipments, setCurrentWeekShipments] = useState<ShipmentDto[]>(shipmentTrendCache.currentWeekShipments);
    const [previousWeekShipments, setPreviousWeekShipments] = useState<ShipmentDto[]>(shipmentTrendCache.previousWeekShipments);
    const [externalLoading, setExternalLoading] = useState(false);
    const [externalResult, setExternalResult] = useState<ExternalTrackingResult | null>(null);
    const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
    const [actionShipment, setActionShipment] = useState<ShipmentDto | null>(null);

    const visibleShipments = useMemo(() => {
        return shipments
            .filter((shipment) => shipment.shipmentStatus === activeStatus)
            .filter((shipment) => !appliedLookupId || shipment.shipmentId.value.toString() === appliedLookupId)
            .filter((shipment) => {
                const trackingNumber = shipment.trackingNumber?.value || "";
                return !appliedLookupTrackingNumber || trackingNumber.toLowerCase().includes(appliedLookupTrackingNumber.toLowerCase());
            })
            .filter((shipment) => dangerousGoodsFilter === "ALL"
                || (dangerousGoodsFilter === "YES" ? Boolean(shipment.dangerousGood) : !shipment.dangerousGood))
            .filter((shipment) => !unNumberFilter
                || shipment.dangerousGood?.unNumber.toLowerCase().includes(unNumberFilter.trim().toLowerCase()))
            .filter((shipment) => !hazardClassFilter
                || shipment.dangerousGood?.hazardClass.toLowerCase().includes(hazardClassFilter.trim().toLowerCase()));
    }, [
        activeStatus,
        appliedLookupId,
        appliedLookupTrackingNumber,
        dangerousGoodsFilter,
        hazardClassFilter,
        shipments,
        unNumberFilter,
    ]);

    const shipmentRows = useMemo(() => {
        return visibleShipments.map(mapShipmentToRow);
    }, [visibleShipments]);

    const shipmentMetrics = useMemo(() => {
        const total = shipments.length;
        const created = shipments.filter((shipment) => shipment.shipmentStatus === "CREATED").length;
        const delivered = shipments.filter((shipment) => shipment.shipmentStatus === "DELIVERY").length;
        const sent = shipments.filter((shipment) => shipment.shipmentStatus === "SENT").length;
        const handling = Math.max(total - created - delivered - sent, 0);
        const moneyBuckets = calculateMoneyBuckets(shipments);
        const standardValue = moneyBuckets.reduce((sum, bucket) => sum + bucket.standard, 0);
        const expressValue = moneyBuckets.reduce((sum, bucket) => sum + bucket.express, 0);
        const valueTotal = standardValue + expressValue;

        return {
            created,
            delivered,
            expressValue,
            handling,
            moneyBuckets,
            sent,
            standardValue,
            total,
            valueTotal,
        };
    }, [shipments]);

    const currentWeekValue = useMemo(() => calculateShipmentValue(currentWeekShipments), [currentWeekShipments]);
    const previousWeekValue = useMemo(() => calculateShipmentValue(previousWeekShipments), [previousWeekShipments]);
    const shipmentTrend = calculateTrendPercent(currentWeekShipments.length, previousWeekShipments.length);
    const valueTrend = calculateTrendPercent(currentWeekValue, previousWeekValue);
    const valueShareTotal = shipmentMetrics.standardValue + shipmentMetrics.expressValue;
    const standardGaugeShare = valueShareTotal > 0 ? (shipmentMetrics.standardValue / valueShareTotal) * 100 : 0;
    const progressSegments = [
        {className: "tm-progress-violet", count: shipmentMetrics.sent, label: shipmentTranslations.metrics.sent},
        {className: "tm-progress-orange", count: shipmentMetrics.created, label: shipmentTranslations.metrics.created},
        {className: "tm-progress-green", count: shipmentMetrics.delivered, label: shipmentTranslations.metrics.delivered},
        {className: "tm-progress-blue", count: shipmentMetrics.handling, label: shipmentTranslations.metrics.handling},
    ];

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

        const shipment = shipments.find((current) => current.trackingNumber?.value?.toLowerCase().includes(trackingNumber.toLowerCase()));
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

        const shipment = shipments.find((current) => current.shipmentId.value === shipmentId);
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

    const openActionMenu = (event: React.MouseEvent<HTMLButtonElement>, shipment: ShipmentDto) => {
        event.stopPropagation();
        setActionMenuAnchor(event.currentTarget);
        setActionShipment(shipment);
    };

    const closeActionMenu = () => {
        setActionMenuAnchor(null);
        setActionShipment(null);
    };

    const handleOpenActionShipment = () => {
        const shipment = actionShipment;
        closeActionMenu();
        if (shipment) {
            openShipmentDetails(shipment);
        }
    };

    const copyTrackingNumber = async () => {
        const trackingNumber = actionShipment?.trackingNumber?.value;
        closeActionMenu();

        if (!trackingNumber) {
            return;
        }

        try {
            await navigator.clipboard.writeText(trackingNumber);
            setNotice({severity: "success", message: shipmentTranslations.messages.copyTrackingSuccess});
        } catch (error) {
            setNotice({severity: "error", message: shipmentTranslations.messages.copyTrackingError});
        }
    };

    useEffect(() => {
        let active = true;

        if (shipmentListCache.loaded) {
            setShipments([...shipmentListCache.shipments]);
            return () => {
                active = false;
            };
        }

        setLoading(true);
        loadShipments()
            .then((response) => {
                if (active) {
                    shipmentListCache.loaded = true;
                    shipmentListCache.shipments = response;
                    setShipments([...shipmentListCache.shipments]);
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

    useEffect(() => {
        let active = true;

        if (shipmentTrendCache.loaded) {
            setCurrentWeekShipments([...shipmentTrendCache.currentWeekShipments]);
            setPreviousWeekShipments([...shipmentTrendCache.previousWeekShipments]);
            return () => {
                active = false;
            };
        }

        Promise.all([
            loadShipments(weekRange(0)),
            loadShipments(weekRange(1)),
        ])
            .then(([currentWeek, previousWeek]) => {
                if (!active) {
                    return;
                }

                shipmentTrendCache.loaded = true;
                shipmentTrendCache.currentWeekShipments = currentWeek;
                shipmentTrendCache.previousWeekShipments = previousWeek;
                setCurrentWeekShipments([...currentWeek]);
                setPreviousWeekShipments([...previousWeek]);
            })
            .catch((error) => {
                if (active) {
                    showError(error);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="tm-page">
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

                <div className="tm-metrics-grid">
                    <section className="tm-card tm-order-overview">
                        <div className="tm-card-header">
                            <Typography variant="h5">{shipmentTranslations.metrics.summaryTitle}</Typography>
                            <div className="tm-card-actions">
                                <Button size="small" variant="outlined">{shipmentTranslations.metrics.week}</Button>
                                <button type="button"><OpenInFull fontSize="small" /></button>
                            </div>
                        </div>
                        <span className="tm-muted">{shipmentTranslations.metrics.allShipments}</span>
                        <div className="tm-total-line">
                            <strong>{shipmentMetrics.total.toLocaleString(pl.common.locale)}</strong>
                            <b className={trendClassName(shipmentTrend)}>
                                {trendIndicator(shipmentTrend)} {formatTrendPercent(shipmentTrend)}
                            </b>
                            <span>{shipmentTranslations.metrics.comparedToLastWeek}</span>
                        </div>
                        <div className="tm-order-stats">
                            <span><i className="tm-violet" />{shipmentTranslations.metrics.sent} <strong>{shipmentMetrics.sent}</strong></span>
                            <span><i className="tm-orange" />{shipmentTranslations.metrics.created} <strong>{shipmentMetrics.created}</strong></span>
                            <span><i className="tm-green" />{shipmentTranslations.metrics.delivered} <strong>{shipmentMetrics.delivered}</strong></span>
                            <span><i className="tm-blue" />{shipmentTranslations.metrics.handling} <strong>{shipmentMetrics.handling}</strong></span>
                        </div>
                        <div className="tm-progress-bar">
                            {progressSegments.some((segment) => segment.count > 0)
                                ? progressSegments
                                    .filter((segment) => segment.count > 0)
                                    .map((segment) => (
                                        <span
                                            aria-label={`${segment.label}: ${segment.count}`}
                                            className={segment.className}
                                            key={segment.className}
                                            style={{flexGrow: segment.count}}
                                        />
                                    ))
                                : <span className="tm-progress-empty" />}
                        </div>
                    </section>

                    <section className="tm-card tm-revenue-card">
                        <div className="tm-card-header">
                            <Typography variant="h5">{shipmentTranslations.metrics.valueTitle}</Typography>
                            <div className="tm-card-actions">
                                <Button size="small" variant="outlined">{shipmentTranslations.metrics.lastMonth}</Button>
                                <button type="button"><OpenInFull fontSize="small" /></button>
                            </div>
                        </div>
                        <div className="tm-revenue-layout">
                            <div>
                                <span className="tm-muted">{shipmentTranslations.metrics.totalValue}</span>
                                <strong>{formatMoneyBuckets(shipmentMetrics.moneyBuckets, "total")}</strong>
                                <div className="tm-loss-line">
                                    <b className={trendClassName(valueTrend)}>
                                        {trendIndicator(valueTrend)} {formatTrendPercent(valueTrend)}
                                    </b>
                                    <span>{shipmentTranslations.metrics.comparedToLastWeek}</span>
                                </div>
                            </div>
                            <div
                                className="tm-gauge"
                                style={{"--standard-share": `${standardGaugeShare}%`} as React.CSSProperties}
                            >
                                <span />
                            </div>
                        </div>
                        <div className="tm-revenue-legend">
                            <span><i className="tm-violet" />{shipmentTranslations.metrics.standard} <strong>{formatMoneyBuckets(shipmentMetrics.moneyBuckets, "standard")}</strong></span>
                            <span><i className="tm-orange" />{shipmentTranslations.metrics.express} <strong>{formatMoneyBuckets(shipmentMetrics.moneyBuckets, "express")}</strong></span>
                        </div>
                    </section>
                </div>

                <section className="tm-card tm-orders-card">
                    <div className="tm-orders-header">
                        <Typography variant="h5">{shipmentTranslations.table.title}</Typography>
                        <div className="tm-toolbar-actions">
                            <Button startIcon={<FilterList />} variant="outlined">{shipmentTranslations.actions.filters}</Button>
                            <Button startIcon={<Tune />} variant="outlined">{shipmentTranslations.actions.manage}</Button>
                            <Button startIcon={<FileDownload />} variant="outlined">{shipmentTranslations.actions.export}</Button>
                            <button className="tm-icon-button" type="button"><ViewList fontSize="small" /></button>
                            <button className="tm-icon-button" type="button"><GridView fontSize="small" /></button>
                        </div>
                    </div>

                    <div className="tm-orders-controls">
                        <div className="tm-tabs">
                            {shipmentTranslations.statusTabs.map((status) => (
                                <button
                                    className={status === activeStatus ? "tm-tab-active" : ""}
                                    disabled={loading && status === activeStatus}
                                    key={status}
                                    onClick={() => setActiveStatus(status)}
                                    type="button"
                                >
                                    {shipmentTranslations.status[status]}
                                </button>
                            ))}
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
                        {searchSource === "SYSTEM" ? (<>
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
                        </>) : (
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
                        <Button disabled={!appliedLookupId && !appliedLookupTrackingNumber && !externalResult} variant="text" onClick={clearLocalFilters}>
                            {shipmentTranslations.table.clearFilters}
                        </Button>
                        <TextField
                            label={shipmentTranslations.table.hasDangerousGoods}
                            select
                            size="small"
                            value={dangerousGoodsFilter}
                            onChange={(event) => setDangerousGoodsFilter(event.target.value as "ALL" | "YES" | "NO")}
                        >
                            <MenuItem value="ALL">{pl.common.all}</MenuItem>
                            <MenuItem value="YES">{shipmentTranslations.dangerousGood.yes}</MenuItem>
                            <MenuItem value="NO">{shipmentTranslations.dangerousGood.no}</MenuItem>
                        </TextField>
                        <TextField
                            label={shipmentTranslations.form.fields.unNumber}
                            size="small"
                            value={unNumberFilter}
                            onChange={(event) => setUnNumberFilter(event.target.value)}
                        />
                        <TextField
                            label={shipmentTranslations.form.fields.hazardClass}
                            size="small"
                            value={hazardClassFilter}
                            onChange={(event) => setHazardClassFilter(event.target.value)}
                        />
                    </div>

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

                    <div className="tm-table-wrap">
                        <table className="tm-orders-table">
                            <thead>
                            <tr>
                                <th><span className="tm-checkbox" /> {shipmentTranslations.table.columns.id}</th>
                                <th><Category fontSize="small" /> {shipmentTranslations.table.columns.size}</th>
                                <th><Person fontSize="small" /> {shipmentTranslations.table.columns.sender}</th>
                                <th><Person fontSize="small" /> {shipmentTranslations.table.columns.recipient}</th>
                                <th><AccessTime fontSize="small" /> {shipmentTranslations.table.columns.deliveryDate}</th>
                                <th><AttachMoney fontSize="small" /> {shipmentTranslations.table.columns.price}</th>
                                <th><Person fontSize="small" /> {shipmentTranslations.table.columns.user}</th>
                                <th className="tm-destination-heading"><Route fontSize="small" /> {shipmentTranslations.table.columns.destination}</th>
                                <th>{shipmentTranslations.table.columns.status}</th>
                                <th>{shipmentTranslations.table.columns.dangerousGoods}</th>
                                <th />
                            </tr>
                            </thead>
                            <tbody>
                            {visibleShipments.map((shipment) => {
                                const row = mapShipmentToRow(shipment);
                                return (
                                    <tr className="tm-clickable-row" key={row.id} onClick={() => openShipmentDetails(shipment)}>
                                        <td><span className="tm-checkbox" /> {row.id}</td>
                                        <td>{row.size}</td>
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
                                            <Chip
                                                aria-label={shipment.dangerousGood
                                                    ? shipmentTranslations.dangerousGood.presentAccessible
                                                    : shipmentTranslations.dangerousGood.absentAccessible}
                                                className={shipment.dangerousGood
                                                    ? "shipment-dangerous-chip-active"
                                                    : "shipment-dangerous-chip-empty"}
                                                label={shipment.dangerousGood?.unNumber
                                                    || shipmentTranslations.dangerousGood.emptyStatus}
                                                size="small"
                                            />
                                        </td>
                                        <td className="tm-actions-cell">
                                            <button
                                                aria-label={shipmentTranslations.table.rowActions.replace("{id}", row.id)}
                                                className="tm-row-action-button"
                                                type="button"
                                                onClick={(event) => openActionMenu(event, shipment)}
                                            >
                                                <MoreVert fontSize="small" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && shipmentRows.length === 0 ? (
                                <tr>
                                    <td className="tm-empty-row" colSpan={11}>{shipmentTranslations.table.empty}</td>
                                </tr>
                            ) : undefined}
                            </tbody>
                        </table>
                    </div>

                    <div className="tm-table-footer">
                        <span>{shipmentTranslations.table.shown} {shipmentRows.length} {shipmentTranslations.table.of} {shipments.length}</span>
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

            <Menu
                anchorEl={actionMenuAnchor}
                open={Boolean(actionMenuAnchor)}
                onClose={closeActionMenu}
            >
                <MenuItem onClick={handleOpenActionShipment}>
                    <ListItemIcon>
                        <InfoOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{shipmentTranslations.actions.details}</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenActionShipment}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{shipmentTranslations.actions.edit}</ListItemText>
                </MenuItem>
                <MenuItem onClick={copyTrackingNumber}>
                    <ListItemIcon>
                        <ContentCopy fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{shipmentTranslations.actions.copyTracking}</ListItemText>
                </MenuItem>
            </Menu>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentList;
