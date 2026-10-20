import React, {useState} from "react";
import {Button, Menu, MenuItem} from "components/ui";
import {Block, EditOutlined, History, TaskAlt} from "components/ui/icons";
import pl from "../../../i18n/translate";
import {DeliveryDialogState} from "./deliveryDetails";

type DeliveryLifecycleMenuProps = {
    disabled: boolean;
    onOpen: (dialog: DeliveryDialogState) => void;
};

function DeliveryLifecycleMenu({disabled, onOpen}: DeliveryLifecycleMenuProps) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);

    const open = (dialog: DeliveryDialogState) => {
        setAnchor(null);
        onOpen(dialog);
    };

    return (
        <>
            <Button variant="outlined" size="small" startIcon={<EditOutlined/>} disabled={disabled} aria-haspopup="menu"
                    aria-label={`${pl.deliveries.edit} · ${pl.deliveries.details.lifecycleTitle}`}
                    onClick={(event: React.MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}>
                {pl.deliveries.edit}</Button>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                <MenuItem onClick={() => open({kind: "attempt"})}><History/>{pl.deliveries.details.registerAttempt}</MenuItem>
                <MenuItem onClick={() => open({kind: "complete"})}><TaskAlt/>{pl.deliveries.details.completeDelivery}</MenuItem>
                <MenuItem onClick={() => open({kind: "cancel"})}><Block/>{pl.deliveries.cancel}</MenuItem>
            </Menu>
        </>
    );
}

export default DeliveryLifecycleMenu;
