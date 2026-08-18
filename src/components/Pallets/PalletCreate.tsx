import React from "react";
import {Typography} from "components/ui";
import {Add} from "components/ui/icons";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import PalletCreateOptions from "./PalletCreateOptions";
import {palletCreateFromShipmentsTab, palletDetailsTab} from "./palletNavigation";
import "./styles/pallets.css";

type PalletCreateProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

function PalletCreate({onOpenTab}: PalletCreateProps) {
    const translations = pl.pallets.createOptions;

    return (
        <main className="pallet-page">
            <div className="pallet-shell">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><Add /></span>
                        <div>
                            <Typography variant="h4">{translations.title}</Typography>
                            <p>{translations.subtitle}</p>
                        </div>
                    </div>
                </section>
                <section className="pallet-panel pallet-create-panel">
                    <PalletCreateOptions
                        onCreated={(pallet) => onOpenTab?.(palletDetailsTab(pallet.trackingNumber))}
                        onCreateFromShipments={() => onOpenTab?.(palletCreateFromShipmentsTab())}
                    />
                </section>
            </div>
        </main>
    );
}

export default PalletCreate;
