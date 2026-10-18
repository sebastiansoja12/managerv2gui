import React, {useState} from "react";
import {Alert} from "components/ui";
import {Add, ChevronRight, ViewList} from "components/ui/icons";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import {PalletDto} from "./model/Pallet";
import {palletErrorMessage} from "./palletLabels";
import "./styles/pallets.css";

type PalletCreateOptionsProps = {
    onCreated: (pallet: PalletDto) => void;
    onCreateFromShipments: () => void;
};

function PalletCreateOptions({onCreated, onCreateFromShipments}: PalletCreateOptionsProps) {
    const translations = pl.pallets.createOptions;
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createEmpty = async () => {
        if (creating) {
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const response = await PalletService.createEmpty();
            onCreated(response.data);
        } catch (createError) {
            setError(palletErrorMessage(createError, translations.error));
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="pallet-create-options">
            <button className="pallet-create-option" disabled={creating} onClick={createEmpty} type="button">
                <span className="pallet-create-option-icon"><Add /></span>
                <span className="pallet-create-option-text">
                    <strong>{creating ? translations.creating : translations.empty.title}</strong>
                    <small>{translations.empty.description}</small>
                </span>
                <ChevronRight fontSize="small" />
            </button>
            <button className="pallet-create-option" disabled={creating} onClick={onCreateFromShipments} type="button">
                <span className="pallet-create-option-icon"><ViewList /></span>
                <span className="pallet-create-option-text">
                    <strong>{translations.fromShipments.title}</strong>
                    <small>{translations.fromShipments.description}</small>
                </span>
                <ChevronRight fontSize="small" />
            </button>
            {error ? <Alert severity="error">{error}</Alert> : null}
        </div>
    );
}

export default PalletCreateOptions;
