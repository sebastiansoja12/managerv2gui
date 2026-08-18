import React, {useState} from "react";
import {Alert, Button, IconButton, Typography} from "components/ui";
import {Add, DeleteOutline, ViewList} from "components/ui/icons";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {PalletDto} from "./model/Pallet";
import PalletShipmentPicker, {SelectedShipment} from "./PalletShipmentPicker";
import PalletSummary from "./PalletSummary";
import {palletErrorMessage} from "./palletLabels";
import {palletDetailsTab} from "./palletNavigation";
import "./styles/pallets.css";

export {PALLET_SHIPMENT_STATUSES} from "./PalletShipmentPicker";

type PalletCreateFromShipmentsProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

function PalletCreateFromShipments({onOpenTab}: PalletCreateFromShipmentsProps) {
    const translations = pl.pallets.createFromShipments;
    const [selected, setSelected] = useState<SelectedShipment[]>([]);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createdPallet, setCreatedPallet] = useState<PalletDto | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const changeSelection = (nextSelection: SelectedShipment[]) => {
        setCreatedPallet(null);
        setSelected(nextSelection);
    };

    const createPallet = async () => {
        if (!selected.length) {
            setCreateError(translations.validation.selectionRequired);
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            const response = await PalletService.createFromShipments(selected.map((shipment) => shipment.shipmentId));
            setCreatedPallet(response.data);
            setSelected([]);
            setReloadKey((current) => current + 1);
        } catch (error) {
            setCreateError(palletErrorMessage(error, translations.createError));
        } finally {
            setCreating(false);
        }
    };

    return (
        <main className="pallet-page">
            <div className="pallet-shell">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><ViewList /></span>
                        <div>
                            <Typography variant="h4">{translations.title}</Typography>
                            <p>{translations.subtitle}</p>
                        </div>
                    </div>
                </section>

                <section className="pallet-grid">
                    <div className="pallet-panel">
                        <div className="pallet-panel-header">
                            <div>
                                <Typography variant="h5">{translations.listTitle}</Typography>
                                <p>{translations.listDescription}</p>
                            </div>
                        </div>
                        <PalletShipmentPicker reloadKey={reloadKey} selected={selected} onChange={changeSelection} />
                    </div>

                    <div className="pallet-panel">
                        <div className="pallet-panel-header">
                            <div>
                                <Typography variant="h5">{translations.selectedTitle}</Typography>
                                <p>{translations.selectedCount.replace("{count}", String(selected.length))}</p>
                            </div>
                        </div>

                        <div className="pallet-table-wrap">
                            <table className="pallet-table">
                                <tbody>
                                    {selected.length ? selected.map((shipment) => (
                                        <tr key={shipment.shipmentId}>
                                            <td className="pallet-code">{shipment.trackingNumber}</td>
                                            <td className="pallet-actions-cell">
                                                <IconButton
                                                    aria-label={translations.remove.replace("{trackingNumber}", shipment.trackingNumber)}
                                                    size="small"
                                                    title={translations.remove.replace("{trackingNumber}", shipment.trackingNumber)}
                                                    onClick={() => changeSelection(selected.filter((item) => item.shipmentId !== shipment.shipmentId))}
                                                >
                                                    <DeleteOutline fontSize="small" />
                                                </IconButton>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td className="pallet-empty" colSpan={2}>{translations.selectedEmpty}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {createError ? <Alert severity="error">{createError}</Alert> : null}

                        <div className="pallet-actions">
                            <Button disabled={creating || !selected.length} variant="outlined" onClick={() => changeSelection([])}>
                                {translations.clear}
                            </Button>
                            <Button disabled={creating || !selected.length} startIcon={<Add />} onClick={createPallet}>
                                {creating ? translations.creating : translations.submit.replace("{count}", String(selected.length))}
                            </Button>
                        </div>

                        {createdPallet ? (
                            <>
                                <Alert severity="success">{translations.created}</Alert>
                                <PalletSummary pallet={createdPallet} />
                                {onOpenTab ? (
                                    <div className="pallet-actions">
                                        <Button variant="outlined" onClick={() => onOpenTab(palletDetailsTab(createdPallet.trackingNumber))}>
                                            {translations.openPallet}
                                        </Button>
                                    </div>
                                ) : null}
                            </>
                        ) : null}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default PalletCreateFromShipments;
