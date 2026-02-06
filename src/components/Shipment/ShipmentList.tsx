import React, {ChangeEvent, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {
    Add,
    ChatBubbleOutline,
    ContentCopy,
    Inventory2,
    LocalShipping,
    LocationOn,
    Phone,
    Search,
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

type ShipmentCard = {
    id: string;
    status: string;
    statusTone: "orange" | "purple" | "blue" | "green";
    estimatedTime: string;
    estimatedDate: string;
    senderAddress: string;
    senderCity: string;
    recipientAddress: string;
    recipientCity: string;
    recipientName: string;
    courier: string;
    type: string;
    quantity: string;
    weight: string;
    price: string;
};

const demoShipments: ShipmentCard[] = [
    {
        id: "657890",
        status: "On The Way",
        statusTone: "orange",
        estimatedTime: "03:50 PM",
        estimatedDate: "Dec 12, 2023",
        senderAddress: "206 Beach Blvd",
        senderCity: "Miami, FL 32104",
        recipientAddress: "102 Collins Ave",
        recipientCity: "Chicago, IL 20090",
        recipientName: "Saddam Ali",
        courier: "DHL Express",
        type: "Furniture",
        quantity: "10 Package",
        weight: "55 kg",
        price: "$550.99",
    },
    {
        id: "540775",
        status: "In Sorting Centre",
        statusTone: "purple",
        estimatedTime: "06:20 PM",
        estimatedDate: "Dec 13, 2023",
        senderAddress: "15 Green St",
        senderCity: "Warsaw, PL",
        recipientAddress: "77 Lake Road",
        recipientCity: "Berlin, DE",
        recipientName: "Muhammad Ali",
        courier: "Warehouse Fleet",
        type: "Standard",
        quantity: "4 Package",
        weight: "18 kg",
        price: "$120.00",
    },
    {
        id: "201998",
        status: "In Transit",
        statusTone: "blue",
        estimatedTime: "11:25 AM",
        estimatedDate: "Dec 14, 2023",
        senderAddress: "90 Depot Way",
        senderCity: "Poznan, PL",
        recipientAddress: "24 Harbor Ave",
        recipientCity: "Gdansk, PL",
        recipientName: "Anna Nowak",
        courier: "Internal",
        type: "Express",
        quantity: "1 Package",
        weight: "8 kg",
        price: "$49.90",
    },
];

const mapShipmentToCard = (shipment: ShipmentDto): ShipmentCard => ({
    id: shipment.shipmentId.value.toString(),
    status: shipment.shipmentStatus || "CREATED",
    statusTone: shipment.shipmentStatus === "DELIVERY" ? "green" : shipment.shipmentStatus === "RETURN" ? "orange" : "blue",
    estimatedTime: "03:50 PM",
    estimatedDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }),
    senderAddress: shipment.sender?.street || "Origin address",
    senderCity: [shipment.sender?.city, shipment.sender?.postalCode].filter(Boolean).join(", ") || "Origin city",
    recipientAddress: shipment.recipient?.street || shipment.destination || "Destination address",
    recipientCity: [shipment.recipient?.city, shipment.recipient?.postalCode].filter(Boolean).join(", ") || "Destination city",
    recipientName: `${shipment.recipient?.firstName || ""} ${shipment.recipient?.lastName || ""}`.trim() || "Recipient",
    courier: "Manager Fleet",
    type: shipment.shipmentSize || "Standard",
    quantity: "1 Package",
    weight: shipment.dangerousGood?.weight ? `${shipment.dangerousGood.weight.value} ${shipment.dangerousGood.weight.unit}` : "N/A",
    price: shipment.price ? `${shipment.price.amount} ${shipment.price.currency}` : "N/A",
});

const ShipmentList: React.FC = () => {
    const navigate = useNavigate();
    const [lookupTrackingNumber, setLookupTrackingNumber] = useState<string>("");
    const [lookupId, setLookupId] = useState<string>("");
    const [shipments, setShipments] = useState<ShipmentDto[]>([]);
    const [selectedShipmentId, setSelectedShipmentId] = useState<string>("657890");
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const shipmentCards = useMemo(() => {
        return shipments.length ? shipments.map(mapShipmentToCard) : demoShipments;
    }, [shipments]);

    const selectedShipment = shipmentCards.find((shipment) => shipment.id === selectedShipmentId) || shipmentCards[0];

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
        setSelectedShipmentId(shipment.shipmentId.value.toString());
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
        setNotice({severity: "success", message: "Przesyłka została dodana do listy"});
    });

    const findById = () => runOperation(async () => {
        const response = await ShipmentService.get(numericShipmentId(lookupId),
            "");
        upsertShipment(response.data);
        setNotice({severity: "success", message: "Przesyłka została dodana do listy"});
    });

    const filteredShipments = shipmentCards.filter((shipment) => {
        const query = lookupTrackingNumber.trim().toLowerCase();
        if (!query) {
            return true;
        }

        return shipment.id.toLowerCase().includes(query) || shipment.recipientName.toLowerCase().includes(query);
    });

    return (
        <div className="shipment-dashboard">
            <aside className="shipment-sidebar">
                <div className="shipment-logo">S</div>
                <div className="shipment-sidebar-links">
                    <span className="shipment-sidebar-dot" />
                    <span className="shipment-sidebar-dot shipment-sidebar-active"><LocalShipping fontSize="small" /></span>
                    <span className="shipment-sidebar-dot" />
                    <span className="shipment-sidebar-dot" />
                </div>
            </aside>

            <main className="shipment-board">
                <section className="shipment-list-column">
                    <div className="shipment-list-heading">
                        <Typography variant="h4">SHIPMENT</Typography>
                    </div>

                    <div className="shipment-search">
                        <Search fontSize="small" />
                        <input
                            aria-label="Search tracking number"
                            placeholder="Search tracking number"
                            value={lookupTrackingNumber}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setLookupTrackingNumber(event.target.value)}
                        />
                    </div>

                    <Button
                        className="shipment-add-load"
                        fullWidth
                        startIcon={<Add />}
                        variant="contained"
                        onClick={() => navigate("/shipments/create")}
                    >
                        Add Load
                    </Button>

                    <div className="shipment-id-search">
                        <TextField
                            fullWidth
                            label="Shipment ID"
                            size="small"
                            type="number"
                            value={lookupId}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setLookupId(event.target.value)}
                        />
                        <Button disabled={loading || !lookupId} variant="outlined" onClick={findById}>
                            Load
                        </Button>
                        <Button disabled={loading || !lookupTrackingNumber} variant="outlined" onClick={findByTrackingNumber}>
                            Track
                        </Button>
                    </div>

                    <div className="shipment-card-list">
                        {filteredShipments.map((shipment) => (
                            <button
                                className={`shipment-load-card${selectedShipment.id === shipment.id ? " shipment-load-card-active" : ""}`}
                                key={shipment.id}
                                onClick={() => setSelectedShipmentId(shipment.id)}
                                type="button"
                            >
                                <div className="shipment-load-card-top">
                                    <span className="shipment-package-icon"><Inventory2 fontSize="small" /></span>
                                    <strong>#{shipment.id}</strong>
                                    <span className={`shipment-status-pill shipment-status-${shipment.statusTone}`}>{shipment.status}</span>
                                </div>

                                {selectedShipment.id === shipment.id ? (
                                    <>
                                        <div className="shipment-load-divider" />
                                        <div className="shipment-estimate">
                                            <span>Estimated Time</span>
                                            <div>
                                                <strong>{shipment.estimatedTime.replace(" PM", "")}</strong>
                                                <small>PM</small>
                                                <b>{shipment.estimatedDate}</b>
                                            </div>
                                        </div>
                                        <div className="shipment-progress">
                                            <span className="shipment-progress-start" />
                                            <span className="shipment-progress-line" />
                                            <LocalShipping className="shipment-progress-truck" fontSize="small" />
                                            <span className="shipment-progress-dash" />
                                            <span className="shipment-progress-end"><LocationOn fontSize="small" /></span>
                                        </div>
                                        <div className="shipment-address-row">
                                            <div>
                                                <strong>{shipment.senderAddress}</strong>
                                                <span>{shipment.senderCity}</span>
                                            </div>
                                            <div>
                                                <strong>{shipment.recipientAddress}</strong>
                                                <span>{shipment.recipientCity}</span>
                                            </div>
                                        </div>
                                        <div className="shipment-recipient-row">
                                            <span className="shipment-avatar">{shipment.recipientName.charAt(0)}</span>
                                            <div>
                                                <strong>{shipment.recipientName}</strong>
                                                <span>Recipient</span>
                                            </div>
                                            <span className="shipment-round-action"><Phone fontSize="small" /></span>
                                            <span className="shipment-round-action shipment-round-action-solid"><ChatBubbleOutline fontSize="small" /></span>
                                        </div>
                                    </>
                                ) : null}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="shipment-detail-column">
                    <div className="shipment-map-card">
                        <div className="shipment-map">
                            <span className="shipment-river shipment-river-one" />
                            <span className="shipment-river shipment-river-two" />
                            <span className="shipment-route" />
                            <span className="shipment-map-pin"><LocationOn fontSize="small" /></span>
                            <span className="shipment-map-truck"><LocalShipping fontSize="small" /></span>
                        </div>
                    </div>

                    <div className="shipment-info-layout">
                        <div className="shipment-info-stack">
                            <div className="shipment-info-card">
                                <Typography variant="h5">Shipping Info</Typography>
                                <div className="shipment-info-grid">
                                    <div>
                                        <span>Tracking number</span>
                                        <strong>#{selectedShipment.id}</strong>
                                        <ContentCopy fontSize="inherit" />
                                    </div>
                                    <div>
                                        <span>Courier</span>
                                        <strong>{selectedShipment.courier}</strong>
                                    </div>
                                    <div>
                                        <span>Type</span>
                                        <strong>{selectedShipment.type}</strong>
                                    </div>
                                    <div>
                                        <span>Quantity</span>
                                        <strong>{selectedShipment.quantity}</strong>
                                    </div>
                                    <div>
                                        <span>Weight</span>
                                        <strong>{selectedShipment.weight}</strong>
                                    </div>
                                    <div>
                                        <span>Price</span>
                                        <strong>{selectedShipment.price}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="shipment-info-card">
                                <Typography variant="h5">Driver Info</Typography>
                                <div className="shipment-driver-main">
                                    <span className="shipment-driver-avatar">M</span>
                                    <div>
                                        <strong>Muhammad Ali</strong>
                                        <span>Online</span>
                                    </div>
                                    <span className="shipment-round-action"><Phone fontSize="small" /></span>
                                    <span className="shipment-round-action"><ChatBubbleOutline fontSize="small" /></span>
                                </div>
                                <div className="shipment-info-grid shipment-driver-grid">
                                    <div>
                                        <span>Truck number</span>
                                        <strong>B 3129 KVK</strong>
                                    </div>
                                    <div>
                                        <span>Truck type</span>
                                        <strong>Trailer Truck</strong>
                                    </div>
                                    <div>
                                        <span>Trailer number</span>
                                        <strong>TN-32-40-5</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="shipment-route-card">
                            <Typography variant="h5">Route Detail</Typography>
                            {["Dec 9, 2023", "Dec 10, 2023", "Dec 11, 2023", "Dec 12, 2023"].map((date, index) => (
                                <div className="shipment-route-step" key={date}>
                                    <span className="shipment-route-node" />
                                    <div>
                                        <strong>{date}</strong>
                                        <span>{index === 0 ? "08:00 AM" : index === 3 ? "11:25 AM" : "10:50 AM"}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="shipment-route-step shipment-route-step-muted">
                                <span className="shipment-route-node"><LocationOn fontSize="small" /></span>
                                <div>
                                    <strong>Dec 12, 2023</strong>
                                    <span>03:50 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentList;
