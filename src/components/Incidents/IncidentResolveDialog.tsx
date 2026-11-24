import React, {useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Stack,
    TextField,
} from "components/ui";
import pl from "../../i18n/translate";
import ShipmentService from "../../hooks/ShipmentService";
import {PackagingTypeDto, ShipmentDto} from "../Shipment/dto/ShipmentDto";
import {IncidentDto, IncidentResolution, RepackagingRequest} from "./model/Incident";
import {
    availableResolutionOptions,
    INCIDENT_RESOLUTION_GROUPS,
    IncidentResolutionOption,
} from "./incidentResolutionOptions";

const PACKAGING_TYPES: PackagingTypeDto[] = ["ENVELOPE", "BAG", "BOX", "TUBE", "CRATE", "OTHER"];

type RepackagingDraft = {
    packagingType: PackagingTypeDto | "";
    weightInKilograms: string;
    lengthInCentimeters: string;
    widthInCentimeters: string;
    heightInCentimeters: string;
};

const emptyRepackagingDraft: RepackagingDraft = {
    packagingType: "",
    weightInKilograms: "",
    lengthInCentimeters: "",
    widthInCentimeters: "",
    heightInCentimeters: "",
};

const positiveNumber = (value: string) => {
    const parsed = Number(value.replace(",", "."));
    return value.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toRepackagingRequest = (draft: RepackagingDraft): RepackagingRequest => ({
    packagingType: draft.packagingType || null,
    weightInKilograms: positiveNumber(draft.weightInKilograms),
    lengthInCentimeters: positiveNumber(draft.lengthInCentimeters),
    widthInCentimeters: positiveNumber(draft.widthInCentimeters),
    heightInCentimeters: positiveNumber(draft.heightInCentimeters),
});

const repackagingDraftInvalid = (draft: RepackagingDraft) => {
    const numericFields = [draft.weightInKilograms, draft.lengthInCentimeters, draft.widthInCentimeters, draft.heightInCentimeters];
    const invalidNumber = numericFields.some((value) => value.trim() && positiveNumber(value) === null);
    const dimensions = [draft.lengthInCentimeters, draft.widthInCentimeters, draft.heightInCentimeters].filter((value) => value.trim());
    return invalidNumber || (dimensions.length > 0 && dimensions.length < 3);
};

type IncidentResolveDialogProps = {
    incident: IncidentDto | null;
    resolving: boolean;
    error: string | null;
    onClose: () => void;
    onResolve: (resolution: IncidentResolution, note: string | null, repackaging: RepackagingRequest | null) => void;
    onOpenShipment?: (incident: IncidentDto) => void;
};

function IncidentResolveDialog({incident, resolving, error, onClose, onResolve, onOpenShipment}: IncidentResolveDialogProps) {
    const translations = pl.incidents;
    const [shipment, setShipment] = useState<ShipmentDto | null>(null);
    const [resolution, setResolution] = useState<IncidentResolution | null>(null);
    const [note, setNote] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [showOtherOptions, setShowOtherOptions] = useState(false);
    const [optionSearch, setOptionSearch] = useState("");
    const [noteTouched, setNoteTouched] = useState(false);
    const [repackagingDraft, setRepackagingDraft] = useState<RepackagingDraft>(emptyRepackagingDraft);

    useEffect(() => {
        if (!incident) {
            return;
        }
        setResolution(null);
        setNote("");
        setConfirmed(false);
        setShowOtherOptions(false);
        setOptionSearch("");
        setNoteTouched(false);
        setRepackagingDraft(emptyRepackagingDraft);
        setShipment(null);
        let active = true;
        ShipmentService.get(incident.shipmentId.value)
            .then((response) => {
                if (active) {
                    setShipment(response.data);
                }
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, [incident]);

    const options = useMemo(
        () => incident ? availableResolutionOptions(incident.category, shipment?.shipmentStatus ?? null) : [],
        [incident, shipment?.shipmentStatus],
    );
    const recommendedOptions = options.filter((option) => option.recommended);
    const normalizedSearch = optionSearch.trim().toLowerCase();
    const otherOptions = options.filter((option) => !option.recommended && (!normalizedSearch
        || translations.resolutions[option.resolution].toLowerCase().includes(normalizedSearch)
        || translations.resolveDialog.options[option.resolution].toLowerCase().includes(normalizedSearch)));
    const hasOtherOptions = options.some((option) => !option.recommended);
    const selectedOption = options.find((option) => option.resolution === resolution) || null;
    const noteMissing = Boolean(selectedOption?.noteRequired) && !note.trim();
    const confirmationMissing = Boolean(selectedOption?.irreversible) && !confirmed;
    const repackagingInvalid = Boolean(selectedOption?.repackaging) && repackagingDraftInvalid(repackagingDraft);
    const canSubmit = Boolean(selectedOption) && !noteMissing && !confirmationMissing && !repackagingInvalid && !resolving;

    const selectOption = (option: IncidentResolutionOption) => {
        setResolution(option.resolution);
        setConfirmed(false);
        setNoteTouched(false);
    };

    const changeRepackaging = (field: keyof RepackagingDraft, value: string) =>
        setRepackagingDraft((current) => ({...current, [field]: value}));

    const submit = () => {
        if (!selectedOption) {
            return;
        }
        onResolve(selectedOption.resolution, note.trim() || null,
            selectedOption.repackaging ? toRepackagingRequest(repackagingDraft) : null);
    };

    const renderOption = (option: IncidentResolutionOption) => (
        <button
            aria-pressed={resolution === option.resolution}
            className={`incident-resolution-option${option.irreversible ? " incident-resolution-option-irreversible" : ""}`}
            disabled={resolving}
            key={option.resolution}
            type="button"
            onClick={() => selectOption(option)}
        >
            <strong>{translations.resolutions[option.resolution]}</strong>
            <span>{translations.resolveDialog.options[option.resolution]}</span>
        </button>
    );

    const declaredValue = shipment?.declaredValue
        ? `${shipment.declaredValue.amount} ${shipment.declaredValue.currency}`
        : null;

    return (
        <Dialog open={Boolean(incident)} onClose={() => !resolving && onClose()} fullWidth maxWidth="lg">
            <DialogTitle>{translations.resolveDialog.title.replace("{incidentId}", String(incident?.incidentId.value ?? ""))}</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                    <span className="incident-resolution-subtitle">
                        {translations.resolveDialog.subtitle.replace("{trackingNumber}",
                            incident?.trackingNumber || incident?.shipmentId.value || "")}
                    </span>
                    <div className="incident-resolution-options">
                        {recommendedOptions.map(renderOption)}
                    </div>
                    {hasOtherOptions ? (
                        <>
                            <Button size="small" variant="text" onClick={() => setShowOtherOptions((current) => !current)}>
                                {showOtherOptions ? translations.resolveDialog.hideOtherOptions : translations.resolveDialog.otherOptions}
                            </Button>
                            {showOtherOptions ? (
                                <>
                                    <TextField fullWidth size="small"
                                               label={translations.resolveDialog.searchOptions}
                                               value={optionSearch}
                                               onChange={(event: React.ChangeEvent<HTMLInputElement>) => setOptionSearch(event.target.value)} />
                                    {INCIDENT_RESOLUTION_GROUPS.map((group) => {
                                        const groupOptions = otherOptions.filter((option) => option.group === group);
                                        return groupOptions.length > 0 ? (
                                            <section className="incident-resolution-group" key={group}>
                                                <h4>{translations.resolveDialog.groups[group]}</h4>
                                                <div className="incident-resolution-options">
                                                    {groupOptions.map(renderOption)}
                                                </div>
                                            </section>
                                        ) : null;
                                    })}
                                    {otherOptions.length === 0 ? (
                                        <span className="incident-resolution-subtitle">{translations.resolveDialog.noOptionsFound}</span>
                                    ) : null}
                                </>
                            ) : null}
                        </>
                    ) : null}

                    {selectedOption && ["WRITTEN_OFF", "STOLEN", "DESTROYED_DISPOSED"].includes(selectedOption.resolution) ? (
                        <Alert severity="warning">
                            {declaredValue
                                ? translations.resolveDialog.declaredValue.replace("{value}", declaredValue)
                                : translations.resolveDialog.noDeclaredValue}
                        </Alert>
                    ) : null}

                    {selectedOption?.opensShipment && incident && onOpenShipment ? (
                        <Button variant="outlined" size="small" onClick={() => onOpenShipment(incident)}>
                            {translations.resolveDialog.openShipment}
                        </Button>
                    ) : null}

                    {selectedOption?.repackaging ? (
                        <section className="incident-resolution-group">
                            <h4>{translations.resolveDialog.repackaging.title}</h4>
                            <div className="incident-repackaging-fields">
                                <TextField select size="small"
                                           label={translations.resolveDialog.repackaging.packagingType}
                                           value={repackagingDraft.packagingType}
                                           onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeRepackaging("packagingType", event.target.value)}>
                                    <MenuItem value="">{translations.resolveDialog.repackaging.unchanged}</MenuItem>
                                    {PACKAGING_TYPES.map((packagingType) => (
                                        <MenuItem key={packagingType} value={packagingType}>{pl.shipments.packagingType[packagingType]}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField size="small" inputMode="decimal"
                                           label={translations.resolveDialog.repackaging.weight}
                                           value={repackagingDraft.weightInKilograms}
                                           onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeRepackaging("weightInKilograms", event.target.value)} />
                                <TextField size="small" inputMode="decimal"
                                           label={translations.resolveDialog.repackaging.length}
                                           value={repackagingDraft.lengthInCentimeters}
                                           onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeRepackaging("lengthInCentimeters", event.target.value)} />
                                <TextField size="small" inputMode="decimal"
                                           label={translations.resolveDialog.repackaging.width}
                                           value={repackagingDraft.widthInCentimeters}
                                           onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeRepackaging("widthInCentimeters", event.target.value)} />
                                <TextField size="small" inputMode="decimal"
                                           label={translations.resolveDialog.repackaging.height}
                                           value={repackagingDraft.heightInCentimeters}
                                           onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeRepackaging("heightInCentimeters", event.target.value)} />
                            </div>
                            <span className="incident-resolution-subtitle">
                                {repackagingInvalid ? translations.resolveDialog.repackaging.invalid : translations.resolveDialog.repackaging.hint}
                            </span>
                        </section>
                    ) : null}

                    {selectedOption ? (
                        <TextField fullWidth multiline rows={3}
                                   label={translations.resolveDialog.note}
                                   placeholder={selectedOption.resolution === "FOUND"
                                       ? translations.resolveDialog.foundPlaceholder
                                       : translations.resolveDialog.notePlaceholder}
                                   required={selectedOption.noteRequired}
                                   error={noteTouched && noteMissing}
                                   helperText={noteTouched && noteMissing ? translations.resolveDialog.noteRequired : translations.resolveDialog.noteHint}
                                   value={note}
                                   inputProps={{maxLength: 2000}}
                                   onBlur={() => setNoteTouched(true)}
                                   onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)} />
                    ) : null}

                    {selectedOption?.shipmentAction ? (
                        <Alert severity="info">{translations.resolveDialog.asyncInfo}</Alert>
                    ) : null}

                    {selectedOption?.irreversible ? (
                        <FormControlLabel
                            control={<Checkbox checked={confirmed} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirmed(event.target.checked)} />}
                            label={translations.resolveDialog.confirm}
                        />
                    ) : null}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" disabled={resolving} onClick={onClose}>{pl.common.cancel}</Button>
                <Button disabled={!canSubmit} startIcon={resolving ? <CircularProgress size={16} /> : undefined} onClick={submit}>
                    {translations.resolveDialog.submit}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default IncidentResolveDialog;
