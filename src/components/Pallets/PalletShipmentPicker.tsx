import React, {FormEvent, useCallback, useEffect, useState} from "react";
import {Alert, Button, Checkbox, IconButton, TextField} from "components/ui";
import {Refresh, Search} from "components/ui/icons";
import ShipmentService from "../../hooks/ShipmentService";
import {getBackendErrorMessage} from "../../api/errorMessage";
import pl from "../../i18n/translate";
import {departmentCodeValue, ShipmentDto, ShipmentStatusDto} from "../Shipment/dto/ShipmentDto";
import "./styles/pallets.css";

export const PALLET_SHIPMENT_STATUSES: ShipmentStatusDto[] = ["CREATED", "PREPARED", "ACCEPTED"];
const PAGE_SIZE = 20;

export type SelectedShipment = {
    shipmentId: string;
    trackingNumber: string;
};

export const toSelectedShipment = (shipment: ShipmentDto): SelectedShipment => ({
    shipmentId: String(shipment.shipmentId.value),
    trackingNumber: shipment.trackingNumber?.value || pl.common.dash,
});

type PalletShipmentPickerProps = {
    selected: SelectedShipment[];
    onChange: (selected: SelectedShipment[]) => void;
    excludedShipmentIds?: string[];
    reloadKey?: number;
};

function PalletShipmentPicker({selected, onChange, excludedShipmentIds = [], reloadKey = 0}: PalletShipmentPickerProps) {
    const translations = pl.pallets.createFromShipments;
    const [shipments, setShipments] = useState<ShipmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [trackingFilter, setTrackingFilter] = useState("");
    const [appliedFilter, setAppliedFilter] = useState("");

    const selectedIds = new Set(selected.map((shipment) => shipment.shipmentId));
    const excludedIds = new Set(excludedShipmentIds);

    const loadShipments = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await ShipmentService.search({
                shipmentStatuses: PALLET_SHIPMENT_STATUSES,
                trackingNumber: appliedFilter || null,
                page,
                size: PAGE_SIZE,
            });
            setShipments(response.data);
        } catch (error) {
            setShipments([]);
            setLoadError(getBackendErrorMessage(error, translations.loadError));
        } finally {
            setLoading(false);
        }
    }, [appliedFilter, page, translations.loadError]);

    useEffect(() => {
        loadShipments();
    }, [loadShipments, reloadKey]);

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPage(0);
        setAppliedFilter(trackingFilter.trim());
    };

    const selectableShipments = shipments.filter((shipment) => !excludedIds.has(String(shipment.shipmentId.value)));
    const allOnPageSelected = selectableShipments.length > 0
        && selectableShipments.every((shipment) => selectedIds.has(String(shipment.shipmentId.value)));

    const toggleShipment = (shipment: ShipmentDto) => {
        const selectedShipment = toSelectedShipment(shipment);
        onChange(selectedIds.has(selectedShipment.shipmentId)
            ? selected.filter((item) => item.shipmentId !== selectedShipment.shipmentId)
            : [...selected, selectedShipment]);
    };

    const toggleAllOnPage = () => {
        const pageShipments = selectableShipments.map(toSelectedShipment);
        onChange(allOnPageSelected
            ? selected.filter((item) => !pageShipments.some((shipment) => shipment.shipmentId === item.shipmentId))
            : [...selected, ...pageShipments.filter((shipment) => !selectedIds.has(shipment.shipmentId))]);
    };

    return (
        <div className="pallet-picker">
            <div className="pallet-picker-toolbar">
                <form className="pallet-scan-form" onSubmit={applyFilter}>
                    <TextField
                        autoComplete="off"
                        label={translations.filterLabel}
                        placeholder={translations.filterPlaceholder}
                        size="small"
                        value={trackingFilter}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTrackingFilter(event.target.value)}
                    />
                    <Button startIcon={<Search />} type="submit" variant="outlined">{translations.filterSubmit}</Button>
                </form>
                <IconButton aria-label={translations.refresh} title={translations.refresh} onClick={loadShipments}>
                    <Refresh fontSize="small" />
                </IconButton>
            </div>

            {loadError ? <Alert severity="error">{loadError}</Alert> : null}

            <div className="pallet-table-wrap">
                <table className="pallet-table">
                    <thead>
                        <tr>
                            <th className="pallet-select-cell">
                                <Checkbox
                                    aria-label={translations.selectAll}
                                    checked={allOnPageSelected}
                                    disabled={!selectableShipments.length}
                                    onChange={toggleAllOnPage}
                                />
                            </th>
                            <th>{translations.columns.trackingNumber}</th>
                            <th>{translations.columns.recipient}</th>
                            <th>{translations.columns.destination}</th>
                            <th>{translations.columns.status}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td className="pallet-empty" colSpan={5}>{translations.loading}</td></tr>
                        ) : shipments.length ? shipments.map((shipment) => {
                            const shipmentId = String(shipment.shipmentId.value);
                            const isSelected = selectedIds.has(shipmentId);
                            const isExcluded = excludedIds.has(shipmentId);
                            return (
                                <tr className={isSelected ? "pallet-table-row-selected" : undefined} key={shipmentId}>
                                    <td className="pallet-select-cell">
                                        <Checkbox
                                            aria-label={translations.selectShipment.replace("{trackingNumber}", shipment.trackingNumber?.value || shipmentId)}
                                            checked={isSelected || isExcluded}
                                            disabled={isExcluded}
                                            onChange={() => toggleShipment(shipment)}
                                        />
                                    </td>
                                    <td className="pallet-code">{shipment.trackingNumber?.value || pl.common.dash}</td>
                                    <td>{[shipment.recipient?.firstName, shipment.recipient?.lastName].filter(Boolean).join(" ") || pl.common.dash}</td>
                                    <td>{shipment.destination ? departmentCodeValue(shipment.destination) : pl.common.dash}</td>
                                    <td>{isExcluded ? translations.alreadyOnPallet : pl.shipments.status[shipment.shipmentStatus]}</td>
                                </tr>
                            );
                        }) : (
                            <tr><td className="pallet-empty" colSpan={5}>{translations.empty}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pallet-pagination">
                <span>{translations.page.replace("{page}", String(page + 1))}</span>
                <Button disabled={page === 0 || loading} variant="outlined" onClick={() => setPage((current) => Math.max(0, current - 1))}>
                    {translations.previous}
                </Button>
                <Button disabled={shipments.length < PAGE_SIZE || loading} variant="outlined" onClick={() => setPage((current) => current + 1)}>
                    {translations.next}
                </Button>
            </div>
        </div>
    );
}

export default PalletShipmentPicker;
