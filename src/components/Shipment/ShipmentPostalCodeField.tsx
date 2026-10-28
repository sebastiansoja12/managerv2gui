import React, {ChangeEvent, KeyboardEvent, useEffect, useState} from "react";
import {TextField} from "components/ui";
import {ApiResult} from "../../api/ApiResult";
import PostalCodeService from "../../hooks/PostalCodeService";
import pl from "../../i18n/translate";
import {PostalCodeDto} from "./dto/PostalCode";

type ShipmentPostalCodeFieldProps = {
    id: string;
    label: string;
    value: string;
    onChange: (postalCode: string) => void;
    onSelect: (postalCode: PostalCodeDto) => void;
    required?: boolean;
    error?: boolean;
    search?: (query: string) => Promise<ApiResult<PostalCodeDto[]>>;
};

const MINIMUM_QUERY_LENGTH = 2;
const SEARCH_DELAY_MS = 250;

export const postalCodeRegionLabel = (postalCode: PostalCodeDto) => {
    const regions = pl.shipments.postalCodeRegions as Record<string, string>;
    return regions[`${postalCode.countryCode}-${postalCode.regionCode}`] || postalCode.countryCode;
};

export const postalCodeSuggestionLabel = (postalCode: PostalCodeDto) =>
    `${postalCode.postalCode} ${postalCode.city} (${postalCodeRegionLabel(postalCode)})`;

const ShipmentPostalCodeField: React.FC<ShipmentPostalCodeFieldProps> = ({
    id, label, value, onChange, onSelect, required, error, search = PostalCodeService.search,
}) => {
    const [suggestions, setSuggestions] = useState<PostalCodeDto[]>([]);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const suggestionListId = `${id}-suggestions`;

    useEffect(() => {
        const query = value.trim();
        if (query.length < MINIMUM_QUERY_LENGTH) {
            setSuggestions([]);
            return undefined;
        }
        let active = true;
        const timeout = window.setTimeout(() => {
            search(query)
                .then((response) => {
                    if (active) {
                        setSuggestions(response.data);
                    }
                })
                .catch(() => {
                    if (active) {
                        setSuggestions([]);
                    }
                });
        }, SEARCH_DELAY_MS);
        return () => {
            active = false;
            window.clearTimeout(timeout);
        };
    }, [search, value]);

    const selectSuggestion = (suggestion: PostalCodeDto) => {
        onSelect(suggestion);
        setOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((index) => (index + step + suggestions.length) % Math.max(suggestions.length, 1));
        } else if (event.key === "Enter" && open && suggestions[activeIndex]) {
            event.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    const showSuggestions = open && suggestions.length > 0;

    return (
        <div style={{position: "relative"}}>
            <TextField
                fullWidth
                id={id}
                required={required}
                error={error}
                label={label}
                size="small"
                value={value}
                inputProps={{
                    role: "combobox",
                    autoComplete: "off",
                    "aria-autocomplete": "list",
                    "aria-expanded": showSuggestions,
                    "aria-controls": suggestionListId,
                    onKeyDown: handleKeyDown,
                    onFocus: () => setOpen(true),
                    onBlur: () => setOpen(false),
                }}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onChange(event.target.value);
                    setOpen(true);
                    setActiveIndex(-1);
                }}
            />
            {showSuggestions && (
                <div
                    className="technical-select-menu"
                    id={suggestionListId}
                    role="listbox"
                    style={{position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, maxHeight: 260}}
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            type="button"
                            role="option"
                            className="technical-select-option"
                            aria-selected={index === activeIndex}
                            key={`${suggestion.countryCode}-${suggestion.postalCode}-${suggestion.city}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectSuggestion(suggestion)}
                        >
                            {postalCodeSuggestionLabel(suggestion)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShipmentPostalCodeField;
