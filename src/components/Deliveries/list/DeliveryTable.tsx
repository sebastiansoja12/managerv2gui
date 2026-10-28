import React from "react";
import {KeyboardArrowDown, KeyboardArrowUp} from "components/ui/icons";
import {Link} from "react-router-dom";
import Department from "../../../class/depots/Department";
import pl from "../../../i18n/translate";
import {
    deliveryLifecycleLabel,
    deliveryMethodLabel,
    deliveryStatusLabel,
    deliveryTargetLabel,
    deliveryTypeLabel,
    departmentCodeLabel,
    formatDeliveryDateTime,
} from "../deliveryLabels";
import {DeliveryListItem, DeliverySortField} from "../model/Delivery";
import {deliveryTargetPath} from "../details/deliveryTargetLinks";
import {deliveryStatusTone, DeliveryListSort, lifecycleTone} from "./deliveryListModel";

type DeliveryTableProps = {
    deliveries: DeliveryListItem[];
    departments: Department[];
    sort: DeliveryListSort;
    selectedId: string | null;
    onSort: (field: DeliverySortField) => void;
    onSelect: (delivery: DeliveryListItem) => void;
    onOpen: (delivery: DeliveryListItem) => void;
};

type Column = {
    label: string;
    sortField?: DeliverySortField;
    className?: string;
};

function DeliveryTable({deliveries, departments, sort, selectedId, onSort, onSelect, onOpen}: DeliveryTableProps) {
    const columns: Column[] = [
        {label: pl.deliveries.columns.delivery, sortField: "TYPE"},
        {label: pl.deliveries.columns.target, sortField: "TARGET"},
        {label: pl.deliveries.columns.route},
        {label: pl.deliveries.columns.status, sortField: "DELIVERY_STATUS"},
        {label: pl.deliveries.lifecycleLabel, sortField: "LIFECYCLE_STATUS"},
        {label: pl.deliveries.columns.created, sortField: "CREATED"},
        {label: pl.deliveries.deliveredLabel, sortField: "DELIVERED_AT"},
        {label: pl.deliveries.columns.steps, sortField: "STEP_COUNT", className: "dlv-numeric"},
    ];

    return (
        <div className="tm-table-wrap">
            <table className="tm-orders-table dlv-table">
                <thead>
                <tr>
                    {columns.map((column) => {
                        const active = column.sortField && sort.field === column.sortField;
                        return (
                            <th key={column.label} className={column.className}
                                aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}>
                                {column.sortField ? (
                                    <button type="button" className={active ? "dlv-sort is-active" : "dlv-sort"}
                                            onClick={() => onSort(column.sortField as DeliverySortField)}>
                                        {column.label}
                                        {active && (sort.direction === "asc" ? <KeyboardArrowUp/> : <KeyboardArrowDown/>)}
                                    </button>
                                ) : column.label}
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {deliveries.map((delivery) => {
                    const selected = delivery.id === selectedId;
                    const active = delivery.lifecycleStatus !== "CANCELED" && delivery.lifecycleStatus !== "COMPLETED";
                    const targetPath = deliveryTargetPath(delivery);
                    return (
                        <tr key={delivery.id} className={active ? "tm-clickable-row" : "tm-clickable-row is-inactive"}
                            aria-selected={selected} tabIndex={0}
                            onClick={() => onSelect(delivery)} onDoubleClick={() => onOpen(delivery)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onSelect(delivery);
                                }
                            }}>
                            <td>
                                <div className="dlv-primary">
                                    <span className="dlv-id" title={delivery.id}>{delivery.id.slice(0, 8)}</span>
                                    <span className="dlv-secondary">
                                        {deliveryTypeLabel(delivery.type)} · {deliveryMethodLabel(delivery.method)}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div className="dlv-primary">
                                    {targetPath
                                        ? <Link className="dlv-target" to={targetPath} title={delivery.targetId}
                                                onClick={(event) => event.stopPropagation()}>
                                            {delivery.shipmentId || delivery.targetId}</Link>
                                        : <span className="dlv-target" title={delivery.targetId}>{delivery.targetId}</span>}
                                    <span className="dlv-secondary">{deliveryTargetLabel(delivery.targetType)}</span>
                                </div>
                            </td>
                            <td className="tm-destination-cell">
                                <span className="dlv-route">
                                    <span className="dlv-department">{departmentCodeLabel(departments, delivery.originDepartmentId)}</span>
                                    <span className="dlv-route-arrow" aria-hidden="true">→</span>
                                    <span className="dlv-department">{departmentCodeLabel(departments, delivery.destinationDepartmentId)}</span>
                                </span>
                            </td>
                            <td>
                                <span className={`dlv-status dlv-tone-${deliveryStatusTone(delivery.deliveryStatus)}`}>
                                    {deliveryStatusLabel(delivery.deliveryStatus)}
                                </span>
                            </td>
                            <td>
                                <span className={`dlv-pill dlv-tone-${lifecycleTone(delivery.lifecycleStatus)}`}>
                                    {deliveryLifecycleLabel(delivery.lifecycleStatus)}
                                </span>
                            </td>
                            <td className="tm-muted-cell">{formatDeliveryDateTime(delivery.createdAt)}</td>
                            <td className="tm-muted-cell">{formatDeliveryDateTime(delivery.deliveredAt)}</td>
                            <td className="dlv-numeric">{delivery.stepCount}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

export default DeliveryTable;
