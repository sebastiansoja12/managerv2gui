import React, {useEffect, useState} from "react";
import {Button, Checkbox, FormControlLabel, MenuItem, TextField} from "components/ui";
import {Close, Search} from "components/ui/icons";
import Department from "../../../class/depots/Department";
import pl from "../../../i18n/translate";
import {deliveryLifecycleLabel, deliveryMethodLabel, deliveryStatusLabel, deliveryTargetLabel,
    deliveryTypeLabel} from "../deliveryLabels";
import {deliveryMethods, deliveryStatuses} from "../details/deliveryDetails";
import {activeFilterCount, defaultDeliveryListFilters, DeliveryListFilters} from "./deliveryListModel";

type DeliveryFiltersProps = {
    filters: DeliveryListFilters;
    departments: Department[];
    onChange: (filters: DeliveryListFilters) => void;
};

const lifecycleStatuses = ["CREATED", "MODIFIED", "COMPLETED", "CANCELED"] as const;
const deliveryTypes = ["OUTBOUND", "RETURN"] as const;
const targetTypes = ["SHIPMENT", "PALLET"] as const;
const SEARCH_DELAY = 300;

function DeliveryFilters({filters, departments, onChange}: DeliveryFiltersProps) {
    const [text, setText] = useState(filters.text || "");
    const labels = pl.deliveries.filters;

    useEffect(() => {
        setText(filters.text || "");
    }, [filters.text]);

    useEffect(() => {
        if ((filters.text || "") === text.trim()) {
            return undefined;
        }
        const timer = window.setTimeout(() => onChange({...filters, text: text.trim() || undefined}), SEARCH_DELAY);
        return () => window.clearTimeout(timer);
    }, [filters, onChange, text]);

    const set = (patch: Partial<DeliveryListFilters>) => onChange({...filters, ...patch});
    const select = (label: string, value: string | undefined, options: readonly string[],
                    optionLabel: (value: string) => string, onSelect: (value: string | undefined) => void) => (
        <TextField select size="small" label={label} value={value || ""}
                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onSelect(event.target.value || undefined)}>
            <MenuItem value="">{labels.all}</MenuItem>
            {options.map((option) => <MenuItem key={option} value={option}>{optionLabel(option)}</MenuItem>)}
        </TextField>
    );
    const activeCount = activeFilterCount(filters);

    return (
        <section className="deliveries-filters" aria-label={labels.title}>
            <div className="deliveries-filters-grid">
                <div className="deliveries-filters-search">
                    <Search/>
                    <TextField size="small" label={labels.text} value={text} placeholder={labels.textPlaceholder}
                               onChange={(event: React.ChangeEvent<HTMLInputElement>) => setText(event.target.value)}/>
                </div>
                {select(labels.lifecycle, filters.lifecycleStatuses?.[0], lifecycleStatuses, deliveryLifecycleLabel,
                    (value) => set({lifecycleStatuses: value ? [value] : undefined}))}
                {select(labels.deliveryStatus, filters.deliveryStatuses?.[0], deliveryStatuses, deliveryStatusLabel,
                    (value) => set({deliveryStatuses: value ? [value] : undefined}))}
                {select(labels.type, filters.type, deliveryTypes, deliveryTypeLabel, (value) => set({type: value}))}
                {select(labels.targetType, filters.targetType, targetTypes, deliveryTargetLabel,
                    (value) => set({targetType: value}))}
                {select(labels.method, filters.method, deliveryMethods, (value) => deliveryMethodLabel(value),
                    (value) => set({method: value}))}
                {select(labels.department, filters.departmentId,
                    departments.map((department) => String(department.departmentId)),
                    (value) => departments.find((department) => String(department.departmentId) === value)
                        ?.departmentCode?.value || value,
                    (value) => set({departmentId: value}))}
                <TextField size="small" type="date" label={labels.createdFrom} value={filters.createdFrom || ""}
                           onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                               set({createdFrom: event.target.value || undefined})}/>
                <TextField size="small" type="date" label={labels.createdTo} value={filters.createdTo || ""}
                           onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                               set({createdTo: event.target.value || undefined})}/>
            </div>
            <div className="deliveries-filters-footer">
                <FormControlLabel label={labels.hideCanceled} control={
                    <Checkbox checked={Boolean(filters.hideCanceled)}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  set({hideCanceled: event.target.checked})}/>
                }/>
                <FormControlLabel label={labels.hideCompleted} control={
                    <Checkbox checked={Boolean(filters.hideCompleted)}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  set({hideCompleted: event.target.checked})}/>
                }/>
                <span className="deliveries-filters-count">
                    {labels.active.replace("{count}", String(activeCount))}</span>
                <Button variant="outlined" size="small" startIcon={<Close/>} disabled={activeCount === 0}
                        onClick={() => {
                            setText("");
                            onChange(defaultDeliveryListFilters);
                        }}>{labels.reset}</Button>
            </div>
        </section>
    );
}

export default DeliveryFilters;
