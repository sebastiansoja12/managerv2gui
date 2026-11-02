import React from "react";
import {Chip} from "components/ui";
import pl from "../../i18n/translate";
import {PalletDto} from "./model/Pallet";
import {formatPalletDate, palletStatusLabel, palletStatusTone} from "./palletLabels";

type PalletSummaryProps = {
    pallet: PalletDto;
};

function PalletSummary({pallet}: PalletSummaryProps) {
    const translations = pl.pallets.summary;

    return (
        <div className="pallet-summary">
            <div className="pallet-summary-item">
                <span>{translations.trackingNumber}</span>
                <strong className="pallet-tracking-number">{pallet.trackingNumber}</strong>
            </div>
            <div className="pallet-summary-item">
                <span>{translations.status}</span>
                <strong>
                    <Chip color={palletStatusTone(pallet)} label={palletStatusLabel(pallet.palletStatus)} size="small" />
                </strong>
            </div>
            <div className="pallet-summary-item">
                <span>{translations.shipments}</span>
                <strong>{pallet.shipmentIds.length}</strong>
            </div>
            <div className="pallet-summary-item">
                <span>{pl.pallets.carrier.carrier}</span>
                <strong>{pallet.carrier?.carrierName || pl.common.dash}</strong>
            </div>
            <div className="pallet-summary-item">
                <span>{pl.pallets.carrier.vehicle}</span>
                <strong className="pallet-code">
                    {[pallet.carrier?.vehicleRegistrationNumber, pallet.carrier?.trailerRegistrationNumber]
                        .filter(Boolean).join(" / ") || pl.common.dash}
                </strong>
            </div>
            <div className="pallet-summary-item">
                <span>{translations.modified}</span>
                <strong>{formatPalletDate(pallet.modified)}</strong>
            </div>
        </div>
    );
}

export default PalletSummary;
