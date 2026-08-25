import React from "react";
import {Button} from "components/ui";
import {EditOutlined} from "components/ui/icons";
import pl from "../../../../i18n/translate";

type DeliveryTileProps = {
    title: string;
    rows: Array<[string, React.ReactNode]>;
    wide?: boolean;
    onEdit?: () => void;
    editDisabled?: boolean;
    action?: React.ReactNode;
};

function DeliveryTile({title, rows, wide, onEdit, editDisabled, action}: DeliveryTileProps) {
    return (
        <article className={wide ? "deliveries-info-tile deliveries-info-tile-wide" : "deliveries-info-tile"}
                 aria-label={title}>
            <div className="deliveries-tile-heading">
                <h3>{title}</h3>
                {onEdit && <Button variant="outlined" size="small" startIcon={<EditOutlined/>} disabled={editDisabled}
                                   aria-label={`${pl.deliveries.edit} · ${title}`} onClick={onEdit}>
                    {pl.deliveries.edit}</Button>}
                {action}
            </div>
            <dl className="deliveries-metadata">
                {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
        </article>
    );
}

export default DeliveryTile;
