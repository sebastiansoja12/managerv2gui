import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Button, Chip, IconButton, MenuItem, TextField, Typography} from "components/ui";
import {Person, PersonAdd, Refresh} from "components/ui/icons";
import CarrierService from "../../hooks/CarrierService";
import DriverService from "../../hooks/DriverService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {palletErrorMessage} from "../Pallets/palletLabels";
import {driverDetailsTab} from "./carrierNavigation";
import DriverCreateDialog from "./DriverCreateDialog";
import {CarrierDto, DriverDto} from "./model/Carrier";
import {useTableSort} from "./useTableSort";
import "../Pallets/styles/pallets.css";
import "./styles/carriers.css";

type DriverListProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

type DriverSortKey = "lastName" | "firstName" | "phone" | "licenseNumber" | "carrier" | "status";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const driverSortValue = (driver: DriverDto, key: DriverSortKey): string | number => {
    switch (key) {
        case "firstName":
            return driver.firstName;
        case "phone":
            return driver.phone || "";
        case "licenseNumber":
            return driver.licenseNumber || "";
        case "carrier":
            return driver.carrierName;
        case "status":
            return driver.active ? 0 : 1;
        default:
            return driver.lastName;
    }
};

function DriverList({onOpenTab}: DriverListProps) {
    const translations = pl.drivers;
    const [drivers, setDrivers] = useState<DriverDto[]>([]);
    const [carriers, setCarriers] = useState<CarrierDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [carrierFilter, setCarrierFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [createOpen, setCreateOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [driverResponse, carrierResponse] = await Promise.all([DriverService.findAll(false), CarrierService.findAll(false)]);
            setDrivers(driverResponse.data || []);
            setCarriers(carrierResponse.data || []);
        } catch (loadError) {
            setDrivers([]);
            setError(palletErrorMessage(loadError, translations.list.loadError));
        } finally {
            setLoading(false);
        }
    }, [translations.list.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return drivers.filter((driver) => {
            if (carrierFilter && String(driver.carrierId) !== carrierFilter) {
                return false;
            }
            if (statusFilter === "ACTIVE" && !driver.active) {
                return false;
            }
            if (statusFilter === "INACTIVE" && driver.active) {
                return false;
            }
            return !normalized || [driver.firstName, driver.lastName, driver.phone, driver.licenseNumber, driver.carrierName]
                .some((value) => value && value.toLowerCase().includes(normalized));
        });
    }, [carrierFilter, drivers, query, statusFilter]);

    const {sorted, changeSort, ariaSort, indicator} = useTableSort<DriverDto, DriverSortKey>(filtered, "lastName", driverSortValue);
    const open = (driver: DriverDto) => onOpenTab?.(driverDetailsTab(driver));

    const columns: Array<{key: DriverSortKey; label: string}> = [
        {key: "lastName", label: translations.columns.lastName},
        {key: "firstName", label: translations.columns.firstName},
        {key: "phone", label: translations.columns.phone},
        {key: "licenseNumber", label: translations.columns.licenseNumber},
        {key: "carrier", label: translations.columns.carrier},
        {key: "status", label: translations.columns.status},
    ];

    return (
        <main className="pallet-page">
            <div className="pallet-shell pallet-shell-wide">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><Person /></span>
                        <div>
                            <Typography variant="h4">{translations.list.title}</Typography>
                            <p>{translations.list.subtitle}</p>
                        </div>
                    </div>
                    <div className="pallet-actions">
                        <Button startIcon={<PersonAdd />} onClick={() => setCreateOpen(true)}>{translations.list.add}</Button>
                        <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} onClick={load}><Refresh fontSize="small" /></IconButton>
                    </div>
                </section>

                {error ? <Alert severity="error">{error}</Alert> : null}

                <section className="pallet-panel">
                    <div className="pallet-filters">
                        <TextField label={translations.list.search} placeholder={translations.list.searchPlaceholder} size="small" value={query}
                                   onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} />
                        <TextField select label={translations.columns.carrier} size="small" value={carrierFilter}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setCarrierFilter(event.target.value)}>
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {carriers.map((carrier) => <MenuItem key={carrier.carrierId} value={String(carrier.carrierId)}>{carrier.name}</MenuItem>)}
                        </TextField>
                        <TextField select label={translations.columns.status} size="small" value={statusFilter}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value as StatusFilter)}>
                            <MenuItem value="ALL">{pl.common.all}</MenuItem>
                            <MenuItem value="ACTIVE">{pl.carriers.list.active}</MenuItem>
                            <MenuItem value="INACTIVE">{pl.carriers.list.inactive}</MenuItem>
                        </TextField>
                    </div>
                    <p className="pallet-hint">{translations.list.openHint}</p>
                    <div className="pallet-table-wrap">
                        <table className="pallet-table pallet-list-table">
                            <thead>
                                <tr>
                                    {columns.map((column) => (
                                        <th aria-sort={ariaSort(column.key)} key={column.key}>
                                            <button className="pallet-sort" type="button" onClick={() => changeSort(column.key)}>
                                                {column.label}<span aria-hidden="true">{indicator(column.key)}</span>
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td className="pallet-empty" colSpan={columns.length}>{translations.list.loading}</td></tr>
                                ) : sorted.length ? sorted.map((driver) => (
                                    <tr className="pallet-row" key={driver.driverId} tabIndex={0}
                                        onClick={() => open(driver)}
                                        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && open(driver)}>
                                        <td>{driver.lastName}</td>
                                        <td>{driver.firstName}</td>
                                        <td>{driver.phone || pl.common.dash}</td>
                                        <td className="pallet-code">{driver.licenseNumber || pl.common.dash}</td>
                                        <td>{driver.carrierName}</td>
                                        <td><Chip color={driver.active ? "success" : "default"} label={driver.active ? pl.carriers.list.active : pl.carriers.list.inactive} size="small" /></td>
                                    </tr>
                                )) : (
                                    <tr><td className="pallet-empty" colSpan={columns.length}>{drivers.length ? translations.list.noMatches : translations.list.empty}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <DriverCreateDialog
                carriers={carriers.filter((carrier) => carrier.active)}
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(created) => {
                    setCreateOpen(false);
                    setDrivers((current) => [...current, created]);
                    open(created);
                }}
            />
        </main>
    );
}

export default DriverList;
