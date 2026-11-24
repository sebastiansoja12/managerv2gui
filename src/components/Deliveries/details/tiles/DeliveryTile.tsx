import React from "react";
import {Button, Typography} from "components/ui";
import {EditOutlined} from "components/ui/icons";
import pl from "../../../../i18n/translate";

type DeliveryCardProps = {
    title: string;
    icon?: React.ReactNode;
    wide?: boolean;
    action?: React.ReactNode;
    children: React.ReactNode;
};

export function DeliveryCard({title, icon, wide, action, children}: DeliveryCardProps) {
    return (
        <article className={wide ? "shipment-dashboard-card dlv-detail-card dlv-detail-card-wide"
            : "shipment-dashboard-card dlv-detail-card"} aria-label={title}>
            <div className="shipment-dashboard-card-header">
                <div className="shipment-dashboard-card-title">
                    {icon && <span>{icon}</span>}
                    <Typography variant="h6">{title}</Typography>
                </div>
                {action}
            </div>
            {children}
        </article>
    );
}

type DeliveryTileProps = {
    title: string;
    rows: Array<[string, React.ReactNode]>;
    icon?: React.ReactNode;
    wide?: boolean;
    onEdit?: () => void;
    editDisabled?: boolean;
    action?: React.ReactNode;
};

function DeliveryTile({title, rows, icon, wide, onEdit, editDisabled, action}: DeliveryTileProps) {
    return (
        <DeliveryCard title={title} icon={icon} wide={wide} action={<>
            {onEdit && <Button variant="outlined" size="small" startIcon={<EditOutlined/>} disabled={editDisabled}
                               aria-label={`${pl.deliveries.edit} · ${title}`} onClick={onEdit}>
                {pl.deliveries.edit}</Button>}
            {action}
        </>}>
            <dl className={wide ? "dlv-detail-facts" : "dlv-detail-rows"}>
                {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
        </DeliveryCard>
    );
}

export default DeliveryTile;
