import React from "react";
import pl from "../../../i18n/translate";
import {DeliveryTimeConfiguration, OperatorDraft, ShipmentLimits} from "../../Operators/model/Operator";

type OperatorLimitsFieldsProps = {
    draft: OperatorDraft;
    onUpdateDraft: <K extends keyof OperatorDraft>(key: K, value: OperatorDraft[K]) => void;
};

const limitKeys: Array<keyof ShipmentLimits> = [
    "minWeight",
    "maxWeight",
    "maxLength",
    "maxWidth",
    "maxHeight",
    "maxShipmentValue",
];

const deliveryKeys: Array<keyof DeliveryTimeConfiguration> = [
    "minDeliveryDays",
    "maxDeliveryDays",
    "expressDeliveryDays",
    "sameDayDeliveryHours",
    "internationalDeliveryDays",
];

const toNumber = (value: string) => {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
};

function OperatorLimitsFields({draft, onUpdateDraft}: OperatorLimitsFieldsProps) {
    const editor = pl.superAdmin.editor;

    const updateLimit = (key: keyof ShipmentLimits, value: string) => {
        onUpdateDraft("configuration", {
            ...draft.configuration,
            shipmentLimits: {...draft.configuration.shipmentLimits, [key]: toNumber(value)},
        });
    };

    const updateDelivery = (key: keyof DeliveryTimeConfiguration, value: string) => {
        onUpdateDraft("configuration", {
            ...draft.configuration,
            deliveryTimeConfiguration: {...draft.configuration.deliveryTimeConfiguration, [key]: toNumber(value)},
        });
    };

    return (
        <div className="super-admin-limits-grid">
            <fieldset className="super-admin-data-section">
                <legend>{editor.shipmentLimitsTitle}</legend>
                <div className="super-admin-form-grid super-admin-form-grid-3">
                    {limitKeys.map((key) => (
                        <label key={key}>
                            <span>{editor.limits[key]}</span>
                            <input
                                min="0"
                                name={key}
                                onChange={(event) => updateLimit(key, event.target.value)}
                                step="0.1"
                                type="number"
                                value={draft.configuration.shipmentLimits?.[key] ?? 0}
                            />
                        </label>
                    ))}
                </div>
            </fieldset>
            <fieldset className="super-admin-data-section">
                <legend>{editor.deliveryTitle}</legend>
                <div className="super-admin-form-grid super-admin-form-grid-3">
                    {deliveryKeys.map((key) => (
                        <label key={key}>
                            <span>{editor.delivery[key]}</span>
                            <input
                                min="0"
                                name={key}
                                onChange={(event) => updateDelivery(key, event.target.value)}
                                step="1"
                                type="number"
                                value={draft.configuration.deliveryTimeConfiguration?.[key] ?? 0}
                            />
                        </label>
                    ))}
                </div>
            </fieldset>
        </div>
    );
}

export default OperatorLimitsFields;
