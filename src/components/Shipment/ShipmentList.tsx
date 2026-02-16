import React, {ChangeEvent, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {
    AccessTime,
    Add,
    AttachMoney,
    Category,
    FileDownload,
    FilterList,
    GridView,
    MoreVert,
    OpenInFull,
    Person,
    Route,
    Storefront,
    Tune,
    ViewList,
} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {ShipmentDto} from "./dto/ShipmentDto";
import "./styles/shipments.css";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

type OrderStatus = "Pending" | "Shipping" | "Delivered" | "Returned" | "Canceled" | "On Delivery";

type OrderRow = {
    id: string;
    category: string;
    merchant: string;
    customer: string;
    arrivalTime: string;
    fee: string;
    assignTo: string;
    routeFrom: string;
    routeTo: string;
    status: OrderStatus;
};

const demoOrders: OrderRow[] = [
    {id: "#0014ABCD", category: "Clothing", merchant: "Tov Talent", customer: "Theresa", arrivalTime: "17 May 2025", fee: "$120", assignTo: "Hawkins", routeFrom: "32 Danmondi", routeTo: "82 Subidbaz", status: "Pending"},
    {id: "#0013ABGS", category: "Electric", merchant: "Ahshav", customer: "Devon", arrivalTime: "18 May 2025", fee: "$121.5", assignTo: "Cameron", routeFrom: "21 Savar", routeTo: "24 New Market", status: "Shipping"},
    {id: "#0016ABLL", category: "Clothing", merchant: "Aviv Flavor", customer: "Cameron", arrivalTime: "18 May 2025", fee: "$35.61", assignTo: "Kathryn", routeFrom: "Devtakhum", routeTo: "Dhaka 1120", status: "Delivered"},
    {id: "#0018ABAA", category: "Accessories", merchant: "Simcha Spa", customer: "Darlene", arrivalTime: "17 May 2025", fee: "$98", assignTo: "Leslie", routeFrom: "42 Dulukampa", routeTo: "82 Subidbaz", status: "Returned"},
    {id: "#0013ABGG", category: "Electric", merchant: "Simcha Spa", customer: "Darlene", arrivalTime: "14 May 2025", fee: "$12", assignTo: "Leslie", routeFrom: "64 Handipas", routeTo: "212 Laksam", status: "Shipping"},
    {id: "#0011ABCD", category: "Clothing", merchant: "Sababa Fashion", customer: "Brooklyn", arrivalTime: "17 May 2025", fee: "$40", assignTo: "Brooklyn", routeFrom: "92 Saklin", routeTo: "13 Kataria", status: "Delivered"},
    {id: "#0009ABEE", category: "Accessories", merchant: "Sababa Fashion", customer: "Brooklyn", arrivalTime: "18 May 2025", fee: "$131", assignTo: "Brooklyn", routeFrom: "212 Laksam", routeTo: "10/2 Silango", status: "Pending"},
    {id: "#0023ABGG", category: "Electric", merchant: "Little Haifa", customer: "Floyd", arrivalTime: "15 May 2025", fee: "$125", assignTo: "Warren", routeFrom: "Denin Fanvos", routeTo: "15 South gol", status: "Shipping"},
    {id: "#0011ABVV", category: "Electric", merchant: "Little Haifa", customer: "Floyd", arrivalTime: "16 May 2025", fee: "$75", assignTo: "Warren", routeFrom: "72 Saltuki", routeTo: "64 Handipas", status: "Canceled"},
    {id: "#0011ABXZ", category: "Clothing", merchant: "Yalla Street Food", customer: "Leslie", arrivalTime: "16 May 2025", fee: "$32.5", assignTo: "Dianne", routeFrom: "1 Bugnai", routeTo: "32/2 Railgate area", status: "Delivered"},
    {id: "#0073ABPO", category: "Accessories", merchant: "Yalla Street Food", customer: "Leslie", arrivalTime: "16 May 2025", fee: "$10.65", assignTo: "Dianne", routeFrom: "13 Kataria", routeTo: "82 Subidbazar", status: "Delivered"},
];

const mapShipmentToOrder = (shipment: ShipmentDto): OrderRow => ({
    id: `#${shipment.shipmentId.value}`,
    category: shipment.shipmentSize || "Shipment",
    merchant: `${shipment.sender?.firstName || "Sender"} ${shipment.sender?.lastName || ""}`.trim(),
    customer: `${shipment.recipient?.firstName || "Recipient"} ${shipment.recipient?.lastName || ""}`.trim(),
    arrivalTime: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }),
    fee: shipment.price ? `${shipment.price.amount} ${shipment.price.currency}` : "$0",
    assignTo: "Manager Fleet",
    routeFrom: shipment.sender?.city || "Origin",
    routeTo: shipment.recipient?.city || shipment.destination || "Destination",
    status: shipment.shipmentStatus === "DELIVERY"
        ? "Delivered"
        : shipment.shipmentStatus === "RETURN"
            ? "Returned"
            : shipment.shipmentStatus === "SENT"
                ? "Shipping"
                : shipment.shipmentStatus === "REDIRECT"
                    ? "Canceled"
                    : "Pending",
});

const statusClassName = (status: OrderStatus) => `tm-status tm-status-${status.toLowerCase().replace(" ", "-")}`;

const avatarFor = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";

const ShipmentList: React.FC = () => {
    const navigate = useNavigate();
    const [lookupTrackingNumber, setLookupTrackingNumber] = useState<string>("");
    const [lookupId, setLookupId] = useState<string>("");
    const [shipments, setShipments] = useState<ShipmentDto[]>([]);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const orders = useMemo(() => {
        return shipments.length ? shipments.map(mapShipmentToOrder) : demoOrders;
    }, [shipments]);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => order.status === "Pending").length;
    const deliveredOrders = orders.filter((order) => order.status === "Delivered").length;
    const shippingOrders = orders.filter((order) => order.status === "Shipping" || order.status === "On Delivery").length;

    const numericShipmentId = (value: string): number => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            throw new Error("Podaj poprawny identyfikator przesyłki");
        }

        return parsed;
    };

    const showError = (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        const message = apiError.message || (error as Error).message || "Operacja nie powiodła się";
        setNotice({severity: "error", message});
    };

    const upsertShipment = (shipment: ShipmentDto) => {
        setShipments((currentShipments) => {
            const withoutCurrent = currentShipments.filter((current) => current.shipmentId.value !== shipment.shipmentId.value);
            return [shipment].concat(withoutCurrent);
        });
    };

    const runOperation = async (operation: () => Promise<void>) => {
        setLoading(true);
        try {
            await operation();
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    const findByTrackingNumber = () => runOperation(async () => {
        const response = await ShipmentService.getByTrackingNumber(lookupTrackingNumber.trim());
        upsertShipment(response.data);
        setNotice({severity: "success", message: "Przesyłka została dodana do tabeli"});
    });

    const findById = () => runOperation(async () => {
        const response = await ShipmentService.get(numericShipmentId(lookupId));
        upsertShipment(response.data);
        setNotice({severity: "success", message: "Przesyłka została dodana do tabeli"});
    });

    return (
        <div className="tm-page">
            <div className="tm-content">
                <div className="tm-top-row">
                    <div className="tm-page-heading">
                        <span className="tm-heading-kicker">Manager 2.0</span>
                        <Typography variant="h4">Przesyłki</Typography>
                        <p>Lista przesyłek z oddziału oraz szybkie operacje na backendzie.</p>
                    </div>
                    <Button
                        className="tm-add-new"
                        startIcon={<Add />}
                        variant="contained"
                        onClick={() => navigate("/shipments/create")}
                    >
                        Add new
                    </Button>
                </div>

                <div className="tm-metrics-grid">
                    <section className="tm-card tm-order-overview">
                        <div className="tm-card-header">
                            <Typography variant="h5">Order Overview</Typography>
                            <div className="tm-card-actions">
                                <Button size="small" variant="outlined">Week</Button>
                                <button type="button"><OpenInFull fontSize="small" /></button>
                            </div>
                        </div>
                        <span className="tm-muted">Total Order</span>
                        <div className="tm-total-line">
                            <strong>{totalOrders.toLocaleString()}</strong>
                            <b>↑ +10.5%</b>
                            <span>Compared to last week</span>
                        </div>
                        <div className="tm-order-stats">
                            <span><i className="tm-violet" />Active Order <strong>{shippingOrders}</strong></span>
                            <span><i className="tm-orange" />Pending Order <strong>{pendingOrders}</strong></span>
                            <span><i className="tm-green" />On Delivery <strong>{shippingOrders}</strong></span>
                            <span><i className="tm-blue" />Delivered <strong>{deliveredOrders}</strong></span>
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
                            <Typography variant="h5">Revenue</Typography>
                            <div className="tm-card-actions">
                                <Button size="small" variant="outlined">Last Month</Button>
                                <button type="button"><OpenInFull fontSize="small" /></button>
                            </div>
                        </div>
                        <div className="tm-revenue-layout">
                            <div>
                                <span className="tm-muted">Total Revenue</span>
                                <strong>$ 116K</strong>
                                <div className="tm-loss-line">
                                    <b>↓ -7.2%</b>
                                    <span>Compared to last week</span>
                                </div>
                            </div>
                            <div className="tm-gauge">
                                <span />
                            </div>
                        </div>
                        <div className="tm-revenue-legend">
                            <span><i className="tm-violet" />Online <strong>$ 74K</strong></span>
                            <span><i className="tm-orange" />Cash <strong>42K</strong></span>
                        </div>
                    </section>
                </div>

                <section className="tm-card tm-orders-card">
                    <div className="tm-orders-header">
                        <Typography variant="h5">Orders</Typography>
                        <div className="tm-toolbar-actions">
                            <Button startIcon={<FilterList />} variant="outlined">Filters</Button>
                            <Button startIcon={<Tune />} variant="outlined">Manage</Button>
                            <Button startIcon={<FileDownload />} variant="outlined">Export</Button>
                            <button className="tm-icon-button" type="button"><ViewList fontSize="small" /></button>
                            <button className="tm-icon-button" type="button"><GridView fontSize="small" /></button>
                        </div>
                    </div>

                    <div className="tm-orders-controls">
                        <div className="tm-tabs">
                            {["On Delivery", "Pending", "Shipping", "Delivered", "Canceled", "Returned"].map((tab, index) => (
                                <button className={index === 0 ? "tm-tab-active" : ""} key={tab} type="button">{tab}</button>
                            ))}
                        </div>
                    </div>

                    <div className="tm-manual-load">
                        <TextField
                            label="Shipment ID"
                            size="small"
                            type="number"
                            value={lookupId}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setLookupId(event.target.value)}
                        />
                        <Button disabled={loading || !lookupId} variant="outlined" onClick={findById}>
                            Load by ID
                        </Button>
                        <TextField
                            label="Tracking number"
                            size="small"
                            value={lookupTrackingNumber}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setLookupTrackingNumber(event.target.value)}
                        />
                        <Button disabled={loading || !lookupTrackingNumber} variant="outlined" onClick={findByTrackingNumber}>
                            Load by tracking
                        </Button>
                    </div>

                    <div className="tm-table-wrap">
                        <table className="tm-orders-table">
                            <thead>
                            <tr>
                                <th><span className="tm-checkbox" /> Order ID</th>
                                <th><Category fontSize="small" /> Category</th>
                                <th><Storefront fontSize="small" /> Merchant</th>
                                <th><Person fontSize="small" /> Customer</th>
                                <th><AccessTime fontSize="small" /> Arrival time</th>
                                <th><AttachMoney fontSize="small" /> Fee</th>
                                <th><Person fontSize="small" /> Assign to</th>
                                <th><Route fontSize="small" /> Route</th>
                                <th>Status</th>
                                <th />
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td><span className="tm-checkbox" /> {order.id}</td>
                                    <td>{order.category}</td>
                                    <td>
                                        <span className="tm-entity">
                                            <span className="tm-logo-avatar">{avatarFor(order.merchant)}</span>
                                            {order.merchant}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="tm-entity">
                                            <span className="tm-user-avatar">{avatarFor(order.customer)}</span>
                                            {order.customer}
                                        </span>
                                    </td>
                                    <td className="tm-muted-cell">{order.arrivalTime}</td>
                                    <td>{order.fee}</td>
                                    <td>
                                        <span className="tm-entity">
                                            <span className="tm-user-avatar tm-driver-avatar">{avatarFor(order.assignTo)}</span>
                                            {order.assignTo}
                                        </span>
                                    </td>
                                    <td className="tm-muted-cell">{order.routeFrom} <span className="tm-arrow">→</span> {order.routeTo}</td>
                                    <td><Chip className={statusClassName(order.status)} label={order.status} size="small" /></td>
                                    <td><MoreVert fontSize="small" /></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="tm-table-footer">
                        <span>Showing 1 of 5</span>
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

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentList;
