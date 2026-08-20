import React, {useEffect, useState} from "react";
import {Button, MenuItem, TextField, Typography} from "components/ui";
import {ContentCopy, DeleteOutline, GridView, Loop} from "components/ui/icons";
import pl from "../../i18n/translate";
import {MAP_ELEMENT_TYPES, MapElementDto, MapElementType, StorageLocationDto} from "./model/DepartmentMap";
import {normalizeRotation} from "./mapGeometry";

type MapElementPanelProps = {
    element: MapElementDto | null;
    location?: StorageLocationDto;
    elementCount: number;
    onChange: (element: MapElementDto) => void;
    onDelete: (element: MapElementDto) => void;
    onDuplicate: (element: MapElementDto) => void;
    onGenerateSlots: (rack: MapElementDto, count: number, prefix: string, capacity: number) => void;
};

type NumericField = "x" | "y" | "width" | "height" | "rotation";

const numericFields: NumericField[] = ["x", "y", "width", "height", "rotation"];

const toFieldValues = (element: MapElementDto) => numericFields.reduce<Record<NumericField, string>>((result, field) => ({
    ...result,
    [field]: String(element[field]),
}), {x: "", y: "", width: "", height: "", rotation: ""});

function MapElementPanel({
                             element,
                             location,
                             elementCount,
                             onChange,
                             onDelete,
                             onDuplicate,
                             onGenerateSlots,
                         }: MapElementPanelProps) {
    const translations = pl.departmentMap.editor;
    const [numericValues, setNumericValues] = useState<Record<NumericField, string>>(
        element ? toFieldValues(element) : {x: "", y: "", width: "", height: "", rotation: ""});
    const [slotCount, setSlotCount] = useState("4");
    const [slotPrefix, setSlotPrefix] = useState("");
    const [slotCapacity, setSlotCapacity] = useState("1");

    useEffect(() => {
        if (element) {
            setNumericValues(toFieldValues(element));
        }
    }, [element]);

    useEffect(() => {
        setSlotPrefix(element?.label ? element.label.replace(/\s+/g, "").toUpperCase() : "");
    }, [element?.elementId, element?.label]);

    if (!element) {
        return (
            <div className="department-map-panel-empty">
                <Typography variant="h6">{translations.noSelectionTitle}</Typography>
                <p>{translations.noSelectionDescription}</p>
                <p className="department-map-hint">{translations.elementCount.replace("{count}", String(elementCount))}</p>
                <ul className="department-map-shortcuts">
                    <li>{translations.shortcuts.delete}</li>
                    <li>{translations.shortcuts.rotate}</li>
                    <li>{translations.shortcuts.nudge}</li>
                    <li>{translations.shortcuts.undo}</li>
                </ul>
            </div>
        );
    }

    const isLocation = element.type === "STORAGE_LOCATION";
    const occupied = Boolean(location && location.pallets.length > 0);

    const commitNumber = (field: NumericField) => {
        const parsed = Number(numericValues[field].replace(",", "."));
        if (!Number.isFinite(parsed)) {
            setNumericValues(toFieldValues(element));
            return;
        }
        if ((field === "width" || field === "height") && parsed < 0.05) {
            setNumericValues(toFieldValues(element));
            return;
        }
        onChange({...element, [field]: field === "rotation" ? normalizeRotation(parsed) : parsed});
    };

    const changeType = (type: MapElementType) => onChange({
        ...element,
        type,
        locationCode: type === "STORAGE_LOCATION" ? element.locationCode || element.label || "" : null,
        capacity: type === "STORAGE_LOCATION" ? element.capacity || 1 : null,
    });

    const slotCountValue = Number(slotCount);
    const slotCapacityValue = Number(slotCapacity);
    const slotsValid = Number.isInteger(slotCountValue) && slotCountValue >= 1 && slotCountValue <= 200
        && Number.isInteger(slotCapacityValue) && slotCapacityValue >= 1 && slotCapacityValue <= 99;

    return (
        <div className="department-map-element-panel">
            <Typography variant="h6">{pl.departmentMap.elementTypes[element.type]}</Typography>
            <div className="department-map-form-grid">
                <TextField
                    select
                    disabled={occupied}
                    label={translations.fields.type}
                    size="small"
                    value={element.type}
                    onChange={(event) => changeType(event.target.value as MapElementType)}
                >
                    {MAP_ELEMENT_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>{pl.departmentMap.elementTypes[type]}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    label={translations.fields.label}
                    size="small"
                    value={element.label || ""}
                    onChange={(event) => onChange({...element, label: event.target.value})}
                />
                {isLocation ? (
                    <>
                        <TextField
                            label={translations.fields.locationCode}
                            required
                            size="small"
                            value={element.locationCode || ""}
                            onChange={(event) => onChange({...element, locationCode: event.target.value.toUpperCase()})}
                        />
                        <TextField
                            inputProps={{min: Math.max(1, location?.pallets.length || 1), max: 99}}
                            label={translations.fields.capacity}
                            required
                            size="small"
                            type="number"
                            value={element.capacity ?? 1}
                            onChange={(event) => onChange({...element, capacity: Number(event.target.value)})}
                        />
                    </>
                ) : null}
                {numericFields.map((field) => (
                    <TextField
                        inputProps={{step: field === "rotation" ? 15 : 0.1}}
                        key={field}
                        label={translations.fields[field]}
                        size="small"
                        type="number"
                        value={numericValues[field]}
                        onBlur={() => commitNumber(field)}
                        onChange={(event) => setNumericValues((current) => ({...current, [field]: event.target.value}))}
                        onKeyDown={(event: React.KeyboardEvent) => {
                            if (event.key === "Enter") {
                                commitNumber(field);
                            }
                        }}
                    />
                ))}
                <label className="department-map-color-field">
                    <span>{translations.fields.color}</span>
                    <input
                        aria-label={translations.fields.color}
                        type="color"
                        value={element.color || "#FFFFFF"}
                        onChange={(event) => onChange({...element, color: event.target.value.toUpperCase()})}
                    />
                </label>
            </div>
            {occupied ? <p className="department-map-hint">{translations.occupiedHint}</p> : null}
            <div className="department-map-panel-actions">
                <Button startIcon={<Loop />} variant="outlined"
                        onClick={() => onChange({...element, rotation: normalizeRotation(element.rotation + 90)})}>
                    {translations.rotate90}
                </Button>
                <Button startIcon={<ContentCopy />} variant="outlined" onClick={() => onDuplicate(element)}>
                    {translations.duplicate}
                </Button>
                <Button color="error" disabled={occupied} startIcon={<DeleteOutline />} variant="contained"
                        onClick={() => onDelete(element)}>
                    {pl.common.delete}
                </Button>
            </div>
            {element.type === "RACK" ? (
                <section className="department-map-slot-generator">
                    <Typography variant="h6">{translations.slots.title}</Typography>
                    <p className="department-map-hint">{translations.slots.description}</p>
                    <div className="department-map-form-grid">
                        <TextField label={translations.slots.count} size="small" type="number" value={slotCount}
                                   onChange={(event) => setSlotCount(event.target.value)} />
                        <TextField label={translations.slots.prefix} size="small" value={slotPrefix}
                                   onChange={(event) => setSlotPrefix(event.target.value.toUpperCase())} />
                        <TextField label={translations.fields.capacity} size="small" type="number" value={slotCapacity}
                                   onChange={(event) => setSlotCapacity(event.target.value)} />
                    </div>
                    <Button disabled={!slotsValid} startIcon={<GridView />} variant="contained"
                            onClick={() => onGenerateSlots(element, slotCountValue, slotPrefix, slotCapacityValue)}>
                        {translations.slots.generate}
                    </Button>
                </section>
            ) : null}
        </div>
    );
}

export default MapElementPanel;
