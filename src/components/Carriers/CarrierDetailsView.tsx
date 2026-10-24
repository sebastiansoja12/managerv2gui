import React, {useCallback, useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {Alert, Button, Chip, CircularProgress, IconButton, Typography} from "components/ui";
import {Add, Block, CheckCircle, Edit, LocalShipping, Refresh} from "components/ui/icons";
import CarrierService from "../../hooks/CarrierService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {TRANSPORT_TYPES} from "../Pallets/model/Pallet";
import {palletErrorMessage, transportTypeLabel} from "../Pallets/palletLabels";
import {driverDetailsTab} from "./carrierNavigation";
import CarrierVehicleCreateDialog from "./CarrierVehicleCreateDialog";
import EditableFieldList from "./EditableFieldList";
import FieldEditDialog, {EditedField} from "./FieldEditDialog";
import {CarrierDto, CarrierField, CarrierVehicleDto, VEHICLE_TYPES, VehicleField} from "./model/Carrier";
import "../Pallets/styles/pallets.css";
import "./styles/carriers.css";

type CarrierDetailsViewProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

function CarrierDetailsView({onOpenTab}: CarrierDetailsViewProps) {
    const translations = pl.carriers;
    const {carrierId = ""} = useParams();
    const [carrier, setCarrier] = useState<CarrierDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [vehicleOpen, setVehicleOpen] = useState(false);
    const [editedField, setEditedField] = useState<EditedField | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setCarrier((await CarrierService.get(decodeURIComponent(carrierId))).data);
        } catch (loadError) {
            setCarrier(null);
            setError(palletErrorMessage(loadError, translations.view.loadError));
        } finally {
            setLoading(false);
        }
    }, [carrierId, translations.view.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return <main className="pallet-page"><div className="pallet-shell"><p className="pallet-hint"><CircularProgress size={18} /> {translations.view.loading}</p></div></main>;
    }

    if (!carrier) {
        return (
            <main className="pallet-page">
                <div className="pallet-shell">
                    <Alert severity="error">{error || translations.view.loadError}</Alert>
                    <div><Button startIcon={<Refresh />} variant="outlined" onClick={load}>{pl.common.refresh}</Button></div>
                </div>
            </main>
        );
    }

    const editCarrierField = (field: CarrierField, label: string, value?: string | null,
                              options?: EditedField["options"], required = false) => setEditedField({
        title: translations.fieldEdit.title.replace("{field}", label).replace("{name}", carrier.name),
        label,
        value: value || "",
        required,
        options,
        save: async (newValue) => setCarrier((await CarrierService.changeField(carrier.carrierId, field, newValue)).data),
    });

    const editVehicleField = (vehicle: CarrierVehicleDto, field: VehicleField, label: string,
                              value?: string | number | null, options?: EditedField["options"], required = false) => setEditedField({
        title: translations.fieldEdit.title.replace("{field}", label).replace("{name}", vehicle.registrationNumber),
        label,
        value: value === null || value === undefined ? "" : String(value),
        required,
        options,
        inputMode: field === "max-load" ? "decimal" : "text",
        save: async (newValue) => setCarrier((await CarrierService.changeVehicleField(carrier.carrierId, vehicle.vehicleId, field, newValue)).data),
    });

    const runToggle = async (action: () => Promise<CarrierDto>, message: string) => {
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            setCarrier(await action());
            setNotice(message);
        } catch (toggleError) {
            setError(palletErrorMessage(toggleError, translations.fieldEdit.error));
        } finally {
            setBusy(false);
        }
    };

    const transportOptions = TRANSPORT_TYPES.map((type) => ({value: type, label: transportTypeLabel(type)}));
    const vehicleTypeOptions = VEHICLE_TYPES.map((type) => ({value: type, label: translations.vehicleType[type]}));
    const statusLabel = (active: boolean) => active ? translations.list.active : translations.list.inactive;

    return (
        <main className="pallet-page">
            <div className="pallet-shell">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><LocalShipping /></span>
                        <div>
                            <Typography variant="h4">{carrier.name}</Typography>
                            <p><Chip color={carrier.active ? "success" : "default"} label={statusLabel(carrier.active)} size="small" /></p>
                        </div>
                    </div>
                    <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} onClick={load}><Refresh fontSize="small" /></IconButton>
                </section>

                <nav aria-label={translations.view.actions} className="pallet-toolbar">
                    <Button disabled={busy} startIcon={<Add />} onClick={() => setVehicleOpen(true)}>{translations.vehicles.add}</Button>
                    <Button disabled={busy} startIcon={carrier.active ? <Block /> : <CheckCircle />} variant="outlined"
                            onClick={() => runToggle(async () => (await CarrierService.changeActive(carrier.carrierId, !carrier.active)).data,
                                carrier.active ? translations.list.deactivated : translations.list.activated)}>
                        {carrier.active ? translations.list.deactivate : translations.list.activate}
                    </Button>
                </nav>

                {error ? <Alert severity="error">{error}</Alert> : null}
                {notice ? <Alert severity="success">{notice}</Alert> : null}

                <section className="pallet-details-grid">
                    <div className="pallet-details-column">
                        <div className="pallet-panel">
                            <Typography variant="h5">{translations.details.title}</Typography>
                            <EditableFieldList rows={[
                                {key: "name", label: translations.columns.name, value: carrier.name,
                                    onEdit: () => editCarrierField("name", translations.columns.name, carrier.name, undefined, true)},
                                {key: "tax-id", label: translations.columns.taxId, value: carrier.taxId,
                                    onEdit: () => editCarrierField("tax-id", translations.columns.taxId, carrier.taxId)},
                                {key: "phone", label: translations.columns.phone, value: carrier.phone,
                                    onEdit: () => editCarrierField("phone", translations.columns.phone, carrier.phone)},
                                {key: "email", label: translations.columns.email, value: carrier.email,
                                    onEdit: () => editCarrierField("email", translations.columns.email, carrier.email)},
                                {key: "default-transport-type", label: translations.columns.transportType, value: transportTypeLabel(carrier.defaultTransportType),
                                    onEdit: () => editCarrierField("default-transport-type", translations.columns.transportType,
                                        carrier.defaultTransportType, transportOptions, true)},
                                {key: "status", label: translations.columns.status, value: statusLabel(carrier.active)},
                            ]} />
                        </div>
                    </div>
                    <div className="pallet-details-column">
                        <div className="pallet-panel">
                            <Typography variant="h5">{translations.view.driversTitle}</Typography>
                            <div className="pallet-table-wrap">
                                <table className="pallet-table">
                                    <thead>
                                        <tr>
                                            <th>{pl.drivers.columns.lastName}</th>
                                            <th>{pl.drivers.columns.firstName}</th>
                                            <th>{pl.drivers.columns.phone}</th>
                                            <th>{translations.columns.status}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carrier.drivers.length ? carrier.drivers.map((driver) => (
                                            <tr className="pallet-row" key={driver.driverId} tabIndex={0}
                                                onClick={() => onOpenTab?.(driverDetailsTab(driver))}
                                                onKeyDown={(event) => event.key === "Enter" && onOpenTab?.(driverDetailsTab(driver))}>
                                                <td>{driver.lastName}</td>
                                                <td>{driver.firstName}</td>
                                                <td>{driver.phone || pl.common.dash}</td>
                                                <td><Chip color={driver.active ? "success" : "default"} label={statusLabel(driver.active)} size="small" /></td>
                                            </tr>
                                        )) : (
                                            <tr><td className="pallet-empty" colSpan={4}>{translations.view.driversEmpty}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="pallet-panel">
                    <div className="pallet-panel-header">
                        <Typography variant="h5">{translations.vehicles.title}</Typography>
                        <Button disabled={busy} startIcon={<Add />} variant="text" onClick={() => setVehicleOpen(true)}>{translations.vehicles.add}</Button>
                    </div>
                    <div className="pallet-table-wrap">
                        <table className="pallet-table">
                            <thead>
                                <tr>
                                    <th>{translations.vehicles.registrationNumber}</th>
                                    <th>{translations.vehicles.brand}</th>
                                    <th>{translations.vehicles.model}</th>
                                    <th>{translations.vehicles.vehicleType}</th>
                                    <th>{translations.vehicles.trailerRegistrationNumber}</th>
                                    <th>{translations.vehicles.maxLoadKg}</th>
                                    <th>{translations.columns.status}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrier.vehicles.length ? carrier.vehicles.map((vehicle) => (
                                    <tr key={vehicle.vehicleId}>
                                        <td><EditableCell label={translations.vehicles.registrationNumber} value={vehicle.registrationNumber}
                                                          onEdit={() => editVehicleField(vehicle, "registration-number", translations.vehicles.registrationNumber, vehicle.registrationNumber, undefined, true)} /></td>
                                        <td><EditableCell label={translations.vehicles.brand} value={vehicle.brand}
                                                          onEdit={() => editVehicleField(vehicle, "brand", translations.vehicles.brand, vehicle.brand)} /></td>
                                        <td><EditableCell label={translations.vehicles.model} value={vehicle.model}
                                                          onEdit={() => editVehicleField(vehicle, "model", translations.vehicles.model, vehicle.model)} /></td>
                                        <td><EditableCell label={translations.vehicles.vehicleType} value={translations.vehicleType[vehicle.vehicleType]}
                                                          onEdit={() => editVehicleField(vehicle, "vehicle-type", translations.vehicles.vehicleType, vehicle.vehicleType, vehicleTypeOptions, true)} /></td>
                                        <td><EditableCell label={translations.vehicles.trailerRegistrationNumber} value={vehicle.trailerRegistrationNumber}
                                                          onEdit={() => editVehicleField(vehicle, "trailer-registration-number", translations.vehicles.trailerRegistrationNumber, vehicle.trailerRegistrationNumber)} /></td>
                                        <td><EditableCell label={translations.vehicles.maxLoadKg}
                                                          value={vehicle.maxLoadKg === null || vehicle.maxLoadKg === undefined ? null : `${vehicle.maxLoadKg} KG`}
                                                          onEdit={() => editVehicleField(vehicle, "max-load", translations.vehicles.maxLoadKg, vehicle.maxLoadKg)} /></td>
                                        <td>
                                            <span className="carrier-status-cell">
                                                <Chip color={vehicle.active ? "success" : "default"} label={statusLabel(vehicle.active)} size="small" />
                                                <Button disabled={busy} variant="text"
                                                        onClick={() => runToggle(async () => (await CarrierService.changeVehicleActive(carrier.carrierId, vehicle.vehicleId, !vehicle.active)).data,
                                                            vehicle.active ? translations.list.deactivated : translations.list.activated)}>
                                                    {vehicle.active ? translations.list.deactivate : translations.list.activate}
                                                </Button>
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td className="pallet-empty" colSpan={7}>{translations.vehicles.empty}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <CarrierVehicleCreateDialog
                carrier={carrier}
                open={vehicleOpen}
                onClose={() => setVehicleOpen(false)}
                onCreated={(updated) => {
                    setVehicleOpen(false);
                    setCarrier(updated);
                    setNotice(translations.vehicles.added);
                }}
            />
            <FieldEditDialog field={editedField} onClose={() => setEditedField(null)} onSaved={() => {
                setEditedField(null);
                setNotice(translations.fieldEdit.saved);
            }} />
        </main>
    );
}

export function EditableCell({label, value, onEdit}: {label: string; value?: string | null; onEdit: () => void}) {
    return (
        <span className="carrier-editable-cell">
            <span>{value || pl.common.dash}</span>
            <IconButton aria-label={pl.carriers.fieldEdit.edit.replace("{field}", label)} size="small"
                        title={pl.carriers.fieldEdit.edit.replace("{field}", label)} onClick={onEdit}>
                <Edit fontSize="small" />
            </IconButton>
        </span>
    );
}

export default CarrierDetailsView;
