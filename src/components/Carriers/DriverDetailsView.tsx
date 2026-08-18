import React, {useCallback, useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {Alert, Button, Chip, CircularProgress, IconButton, Typography} from "components/ui";
import {Block, CheckCircle, LocalShipping, Person, Refresh} from "components/ui/icons";
import DriverService from "../../hooks/DriverService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {palletErrorMessage} from "../Pallets/palletLabels";
import {carrierDetailsTab} from "./carrierNavigation";
import EditableFieldList from "./EditableFieldList";
import FieldEditDialog, {EditedField} from "./FieldEditDialog";
import {DriverDto, DriverField} from "./model/Carrier";
import "../Pallets/styles/pallets.css";
import "./styles/carriers.css";

type DriverDetailsViewProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

function DriverDetailsView({onOpenTab}: DriverDetailsViewProps) {
    const translations = pl.drivers;
    const {driverId = ""} = useParams();
    const [driver, setDriver] = useState<DriverDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [editedField, setEditedField] = useState<EditedField | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setDriver((await DriverService.get(decodeURIComponent(driverId))).data);
        } catch (loadError) {
            setDriver(null);
            setError(palletErrorMessage(loadError, translations.view.loadError));
        } finally {
            setLoading(false);
        }
    }, [driverId, translations.view.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return <main className="pallet-page"><div className="pallet-shell"><p className="pallet-hint"><CircularProgress size={18} /> {translations.view.loading}</p></div></main>;
    }

    if (!driver) {
        return (
            <main className="pallet-page">
                <div className="pallet-shell">
                    <Alert severity="error">{error || translations.view.loadError}</Alert>
                    <div><Button startIcon={<Refresh />} variant="outlined" onClick={load}>{pl.common.refresh}</Button></div>
                </div>
            </main>
        );
    }

    const editField = (field: DriverField, label: string, value?: string | null, required = false) => setEditedField({
        title: pl.carriers.fieldEdit.title.replace("{field}", label).replace("{name}", `${driver.firstName} ${driver.lastName}`),
        label,
        value: value || "",
        required,
        inputMode: field === "phone" ? "tel" : "text",
        save: async (newValue) => setDriver((await DriverService.changeField(driver.driverId, field, newValue)).data),
    });

    const toggleActive = async () => {
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            setDriver((await DriverService.changeActive(driver.driverId, !driver.active)).data);
            setNotice(driver.active ? translations.list.deactivated : translations.list.activated);
        } catch (toggleError) {
            setError(palletErrorMessage(toggleError, pl.carriers.fieldEdit.error));
        } finally {
            setBusy(false);
        }
    };

    const statusLabel = driver.active ? pl.carriers.list.active : pl.carriers.list.inactive;

    return (
        <main className="pallet-page">
            <div className="pallet-shell">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><Person /></span>
                        <div>
                            <Typography variant="h4">{driver.firstName} {driver.lastName}</Typography>
                            <p><Chip color={driver.active ? "success" : "default"} label={statusLabel} size="small" /></p>
                        </div>
                    </div>
                    <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} onClick={load}><Refresh fontSize="small" /></IconButton>
                </section>

                <nav aria-label={translations.view.actions} className="pallet-toolbar">
                    <Button disabled={busy} startIcon={driver.active ? <Block /> : <CheckCircle />} variant="outlined" onClick={toggleActive}>
                        {driver.active ? pl.carriers.list.deactivate : pl.carriers.list.activate}
                    </Button>
                    <Button disabled={!onOpenTab} startIcon={<LocalShipping />} variant="outlined"
                            onClick={() => onOpenTab?.(carrierDetailsTab({carrierId: driver.carrierId, name: driver.carrierName}))}>
                        {translations.view.openCarrier}
                    </Button>
                </nav>

                {error ? <Alert severity="error">{error}</Alert> : null}
                {notice ? <Alert severity="success">{notice}</Alert> : null}

                <section className="pallet-panel">
                    <Typography variant="h5">{translations.details.title}</Typography>
                    <EditableFieldList rows={[
                        {key: "first-name", label: translations.columns.firstName, value: driver.firstName,
                            onEdit: () => editField("first-name", translations.columns.firstName, driver.firstName, true)},
                        {key: "last-name", label: translations.columns.lastName, value: driver.lastName,
                            onEdit: () => editField("last-name", translations.columns.lastName, driver.lastName, true)},
                        {key: "phone", label: translations.columns.phone, value: driver.phone,
                            onEdit: () => editField("phone", translations.columns.phone, driver.phone)},
                        {key: "license-number", label: translations.columns.licenseNumber, value: driver.licenseNumber,
                            onEdit: () => editField("license-number", translations.columns.licenseNumber, driver.licenseNumber)},
                        {key: "carrier", label: translations.columns.carrier, value: driver.carrierName},
                        {key: "status", label: translations.columns.status, value: statusLabel},
                    ]} />
                </section>
            </div>
            <FieldEditDialog field={editedField} onClose={() => setEditedField(null)} onSaved={() => {
                setEditedField(null);
                setNotice(pl.carriers.fieldEdit.saved);
            }} />
        </main>
    );
}

export default DriverDetailsView;
