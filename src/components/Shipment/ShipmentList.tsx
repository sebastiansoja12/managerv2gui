import React, {ChangeEvent, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
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
} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {ShipmentDto, ShipmentStatusDto} from "./dto/ShipmentDto";
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
    destination: shipment.destination || shipment.recipient?.city || "-",
    status: shipment.shipmentStatus,
});

const statusClassName = (status: ShipmentStatusDto) => `tm-status tm-status-${status.toLowerCase()}`;

const avatarFor = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";

const DEFAULT_STATUS_FILTER: ShipmentStatusDto = "CREATED";

type ShipmentListProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
    variant?: "list" | "controlCenter";
};

const ShipmentList: React.FC<ShipmentListProps> = ({onOpenTab, variant = "list"}) => {
    const navigate = useNavigate();
    const [lookupTrackingNumber, setLookupTrackingNumber] = useState<string>("");
    const [lookupId, setLookupId] = useState<string>("");
    const [appliedLookupTrackingNumber, setAppliedLookupTrackingNumber] = useState<string>("");
    const [appliedLookupId, setAppliedLookupId] = useState<string>("");
    const [activeStatus, setActiveStatus] = useState<ShipmentStatusDto>(DEFAULT_STATUS_FILTER);
    const [shipments, setShipments] = useState<ShipmentDto[]>(shipmentListCache.shipments);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
    const [actionShipment, setActionShipment] = useState<ShipmentDto | null>(null);

    const visibleShipments = useMemo(() => {
        return shipments
            .filter((shipment) => shipment.shipmentStatus === activeStatus)
            .filter((shipment) => !appliedLookupId || shipment.shipmentId.value.toString() === appliedLookupId)
            .filter((shipment) => {
                const trackingNumber = shipment.trackingNumber?.value || "";
                return !appliedLookupTrackingNumber || trackingNumber.toLowerCase().includes(appliedLookupTrackingNumber.toLowerCase());
            });
    }, [activeStatus, appliedLookupId, appliedLookupTrackingNumber, shipments]);

    const shipmentRows = useMemo(() => {
        return visibleShipments.map(mapShipmentToRow);
    }, [visibleShipments]);

    const totalShipments = shipments.length;
    const createdShipments = shipments.filter((shipment) => shipment.shipmentStatus === "CREATED").length;
    const deliveredShipments = shipments.filter((shipment) => shipment.shipmentStatus === "DELIVERY").length;
    const sentShipments = shipments.filter((shipment) => shipment.shipmentStatus === "SENT").length;
    const exceptionShipments = shipments.filter((shipment) => ["REROUTE", "REDIRECT", "RETURN"].includes(shipment.shipmentStatus)).length;

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
    };

    const openShipmentDetails = (shipment: ShipmentDto) => {
        const shipmentId = shipment.shipmentId.value;
        const trackingNumber = shipment.trackingNumber?.value;
        const label = trackingNumber
            ? `${pl.home.tiles.shipmentControlCenter.title} ${trackingNumber}`
            : `${pl.home.tiles.shipmentControlCenter.title} #${shipmentId}`;
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
        ShipmentService.search({
            page: 0,
            size: 50,
        })
            .then((response) => {
                if (active) {
                    shipmentListCache.loaded = true;
                    shipmentListCache.shipments = response.data;
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

    return (
        <div className="tm-page">
            <div className="tm-content">
                <div className="tm-top-row">
                    <div className="tm-page-heading">
                        <span className="tm-heading-kicker">{pl.common.brand}</span>
                        <Typography variant="h4">
                            {variant === "controlCenter" ? pl.shipments.page.controlCenterTitle : pl.shipments.page.title}
                        </Typography>
                        <p>{variant === "controlCenter" ? pl.shipments.page.controlCenterSubtitle : pl.shipments.page.subtitle}</p>
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
                            <strong>{totalShipments.toLocaleString()}</strong>
                            <b>↑ +10.5%</b>
                            <span>{shipmentTranslations.metrics.comparedToLastWeek}</span>
                        </div>
                        <div className="tm-order-stats">
                            <span><i className="tm-violet" />{shipmentTranslations.metrics.sent} <strong>{sentShipments}</strong></span>
                            <span><i className="tm-orange" />{shipmentTranslations.metrics.created} <strong>{createdShipments}</strong></span>
                            <span><i className="tm-green" />{shipmentTranslations.metrics.delivered} <strong>{deliveredShipments}</strong></span>
                            <span><i className="tm-blue" />{shipmentTranslations.metrics.handling} <strong>{exceptionShipments}</strong></span>
                        </div>
                        <div className="tm-progress-bar">
                            <span className="tm-progress-violet" />
                            <span className="tm-progress-orange" />
                            <span className="tm-progress-green" />
                            <span className="tm-progress-blue" />
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
                                <strong>{shipmentTranslations.metrics.totalValueAmount}</strong>
                                <div className="tm-loss-line">
                                    <b>↓ -7.2%</b>
                                    <span>{shipmentTranslations.metrics.comparedToLastWeek}</span>
                                </div>
                            </div>
                            <div className="tm-gauge">
                                <span />
                            </div>
                        </div>
                        <div className="tm-revenue-legend">
                            <span><i className="tm-violet" />{shipmentTranslations.metrics.standard} <strong>{shipmentTranslations.metrics.standardAmount}</strong></span>
                            <span><i className="tm-orange" />{shipmentTranslations.metrics.express} <strong>{shipmentTranslations.metrics.expressAmount}</strong></span>
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
                            label={shipmentTranslations.table.shipmentId}
                            size="small"
                            inputProps={{inputMode: "numeric", pattern: "[0-9]*"}}
                            value={lookupId}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setLookupId(event.target.value)}
                        />
                        <Button disabled={loading || !lookupId} variant="outlined" onClick={findById}>
                            {shipmentTranslations.table.filterById}
                        </Button>
                        <TextField
                            label={shipmentTranslations.table.trackingNumber}
                            size="small"
                            value={lookupTrackingNumber}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setLookupTrackingNumber(event.target.value)}
                        />
                        <Button disabled={loading || !lookupTrackingNumber} variant="outlined" onClick={findByTrackingNumber}>
                            {shipmentTranslations.table.filterByTracking}
                        </Button>
                        <Button disabled={!appliedLookupId && !appliedLookupTrackingNumber} variant="text" onClick={clearLocalFilters}>
                            {shipmentTranslations.table.clearFilters}
                        </Button>
                    </div>

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
                                <th><Route fontSize="small" /> {shipmentTranslations.table.columns.destination}</th>
                                <th>{shipmentTranslations.table.columns.status}</th>
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
                                        <td className="tm-muted-cell">{row.destination}</td>
                                        <td>
                                            <Chip
                                                className={statusClassName(row.status)}
                                                label={shipmentTranslations.status[row.status]}
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
                                    <td className="tm-empty-row" colSpan={10}>{shipmentTranslations.table.empty}</td>
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
