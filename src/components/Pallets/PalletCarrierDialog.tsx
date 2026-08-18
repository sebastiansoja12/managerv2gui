import React, {FormEvent, useEffect, useMemo, useState} from "react";
import {createPortal} from "react-dom";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, TextField} from "components/ui";
import {LocalShipping, PersonAdd} from "components/ui/icons";
import CarrierService from "../../hooks/CarrierService";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import CarrierCreateDialog from "../Carriers/CarrierCreateDialog";
import {CarrierDto} from "../Carriers/model/Carrier";
import {PalletDto, TRANSPORT_TYPES, TransportTypeDto} from "./model/Pallet";
import {palletErrorMessage, transportTypeLabel} from "./palletLabels";

type PalletCarrierDialogProps = {
    open: boolean;
    pallet: PalletDto;
    onClose: () => void;
    onSaved: (pallet: PalletDto) => void;
};

const MANUAL = "manual";

const initialForm = (pallet: PalletDto) => ({
    carrierId: pallet.carrier ? String(pallet.carrier.carrierId) : "",
    transportType: (pallet.carrier?.transportType || "") as TransportTypeDto | "",
    driverId: pallet.carrier?.driverId ? String(pallet.carrier.driverId) : (pallet.carrier?.driverName ? MANUAL : ""),
    driverName: pallet.carrier?.driverId ? "" : pallet.carrier?.driverName || "",
    driverPhone: pallet.carrier?.driverId ? "" : pallet.carrier?.driverPhone || "",
    vehicleId: pallet.carrier?.vehicleId ? String(pallet.carrier.vehicleId) : (pallet.carrier ? MANUAL : ""),
    vehicleRegistrationNumber: pallet.carrier?.vehicleId ? "" : pallet.carrier?.vehicleRegistrationNumber || "",
    trailerRegistrationNumber: pallet.carrier?.trailerRegistrationNumber || "",
});

type CarrierForm = ReturnType<typeof initialForm>;

function PalletCarrierDialog({open, pallet, onClose, onSaved}: PalletCarrierDialogProps) {
    const translations = pl.pallets.carrier;
    const [carriers, setCarriers] = useState<CarrierDto[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [form, setForm] = useState<CarrierForm>(() => initialForm(pallet));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }
        setForm(initialForm(pallet));
        setError(null);
        CarrierService.findAll(true)
            .then((response) => {
                setCarriers(response.data || []);
                setLoadError(null);
            })
            .catch(() => setLoadError(translations.loadError));
    }, [open, pallet, translations.loadError]);

    const carrier = useMemo(() => carriers.find((item) => String(item.carrierId) === form.carrierId), [carriers, form.carrierId]);
    const drivers = (carrier?.drivers || []).filter((driver) => driver.active);
    const vehicles = (carrier?.vehicles || []).filter((vehicle) => vehicle.active);

    if (!open) {
        return null;
    }

    const update = (field: keyof CarrierForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value;
        setForm((current) => {
            const next = {...current, [field]: value};
            if (field === "carrierId") {
                next.driverId = "";
                next.vehicleId = "";
                next.trailerRegistrationNumber = "";
            }
            if (field === "vehicleId") {
                const vehicle = vehicles.find((item) => String(item.vehicleId) === value);
                next.trailerRegistrationNumber = vehicle?.trailerRegistrationNumber || current.trailerRegistrationNumber;
            }
            return next;
        });
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.carrierId) {
            setError(translations.carrierRequired);
            return;
        }
        const manualVehicle = form.vehicleId === MANUAL || !form.vehicleId;
        if (manualVehicle && !form.vehicleRegistrationNumber.trim()) {
            setError(translations.vehicleRequired);
            return;
        }
        const manualDriver = form.driverId === MANUAL;
        setSaving(true);
        setError(null);
        try {
            const response = await PalletService.assignCarrier(pallet.palletId, {
                carrierId: form.carrierId,
                transportType: form.transportType || null,
                driverId: form.driverId && !manualDriver ? form.driverId : null,
                driverName: manualDriver ? form.driverName.trim() || null : null,
                driverPhone: manualDriver ? form.driverPhone.trim() || null : null,
                vehicleId: manualVehicle ? null : form.vehicleId,
                vehicleRegistrationNumber: manualVehicle ? form.vehicleRegistrationNumber.trim() : null,
                trailerRegistrationNumber: form.trailerRegistrationNumber.trim() || null,
            });
            onSaved(response.data);
        } catch (saveError) {
            setError(palletErrorMessage(saveError, translations.error));
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <Dialog fullWidth maxWidth="md" open={open} onClose={() => !saving && onClose()}>
            <form onSubmit={submit}>
                <DialogTitle>{translations.dialogTitle.replace("{trackingNumber}", pallet.trackingNumber)}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{translations.description}</DialogContentText>
                    <div className="pallet-carrier-select">
                        <TextField select disabled={saving} label={translations.carrier} size="small" value={form.carrierId} onChange={update("carrierId")}>
                            <MenuItem value="">{translations.selectCarrier}</MenuItem>
                            {carriers.map((item) => (
                                <MenuItem key={item.carrierId} value={String(item.carrierId)}>
                                    {[item.name, item.taxId].filter(Boolean).join(" · ")}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Button disabled={saving} startIcon={<PersonAdd />} variant="outlined" onClick={() => setCreateOpen(true)}>
                            {translations.addCarrier}
                        </Button>
                    </div>
                    {loadError ? <Alert severity="warning">{loadError}</Alert> : null}
                    {form.carrierId && !carriers.length && !loadError ? <p className="pallet-hint">{translations.loading}</p> : null}
                    <div className="pallet-form-grid">
                        <TextField select disabled={saving} label={translations.transportType} size="small" value={form.transportType} onChange={update("transportType")}>
                            <MenuItem value="">{translations.defaultTransportType}</MenuItem>
                            {TRANSPORT_TYPES.map((type) => <MenuItem key={type} value={type}>{transportTypeLabel(type)}</MenuItem>)}
                        </TextField>
                        <TextField select disabled={saving || !form.carrierId} label={translations.driver} size="small" value={form.driverId} onChange={update("driverId")}>
                            <MenuItem value="">{translations.noDriver}</MenuItem>
                            {drivers.map((driver) => (
                                <MenuItem key={driver.driverId} value={String(driver.driverId)}>
                                    {[`${driver.firstName} ${driver.lastName}`, driver.phone].filter(Boolean).join(" · ")}
                                </MenuItem>
                            ))}
                            <MenuItem value={MANUAL}>{translations.manualDriver}</MenuItem>
                        </TextField>
                        <TextField select disabled={saving || !form.carrierId} label={translations.vehicle} size="small" value={form.vehicleId || MANUAL} onChange={update("vehicleId")}>
                            {vehicles.map((vehicle) => (
                                <MenuItem key={vehicle.vehicleId} value={String(vehicle.vehicleId)}>
                                    {[vehicle.registrationNumber, pl.carriers.vehicleType[vehicle.vehicleType]].filter(Boolean).join(" · ")}
                                </MenuItem>
                            ))}
                            <MenuItem value={MANUAL}>{translations.manualVehicle}</MenuItem>
                        </TextField>
                        {form.driverId === MANUAL ? (
                            <>
                                <TextField disabled={saving} label={translations.driverName} size="small" value={form.driverName} onChange={update("driverName")} />
                                <TextField disabled={saving} label={translations.driverPhone} size="small" value={form.driverPhone} onChange={update("driverPhone")} />
                            </>
                        ) : null}
                        {form.vehicleId === MANUAL || !form.vehicleId ? (
                            <TextField disabled={saving} label={translations.vehicleRegistration} required size="small" value={form.vehicleRegistrationNumber} onChange={update("vehicleRegistrationNumber")} />
                        ) : null}
                        <TextField disabled={saving} label={translations.trailer} size="small" value={form.trailerRegistrationNumber} onChange={update("trailerRegistrationNumber")} />
                    </div>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} variant="text" onClick={onClose}>{pl.common.cancel}</Button>
                    <Button disabled={saving} startIcon={<LocalShipping />} type="submit">
                        {pallet.carrier ? translations.change : translations.assign}
                    </Button>
                </DialogActions>
            </form>
            <CarrierCreateDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(created) => {
                    setCreateOpen(false);
                    setCarriers((current) => [...current.filter((item) => item.carrierId !== created.carrierId), created]
                        .sort((left, right) => left.name.localeCompare(right.name)));
                    setForm((current) => ({
                        ...current,
                        carrierId: String(created.carrierId),
                        transportType: current.transportType || created.defaultTransportType || "",
                        driverId: created.drivers[0] ? String(created.drivers[0].driverId) : "",
                        vehicleId: created.vehicles[0] ? String(created.vehicles[0].vehicleId) : MANUAL,
                        trailerRegistrationNumber: created.vehicles[0]?.trailerRegistrationNumber || "",
                    }));
                }}
            />
        </Dialog>,
        document.body,
    );
}

export default PalletCarrierDialog;
