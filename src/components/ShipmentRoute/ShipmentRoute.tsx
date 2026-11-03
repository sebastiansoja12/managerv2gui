import React, {FormEvent, useEffect, useMemo, useState} from "react";
import {Alert, Button, TextField, Typography} from "components/ui";
import {Download, Hub, LocationOn, Route, Search, Storefront, Warehouse} from "components/ui/icons";
import {ApiErrorResponse} from "../../api/ApiResult";
import Department from "../../class/depots/Department";
import DeliveryNetworkService, {ShipmentRouteDocumentKind} from "../../hooks/DeliveryNetworkService";
import DepartmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import ShipmentRouteMap from "./ShipmentRouteMap";
import {ShipmentRoute as ShipmentRouteModel} from "./model/ShipmentRoute";
import {buildShipmentRouteStops, RouteRole, ShipmentRouteStop} from "./model/shipmentRouteStops";
import "./styles/shipment-route.css";

const roleIcons: Record<RouteRole, React.ElementType> = {
    origin: Storefront,
    transfer: Hub,
    destination: LocationOn,
};

const SORTING_FACILITY = "SORTING_FACILITY";

const resolveErrorMessage = (error: unknown) => {
    const translations = pl.shipmentRoute.errors;
    const status = (error as ApiErrorResponse)?.status;
    if (status === 404) {
        return translations.notFound;
    }
    if (status === 422) {
        return translations.routeUnavailable;
    }
    return translations.generic;
};

const departmentTypeLabel = (departmentType: string) => (
    (pl.departments.type as Record<string, string>)[departmentType] ?? departmentType
);

const formatKilometers = (distanceInKilometers: number) => pl.shipmentRoute.result.distanceValue.replace(
    "{distance}",
    distanceInKilometers.toLocaleString(pl.common.locale, {maximumFractionDigits: 0}),
);

function ShipmentRoute() {
    const translations = pl.shipmentRoute;
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shipmentRoute, setShipmentRoute] = useState<ShipmentRouteModel | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloadingDocument, setDownloadingDocument] = useState<ShipmentRouteDocumentKind | null>(null);

    useEffect(() => {
        let active = true;
        DepartmentService.getAll()
            .then((response) => {
                if (active) {
                    setDepartments(response.data || []);
                }
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, []);

    const stops = useMemo(
        () => (shipmentRoute ? buildShipmentRouteStops(shipmentRoute, departments) : []),
        [departments, shipmentRoute],
    );
    const stopsFromDestination = useMemo(() => [...stops].reverse(), [stops]);

    const findRoute = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedTrackingNumber = trackingNumber.trim();
        if (!normalizedTrackingNumber) {
            setErrorMessage(translations.form.numberRequired);
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        setShipmentRoute(null);
        try {
            const response = await DeliveryNetworkService.getShipmentRoute(normalizedTrackingNumber);
            setShipmentRoute(response.data);
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const downloadDocument = async (documentKind: ShipmentRouteDocumentKind) => {
        if (!shipmentRoute) {
            return;
        }
        setDownloadingDocument(documentKind);
        setErrorMessage(null);
        try {
            const document = await DeliveryNetworkService.getShipmentRouteDocument(
                shipmentRoute.trackingNumber,
                documentKind,
            );
            DeliveryNetworkService.saveWorkbook(document);
        } catch (error) {
            setErrorMessage((error as {response?: {status?: number}})?.response?.status === 422
                ? translations.errors.routeUnavailable
                : translations.errors.documentError);
        } finally {
            setDownloadingDocument(null);
        }
    };

    const routeSummary = (route: ShipmentRouteModel) => {
        const transferCount = Math.max(route.departments.length - 2, 0);
        if (route.departments.length === 1) {
            return translations.result.localDelivery;
        }
        if (transferCount === 0) {
            return translations.result.direct;
        }
        return translations.result.transfers.replace("{count}", String(transferCount));
    };

    const renderStop = (stop: ShipmentRouteStop, index: number) => {
        const branchTransfer = stop.role === "transfer" && stop.routeDepartment.departmentType !== SORTING_FACILITY;
        const RoleIcon = branchTransfer ? Warehouse : roleIcons[stop.role];
        const nextStopInList = stopsFromDestination[index + 1];
        const address = stop.department?.address;
        return (
            <li className={`shipment-route-stop shipment-route-stop-${stop.role}${branchTransfer ? " shipment-route-stop-branch-transfer" : ""}`} key={stop.routeDepartment.departmentId}>
                <div className="shipment-route-stop-card">
                    <span className="shipment-route-stop-icon"><RoleIcon/></span>
                    <div className="shipment-route-stop-body">
                        <span className="shipment-route-stop-role">{translations.roles[stop.role]}</span>
                        <strong className="shipment-route-stop-code">{stop.routeDepartment.departmentCode}</strong>
                        <span className="shipment-route-stop-meta">
                            {departmentTypeLabel(stop.routeDepartment.departmentType)}
                            {address ? ` · ${address.postalCode} ${address.city}, ${address.street}` : ""}
                        </span>
                    </div>
                </div>
                {nextStopInList && (
                    <div className="shipment-route-leg" aria-hidden="true">
                        <span className="shipment-route-leg-line"/>
                        <span className="shipment-route-leg-label">
                            {stop.distanceFromPreviousInKilometers === null
                                ? translations.result.legUnknown
                                : formatKilometers(stop.distanceFromPreviousInKilometers)}
                        </span>
                    </div>
                )}
            </li>
        );
    };

    return (
        <main className="shipment-route-page">
            <div className="shipment-route-shell">
                <section className="shipment-route-header">
                    <span className="shipment-route-title-icon"><Route/></span>
                    <div>
                        <Typography variant="h4">{translations.page.title}</Typography>
                        <p>{translations.page.subtitle}</p>
                    </div>
                </section>

                <section className="shipment-route-panel">
                    <form className="shipment-route-form" onSubmit={findRoute}>
                        <TextField
                            autoComplete="off"
                            disabled={loading}
                            label={translations.form.inputLabel}
                            placeholder={translations.form.placeholder}
                            size="small"
                            value={trackingNumber}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTrackingNumber(event.target.value)}
                        />
                        <Button disabled={loading} startIcon={<Search/>} type="submit" variant="contained">
                            {translations.form.submit}
                        </Button>
                    </form>
                    {errorMessage ? (
                        <Alert severity="error">{errorMessage}</Alert>
                    ) : (
                        <p className="shipment-route-hint">{translations.hint}</p>
                    )}
                </section>

                {shipmentRoute && (
                    <section className="shipment-route-result" aria-live="polite">
                        <div className="shipment-route-panel shipment-route-plan">
                            <div className="shipment-route-result-header">
                                <Typography variant="h5">{translations.result.title}</Typography>
                                <span className="shipment-route-badge">{routeSummary(shipmentRoute)}</span>
                            </div>
                            <div className="shipment-route-documents">
                                <Button
                                    disabled={downloadingDocument !== null}
                                    startIcon={<Download/>}
                                    variant="outlined"
                                    onClick={() => downloadDocument("route")}
                                >
                                    {downloadingDocument === "route"
                                        ? translations.documents.downloading
                                        : translations.documents.route}
                                </Button>
                                <Button
                                    disabled={downloadingDocument !== null}
                                    startIcon={<Download/>}
                                    variant="outlined"
                                    onClick={() => downloadDocument("handling-plan")}
                                >
                                    {downloadingDocument === "handling-plan"
                                        ? translations.documents.downloading
                                        : translations.documents.handlingPlan}
                                </Button>
                            </div>
                            <dl className="shipment-route-summary">
                                <div>
                                    <dt>{translations.result.trackingNumber}</dt>
                                    <dd>{shipmentRoute.trackingNumber}</dd>
                                </div>
                                <div>
                                    <dt>{translations.result.legs}</dt>
                                    <dd>{Math.max(shipmentRoute.departments.length - 1, 0)}</dd>
                                </div>
                                <div>
                                    <dt>{translations.result.distance}</dt>
                                    <dd>{shipmentRoute.distanceInKilometers === null
                                        ? translations.result.distanceUnknown
                                        : formatKilometers(shipmentRoute.distanceInKilometers)}</dd>
                                </div>
                            </dl>
                            <ol className="shipment-route-stops">
                                {stopsFromDestination.map(renderStop)}
                            </ol>
                        </div>
                        <div className="shipment-route-panel shipment-route-map-panel">
                            <Typography variant="h5">{translations.map.title}</Typography>
                            <ShipmentRouteMap stops={stops}/>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

export default ShipmentRoute;
