import React, {ChangeEvent} from "react";
import {Checkbox, FormControlLabel, MenuItem, TextField} from "@mui/material";
import {
    countryCodes,
    DangerousGoodApi,
    dangerousGoodQuantityUnits,
    dangerousGoodRegulationTypes,
    dangerousGoodTransportModes,
    packingGroups,
} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";

type DangerousGoodFormProps = {
    value: DangerousGoodApi;
    onChange: (value: DangerousGoodApi) => void;
    disabled?: boolean;
};

export const createEmptyDangerousGood = (): DangerousGoodApi => ({
    unNumber: "",
    properShippingName: "",
    description: "",
    hazardClass: "",
    hazardDivision: "",
    subsidiaryRisk: "",
    packingGroup: "",
    quantity: 0,
    quantityUnit: "KILOGRAM",
    packageCount: 1,
    packagingType: "",
    limitedQuantity: false,
    exceptedQuantity: false,
    environmentallyHazardous: false,
    marinePollutant: false,
    transportCategory: "",
    tunnelRestrictionCode: "",
    flashPoint: null,
    emergencyContact: "",
    emergencyContact24h: "",
    safetyDataSheetReference: "",
    declarationDocumentReference: "",
    regulationType: "ADR",
    transportMode: "ROAD",
    flammable: false,
    corrosive: false,
    toxic: false,
    hazardSymbols: "",
    storageRequirements: "",
    handlingInstructions: "",
    countryOfOrigin: "PL",
});

export const isDangerousGoodValid = (value: DangerousGoodApi): boolean => {
    const packingGroupValid = !value.packingGroup || packingGroups.includes(value.packingGroup as never);
    const requires24HourContact = ["AIR", "SEA"].includes(value.transportMode)
        || ["IATA", "IMDG"].includes(value.regulationType);

    return /^UN\d{4}$/.test(value.unNumber.trim())
        && Boolean(value.properShippingName.trim())
        && Boolean(value.hazardClass.trim())
        && value.quantity > 0
        && Boolean(value.quantityUnit)
        && Number.isInteger(value.packageCount)
        && value.packageCount > 0
        && Boolean(value.packagingType.trim())
        && packingGroupValid
        && Boolean(value.regulationType)
        && Boolean(value.transportMode)
        && (!requires24HourContact || Boolean(value.emergencyContact24h.trim()));
};

const DangerousGoodForm: React.FC<DangerousGoodFormProps> = ({value, onChange, disabled = false}) => {
    const fields = pl.shipments.form.fields;
    const update = <K extends keyof DangerousGoodApi>(field: K, fieldValue: DangerousGoodApi[K]) => {
        onChange({...value, [field]: fieldValue});
    };
    const text = (
        field: keyof DangerousGoodApi,
        label: string,
        required = false,
        type: "text" | "number" = "text",
    ) => (
        <TextField
            disabled={disabled}
            fullWidth
            label={label}
            required={required}
            size="small"
            type={type}
            value={value[field] ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const nextValue = type === "number"
                    ? (event.target.value === "" && field === "flashPoint" ? null : Number(event.target.value))
                    : event.target.value;
                update(field, nextValue as never);
            }}
        />
    );
    const select = (
        field: keyof DangerousGoodApi,
        label: string,
        values: readonly string[],
        required = false,
    ) => (
        <TextField
            disabled={disabled}
            fullWidth
            label={label}
            required={required}
            select
            size="small"
            value={String(value[field] ?? "")}
            onChange={(event) => update(field, event.target.value as never)}
        >
            {values.map((option) => (
                <MenuItem key={option || "none"} value={option}>{option || pl.common.dash}</MenuItem>
            ))}
        </TextField>
    );
    const flag = (field: keyof DangerousGoodApi, label: string) => (
        <FormControlLabel
            control={(
                <Checkbox
                    checked={Boolean(value[field])}
                    disabled={disabled}
                    onChange={(event) => update(field, event.target.checked as never)}
                />
            )}
            label={label}
        />
    );

    return (
        <div className="shipments-form-grid">
            {text("unNumber", fields.unNumber, true)}
            {text("properShippingName", fields.properShippingName, true)}
            {text("description", fields.description)}
            {text("hazardClass", fields.hazardClass, true)}
            {text("hazardDivision", fields.hazardDivision)}
            {text("subsidiaryRisk", fields.subsidiaryRisk)}
            {select("packingGroup", fields.packingGroup, packingGroups)}
            {text("quantity", fields.quantity, true, "number")}
            {select("quantityUnit", fields.quantityUnit, dangerousGoodQuantityUnits, true)}
            {text("packageCount", fields.packageCount, true, "number")}
            {text("packagingType", fields.packagingType, true)}
            {select("regulationType", fields.regulationType, dangerousGoodRegulationTypes, true)}
            {select("transportMode", fields.transportMode, dangerousGoodTransportModes, true)}
            {text("transportCategory", fields.transportCategory)}
            {text("tunnelRestrictionCode", fields.tunnelRestrictionCode)}
            {text("flashPoint", fields.flashPoint, false, "number")}
            {text("emergencyContact", fields.emergencyContact)}
            {text("emergencyContact24h", fields.emergencyContact24h)}
            {text("safetyDataSheetReference", fields.safetyDataSheetReference)}
            {text("declarationDocumentReference", fields.declarationDocumentReference)}
            {text("hazardSymbols", fields.hazardSymbols)}
            {text("storageRequirements", fields.storageRequirements)}
            {text("handlingInstructions", fields.handlingInstructions)}
            {select("countryOfOrigin", fields.countryOfOrigin, countryCodes)}
            {flag("limitedQuantity", fields.limitedQuantity)}
            {flag("exceptedQuantity", fields.exceptedQuantity)}
            {flag("environmentallyHazardous", fields.environmentallyHazardous)}
            {flag("marinePollutant", fields.marinePollutant)}
            {flag("flammable", fields.flammable)}
            {flag("corrosive", fields.corrosive)}
            {flag("toxic", fields.toxic)}
        </div>
    );
};

export default DangerousGoodForm;
