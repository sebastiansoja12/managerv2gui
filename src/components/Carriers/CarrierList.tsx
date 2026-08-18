import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Button, Chip, IconButton, MenuItem, TextField, Typography} from "components/ui";
import {Add, LocalShipping, Refresh} from "components/ui/icons";
import CarrierService from "../../hooks/CarrierService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {palletErrorMessage, transportTypeLabel} from "../Pallets/palletLabels";
import CarrierCreateDialog from "./CarrierCreateDialog";
import {carrierDetailsTab} from "./carrierNavigation";
import {CarrierDto} from "./model/Carrier";
import {useTableSort} from "./useTableSort";
import "../Pallets/styles/pallets.css";
import "./styles/carriers.css";

type CarrierListProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

type CarrierSortKey = "name" | "taxId" | "phone" | "transportType" | "drivers" | "vehicles" | "status";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const carrierSortValue = (carrier: CarrierDto, key: CarrierSortKey): string | number => {
    switch (key) {
        case "taxId":
            return carrier.taxId || "";
        case "phone":
            return carrier.phone || "";
        case "transportType":
            return transportTypeLabel(carrier.defaultTransportType);
        case "drivers":
            return carrier.drivers.length;
        case "vehicles":
            return carrier.vehicles.length;
        case "status":
            return carrier.active ? 0 : 1;
        default:
            return carrier.name;
    }
};

function CarrierList({onOpenTab}: CarrierListProps) {
    const translations = pl.carriers;
    const [carriers, setCarriers] = useState<CarrierDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [createOpen, setCreateOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setCarriers((await CarrierService.findAll(false)).data || []);
        } catch (loadError) {
            setCarriers([]);
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
        return carriers.filter((carrier) => {
            if (statusFilter === "ACTIVE" && !carrier.active) {
                return false;
            }
            if (statusFilter === "INACTIVE" && carrier.active) {
                return false;
            }
            return !normalized || [carrier.name, carrier.taxId, carrier.phone, carrier.email]
                .some((value) => value && value.toLowerCase().includes(normalized));
        });
    }, [carriers, query, statusFilter]);

    const {sorted, changeSort, ariaSort, indicator} = useTableSort<CarrierDto, CarrierSortKey>(filtered, "name", carrierSortValue);
    const open = (carrier: CarrierDto) => onOpenTab?.(carrierDetailsTab(carrier));

    const columns: Array<{key: CarrierSortKey; label: string}> = [
        {key: "name", label: translations.columns.name},
        {key: "taxId", label: translations.columns.taxId},
        {key: "phone", label: translations.columns.phone},
        {key: "transportType", label: translations.columns.transportType},
        {key: "drivers", label: translations.columns.drivers},
        {key: "vehicles", label: translations.columns.vehicles},
        {key: "status", label: translations.columns.status},
    ];

    return (
        <main className="pallet-page">
            <div className="pallet-shell pallet-shell-wide">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><LocalShipping /></span>
                        <div>
                            <Typography variant="h4">{translations.list.title}</Typography>
                            <p>{translations.list.subtitle}</p>
                        </div>
                    </div>
                    <div className="pallet-actions">
                        <Button startIcon={<Add />} onClick={() => setCreateOpen(true)}>{translations.list.add}</Button>
                        <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} onClick={load}><Refresh fontSize="small" /></IconButton>
                    </div>
                </section>

                {error ? <Alert severity="error">{error}</Alert> : null}

                <section className="pallet-panel">
                    <div className="pallet-filters">
                        <TextField label={translations.list.search} placeholder={translations.list.searchPlaceholder} size="small" value={query}
                                   onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} />
                        <TextField select label={translations.list.status} size="small" value={statusFilter}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value as StatusFilter)}>
                            <MenuItem value="ALL">{pl.common.all}</MenuItem>
                            <MenuItem value="ACTIVE">{translations.list.active}</MenuItem>
                            <MenuItem value="INACTIVE">{translations.list.inactive}</MenuItem>
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
                                ) : sorted.length ? sorted.map((carrier) => (
                                    <tr className="pallet-row" key={carrier.carrierId} tabIndex={0}
                                        onClick={() => open(carrier)}
                                        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && open(carrier)}>
                                        <td>{carrier.name}</td>
                                        <td className="pallet-code">{carrier.taxId || pl.common.dash}</td>
                                        <td>{carrier.phone || pl.common.dash}</td>
                                        <td>{transportTypeLabel(carrier.defaultTransportType)}</td>
                                        <td>{carrier.drivers.length}</td>
                                        <td>{carrier.vehicles.length}</td>
                                        <td><Chip color={carrier.active ? "success" : "default"} label={carrier.active ? translations.list.active : translations.list.inactive} size="small" /></td>
                                    </tr>
                                )) : (
                                    <tr><td className="pallet-empty" colSpan={columns.length}>{carriers.length ? translations.list.noMatches : translations.list.empty}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <CarrierCreateDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(created) => {
                    setCreateOpen(false);
                    setCarriers((current) => [...current, created]);
                    open(created);
                }}
            />
        </main>
    );
}

export default CarrierList;
