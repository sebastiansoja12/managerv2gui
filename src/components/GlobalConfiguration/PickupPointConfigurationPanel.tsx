import React from "react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {
    defaultPickupPointConfiguration,
    FlatPickupPointConfiguration,
    flattenPickupPointConfiguration,
    nestPickupPointConfiguration,
} from "./model/OperatorSettingsConfiguration";
import OperatorSettingsPanel, {OperatorSettingGroup} from "./OperatorSettingsPanel";

const SHIPMENT_SIZES = ["TINY", "SMALL", "MEDIUM", "AVERAGE", "BIG"];

const defaultFlatConfiguration = flattenPickupPointConfiguration(defaultPickupPointConfiguration);

const loadPickupPointConfiguration = async () => flattenPickupPointConfiguration(
    (await OperatorConfigurationService.getCurrentPickupPointConfiguration()).data,
);

const savePickupPointConfiguration = async (configuration: FlatPickupPointConfiguration) => (
    flattenPickupPointConfiguration((await OperatorConfigurationService.updateCurrentPickupPointConfiguration(
        nestPickupPointConfiguration(configuration),
    )).data)
);

export const validatePickupPointConfiguration = (configuration: FlatPickupPointConfiguration) => {
    const messages = pl.globalConfiguration.pickupPointConfiguration.validation;
    if (String(configuration.weekdayOpeningTime) >= String(configuration.weekdayClosingTime)) {
        return messages.weekdayHoursOrder;
    }
    if (configuration.saturdayOpen
        && String(configuration.saturdayOpeningTime) >= String(configuration.saturdayClosingTime)) {
        return messages.saturdayHoursOrder;
    }
    return null;
};

function PickupPointConfigurationPanel() {
    const labels = pl.globalConfiguration.pickupPointConfiguration;
    const units = pl.globalConfiguration.operatorSettings.units;
    const groups: OperatorSettingGroup[] = [
        {
            key: "defaultsPolicy",
            fields: [
                {key: "defaultType", kind: "select", options: ["SERVICE_POINT", "PARCEL_LOCKER"]},
                {key: "defaultDropOffEnabled", kind: "boolean"},
                {key: "defaultCollectionEnabled", kind: "boolean"},
                {key: "servicePointMaxShipmentSize", kind: "select", options: SHIPMENT_SIZES},
                {key: "parcelLockerMaxShipmentSize", kind: "select", options: SHIPMENT_SIZES},
                {key: "defaultAcceptsDangerousGoods", kind: "boolean"},
                {key: "weekdayOpeningTime", kind: "time"},
                {key: "weekdayClosingTime", kind: "time"},
                {key: "saturdayOpen", kind: "boolean"},
                {key: "saturdayOpeningTime", kind: "time", disabledWhen: (values) => !values.saturdayOpen},
                {key: "saturdayClosingTime", kind: "time", disabledWhen: (values) => !values.saturdayOpen},
                {key: "requireCoordinatesForActivation", kind: "boolean"},
            ],
        },
        {
            key: "collectionPolicy",
            fields: [
                {key: "verificationMethod", kind: "select", options: ["PICKUP_CODE", "SMS_CODE", "ID_DOCUMENT"]},
                {key: "pickupCodeLength", kind: "number", min: 4, max: 10, unit: units.characters},
                {key: "pickupCodeValidityHours", kind: "number", min: 1, max: 720, unit: units.hours},
                {key: "maxInvalidCodeAttempts", kind: "number", min: 1, max: 20},
                {key: "allowAuthorizedPerson", kind: "boolean"},
                {key: "reminderAfterDays", kind: "number", min: 0, max: 30, unit: units.days},
                {key: "allowStorageExtension", kind: "boolean"},
                {
                    key: "storageExtensionDays",
                    kind: "number",
                    min: 1,
                    max: 14,
                    unit: units.days,
                    disabledWhen: (values) => !values.allowStorageExtension,
                },
            ],
        },
        {
            key: "lockerPolicy",
            fields: [
                {key: "courierCompartmentHoldMinutes", kind: "number", min: 1, max: 240, unit: units.minutes},
                {key: "compartmentReservationHours", kind: "number", min: 0, max: 168, unit: units.hours},
                {
                    key: "oversizedShipmentPolicy",
                    kind: "select",
                    options: ["REDIRECT_TO_SERVICE_POINT", "RETURN_TO_DEPARTMENT"],
                },
                {key: "suspendAfterCompartmentFailures", kind: "number", min: 0, max: 50},
            ],
        },
        {
            key: "selectionPolicy",
            fields: [
                {key: "maxDistanceKm", kind: "number", min: 1, max: 100, unit: units.km},
                {key: "preference", kind: "select", options: ["NEAREST", "PARCEL_LOCKER", "SERVICE_POINT"]},
                {key: "alternativeCount", kind: "number", min: 0, max: 10},
                {key: "fullPointPolicy", kind: "select", options: ["SELECT_NEXT", "REJECT"]},
                {key: "sameDepartmentOnly", kind: "boolean"},
            ],
        },
        {
            key: "capacityPolicy",
            fields: [
                {key: "defaultCapacity", kind: "number", min: 1, max: 100000, unit: units.shipments},
                {key: "capacityWarningThresholdPercent", kind: "number", min: 1, max: 100, unit: "%"},
                {key: "blockIntakeWhenFull", kind: "boolean"},
            ],
        },
        {
            key: "lifecyclePolicy",
            fields: [
                {key: "requireStatusChangeReason", kind: "boolean"},
                {key: "suspendedPointShipmentPolicy", kind: "select", options: ["REDIRECT", "WAIT", "RETURN"]},
                {key: "blockClosingWithPendingShipments", kind: "boolean"},
                {key: "autoResumeSuspendedAfterDays", kind: "number", min: 0, max: 365, unit: units.days},
            ],
        },
    ];

    return (
        <OperatorSettingsPanel<FlatPickupPointConfiguration>
            defaults={defaultFlatConfiguration}
            groups={groups}
            labels={labels}
            load={loadPickupPointConfiguration}
            save={savePickupPointConfiguration}
            validate={validatePickupPointConfiguration}
        />
    );
}

export default PickupPointConfigurationPanel;
