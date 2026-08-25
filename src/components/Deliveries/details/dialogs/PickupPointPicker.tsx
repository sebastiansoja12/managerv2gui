import React, {useEffect, useState} from "react";
import {Button, TextField} from "components/ui";
import PickupPointService from "../../../../hooks/PickupPointService";
import pl from "../../../../i18n/translate";
import {PickupPointSummary} from "../../../PickupPoints/model/PickupPoint";
import {pickupPointAddress, pickupPointName} from "../pickupPointLabels";

type PickupPointPickerProps = {
    label: string;
    value: string;
    selectedLabel: string;
    onChange: (pickupPointId: string, label: string) => void;
};

const SEARCH_DELAY = 300;

function PickupPointPicker({label, value, selectedLabel, onChange}: PickupPointPickerProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PickupPointSummary[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        let active = true;
        if (query.trim().length < 2) {
            setResults([]);
            return () => {active = false;};
        }
        const timer = window.setTimeout(() => {
            setSearching(true);
            PickupPointService.search({query: query.trim(), status: "ACTIVE", size: 8})
                .then((response) => {
                    if (active) {
                        setResults(Array.isArray(response.data?.items) ? response.data.items : []);
                    }
                })
                .catch(() => {
                    if (active) {
                        setResults([]);
                    }
                })
                .finally(() => {
                    if (active) {
                        setSearching(false);
                    }
                });
        }, SEARCH_DELAY);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [query]);

    return (
        <div className="deliveries-point-picker">
            <div className="deliveries-point-picker-selected">
                <span>{label}</span>
                <strong>{value ? selectedLabel : pl.common.dash}</strong>
                {value && <Button variant="outlined" size="small" onClick={() => onChange("", "")}>
                    {pl.deliveries.details.clearSelection}</Button>}
            </div>
            <TextField size="small" label={`${label} · ${pl.deliveries.details.searchPickupPoint}`} value={query}
                       onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}/>
            {searching && <small className="deliveries-tile-note">{pl.deliveries.details.searching}</small>}
            {results.length > 0 && (
                <ul className="deliveries-point-results" role="listbox" aria-label={label}>
                    {results.map((point) => (
                        <li key={point.pickupPointId.value}>
                            <button type="button" role="option" aria-selected={point.pickupPointId.value === value}
                                    onClick={() => {
                                        onChange(point.pickupPointId.value, pickupPointName(point));
                                        setQuery("");
                                        setResults([]);
                                    }}>
                                <strong>{pickupPointName(point)}</strong>
                                <small>{pickupPointAddress(point)}</small>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PickupPointPicker;
