import React from "react";
import {IconButton} from "components/ui";
import {Close, Download, KeyboardArrowDown, KeyboardArrowUp, Print, Visibility} from "components/ui/icons";
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
    busy: boolean;
    onSort: (field: DeliverySortField) => void;
    onOpen: (delivery: DeliveryListItem) => void;
    onExport: (delivery: DeliveryListItem, format: "excel" | "pdf") => void;
    onCancel: (delivery: DeliveryListItem) => void;
};

type Column = {
    label: string;
    sortField?: DeliverySortField;
    className?: string;
};

function DeliveryTable({deliveries, departments, sort, busy, onSort, onOpen, onExport, onCancel}: DeliveryTableProps) {
    const columns: Column[] = [
        {label: pl.deliveries.columns.id},
        {label: pl.deliveries.columns.target, sortField: "TARGET"},
        {label: pl.deliveries.columns.type, sortField: "TYPE"},
        {label: pl.deliveries.methodLabel, sortField: "METHOD"},
        {label: pl.deliveries.columns.route},
        {label: pl.deliveries.columns.status, sortField: "DELIVERY_STATUS"},
        {label: pl.deliveries.lifecycleLabel, sortField: "LIFECYCLE_STATUS"},
        {label: pl.deliveries.columns.created, sortField: "CREATED"},
        {label: pl.deliveries.deliveredLabel, sortField: "DELIVERED_AT"},
        {label: pl.deliveries.columns.steps, sortField: "STEP_COUNT", className: "deliveries-numeric"},
        {label: pl.deliveries.columns.actions, className: "deliveries-actions-column"},
    ];

    return (
        <div className="deliveries-table-wrap">
            <table className="deliveries-table">
                <thead>
                <tr>
                    {columns.map((column) => {
                        const active = column.sortField && sort.field === column.sortField;
                        return (
                            <th key={column.label} className={column.className}
                                aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}>
                                {column.sortField ? (
                                    <button type="button" className={active ? "deliveries-sort is-active" : "deliveries-sort"}
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
                    const cancelable = delivery.lifecycleStatus !== "CANCELED" && delivery.lifecycleStatus !== "COMPLETED";
                    return (
                        <tr key={delivery.id} className={cancelable ? "" : "is-inactive"}
                            onDoubleClick={() => onOpen(delivery)}>
                            <td className="deliveries-id" title={delivery.id}>
                                <Link to={`/deliveries/${encodeURIComponent(delivery.id)}/edit`}>{delivery.id.slice(0, 8)}</Link>
                            </td>
                            <td>
                                <span className="deliveries-target">
                                    <small>{deliveryTargetLabel(delivery.targetType)}</small>
                                    {deliveryTargetPath(delivery)
                                        ? <Link to={deliveryTargetPath(delivery) as string} title={delivery.targetId}>
                                            {delivery.shipmentId || delivery.targetId}</Link>
                                        : <span title={delivery.targetId}>{delivery.targetId}</span>}
                                </span>
                            </td>
                            <td>{deliveryTypeLabel(delivery.type)}</td>
                            <td>{deliveryMethodLabel(delivery.method)}</td>
                            <td className="deliveries-route-cell">
                                {departmentCodeLabel(departments, delivery.originDepartmentId)}
                                <span aria-hidden="true">→</span>
                                {departmentCodeLabel(departments, delivery.destinationDepartmentId)}
                            </td>
                            <td><span className={`deliveries-badge deliveries-tone-${deliveryStatusTone(delivery.deliveryStatus)}`}>
                                {deliveryStatusLabel(delivery.deliveryStatus)}</span></td>
                            <td><span className={`deliveries-badge deliveries-tone-${lifecycleTone(delivery.lifecycleStatus)}`}>
                                {deliveryLifecycleLabel(delivery.lifecycleStatus)}</span></td>
                            <td>{formatDeliveryDateTime(delivery.createdAt)}</td>
                            <td>{formatDeliveryDateTime(delivery.deliveredAt)}</td>
                            <td className="deliveries-numeric">{delivery.stepCount}</td>
                            <td className="deliveries-actions-column">
                                <div className="deliveries-row-actions">
                                    <IconButton title={pl.deliveries.edit} size="small" aria-label={`${pl.deliveries.edit} ${delivery.id}`}
                                                onClick={() => onOpen(delivery)}><Visibility/></IconButton>
                                    <IconButton title={pl.deliveries.exportExcel} size="small" disabled={busy}
                                                aria-label={`${pl.deliveries.exportExcel} ${delivery.id}`}
                                                onClick={() => onExport(delivery, "excel")}><Download/></IconButton>
                                    <IconButton title={pl.deliveries.exportPdf} size="small" disabled={busy}
                                                aria-label={`${pl.deliveries.exportPdf} ${delivery.id}`}
                                                onClick={() => onExport(delivery, "pdf")}><Print/></IconButton>
                                    <IconButton title={pl.deliveries.cancel} size="small" data-tone="danger" disabled={busy || !cancelable}
                                                aria-label={`${pl.deliveries.cancel} ${delivery.id}`}
                                                onClick={() => onCancel(delivery)}><Close/></IconButton>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

export default DeliveryTable;
