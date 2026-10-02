import React, {ChangeEvent, useEffect, useState} from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "components/ui";
import {ArrowBack, Close, Edit, LocalShipping, Refresh, Save} from "components/ui/icons";
import {useNavigate, useParams} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {
    departmentCodeValue,
    LengthUnitDto,
    PersonApi,
    PersonType,
    ShipmentDto,
    shipmentChangeStatuses,
    ShipmentStatusDto,
    ShipmentUpdateRequestApi,
    WeightUnitDto,
} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";
import "./styles/shipments.css";

type Notice = {
    severity: "success" | "error";
    message: string;
};

const emptyPerson: PersonApi = {
    firstName: "",
    lastName: "",
    email: "",
    telephoneNumber: "",
    city: "",
    postalCode: "",
    street: "",
};

const clonePerson = (person?: PersonApi): PersonApi => ({
    ...emptyPerson,
    ...(person || {}),
});

const fullName = (person?: PersonApi) => {
    const value = `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
    return value || pl.common.dash;
};

const personsEqual = (left?: PersonApi, right?: PersonApi) => {
    const first = clonePerson(left);
    const second = clonePerson(right);

    return first.firstName === second.firstName
        && first.lastName === second.lastName
        && first.email === second.email
        && first.telephoneNumber === second.telephoneNumber
        && first.city === second.city
        && first.postalCode === second.postalCode
        && first.street === second.street;
};

const formatPrice = (shipment?: ShipmentDto | null) => {
    if (!shipment?.price) {
        return pl.common.dash;
    }

    return `${shipment.price.amount.toLocaleString(pl.common.locale)} ${shipment.price.currency}`;
};

const ShipmentEdit: React.FC = () => {
    const navigate = useNavigate();
    const {shipmentId, trackingNumber} = useParams();
    const [shipment, setShipment] = useState<ShipmentDto | null>(null);
    const [status, setStatus] = useState<ShipmentStatusDto>("CREATED");
    const [sender, setSender] = useState<PersonApi>({...emptyPerson});
    const [recipient, setRecipient] = useState<PersonApi>({...emptyPerson});
    const [length, setLength] = useState<string>("");
    const [width, setWidth] = useState<string>("");
    const [height, setHeight] = useState<string>("");
    const [lengthUnit, setLengthUnit] = useState<LengthUnitDto>("CM");
    const [weight, setWeight] = useState<string>("");
    const [weightUnit, setWeightUnit] = useState<WeightUnitDto>("KG");
    const [contentDescription, setContentDescription] = useState<string>("");
    const [customerReference, setCustomerReference] = useState<string>("");
    const [declaredValueAmount, setDeclaredValueAmount] = useState<string>("");
    const [declaredValueCurrency, setDeclaredValueCurrency] = useState<string>("PLN");
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [savingPersonType, setSavingPersonType] = useState<PersonType | null>(null);
    const [personDialogType, setPersonDialogType] = useState<PersonType | null>(null);
    const [personDraft, setPersonDraft] = useState<PersonApi>({...emptyPerson});
    const [notice, setNotice] = useState<Notice | null>(null);

    const validShipmentId = Boolean(shipmentId && /^\d+$/.test(shipmentId) && !/^0+$/.test(shipmentId));
    const decodedTrackingNumber = trackingNumber ? decodeURIComponent(trackingNumber) : "";
    const personDialogSource = personDialogType === "SENDER" ? shipment?.sender : shipment?.recipient;
    const personDialogChanged = personDialogType ? !personsEqual(personDialogSource, personDraft) : false;
    const shipmentDetailsChanged = Boolean(shipment && (
        length !== String(shipment.dimensions?.length ?? "")
        || width !== String(shipment.dimensions?.width ?? "")
        || height !== String(shipment.dimensions?.height ?? "")
        || lengthUnit !== (shipment.dimensions?.unit || "CM")
        || weight !== String(shipment.weight?.value ?? "")
        || weightUnit !== (shipment.weight?.unit || "KG")
        || contentDescription !== (shipment.contentDescription || "")
        || customerReference !== (shipment.customerReference || "")
        || declaredValueAmount !== String(shipment.declaredValue?.amount ?? "")
        || declaredValueCurrency !== (shipment.declaredValue?.currency || "PLN")
    ));

    const showError = (error: unknown, fallback = pl.shipments.messages.operationFailed) => {
        const apiError = error as ApiErrorResponse;
        setNotice({
            severity: "error",
            message: apiError.message || (error as Error).message || fallback,
        });
    };

    const applyShipment = (data: ShipmentDto) => {
        setShipment(data);
        setStatus(data.shipmentStatus);
        setSender(clonePerson(data.sender));
        setRecipient(clonePerson(data.recipient));
        setLength(String(data.dimensions?.length ?? ""));
        setWidth(String(data.dimensions?.width ?? ""));
        setHeight(String(data.dimensions?.height ?? ""));
        setLengthUnit(data.dimensions?.unit || "CM");
        setWeight(String(data.weight?.value ?? ""));
        setWeightUnit(data.weight?.unit || "KG");
        setContentDescription(data.contentDescription || "");
        setCustomerReference(data.customerReference || "");
        setDeclaredValueAmount(String(data.declaredValue?.amount ?? ""));
        setDeclaredValueCurrency(data.declaredValue?.currency || "PLN");
        setPersonDialogType(null);
        setPersonDraft({...emptyPerson});
    };

    const loadShipment = async () => {
        if (!decodedTrackingNumber && !validShipmentId) {
            setLoading(false);
            setNotice({severity: "error", message: pl.shipments.messages.invalidTrackingNumber});
            return;
        }

        setLoading(true);
        try {
            const response = decodedTrackingNumber
                ? await ShipmentService.getByTrackingNumber(decodedTrackingNumber)
                : await ShipmentService.get(shipmentId || "");
            applyShipment(response.data);
        } catch (error) {
            showError(error, pl.shipments.messages.loadError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShipment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentId, trackingNumber]);

    const updatePersonDraftField = (
        field: keyof PersonApi,
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const value = event.target.value;
        setPersonDraft((current) => ({...current, [field]: value}));
    };

    const saveShipment = async () => {
        if (!shipment) {
            return;
        }

        if (shipmentDetailsChanged) {
            const measurements = [length, width, height, weight].map(Number);
            if (!measurements.every((value) => Number.isFinite(value) && value > 0)) {
                setNotice({severity: "error", message: pl.shipments.messages.measurementsRequired});
                return;
            }
            if (declaredValueAmount.trim()
                && (!Number.isFinite(Number(declaredValueAmount)) || Number(declaredValueAmount) < 0)) {
                setNotice({severity: "error", message: pl.shipments.messages.declaredValueInvalid});
                return;
            }
        }

        setSaving(true);
        try {
            if (shipmentDetailsChanged) {
                const request: ShipmentUpdateRequestApi = {
                    shipmentId: shipment.shipmentId,
                    sender,
                    recipient,
                    destination: {value: departmentCodeValue(shipment.destination)},
                    dimensions: {
                        length: Number(length),
                        width: Number(width),
                        height: Number(height),
                        unit: lengthUnit,
                    },
                    weight: {value: Number(weight), unit: weightUnit},
                    ...(contentDescription.trim() ? {contentDescription: contentDescription.trim()} : {}),
                    ...(customerReference.trim() ? {customerReference: customerReference.trim()} : {}),
                    ...(declaredValueAmount.trim() ? {
                        declaredValue: {amount: Number(declaredValueAmount), currency: declaredValueCurrency},
                    } : {}),
                    price: shipment.price,
                    shipmentPriority: shipment.shipmentPriority,
                    shipmentStatus: status,
                    issuerCountryCode: shipment.sender.countryCode || "PL",
                    receiverCountryCode: shipment.recipient.countryCode || "DE",
                    shipmentConfiguration: {
                        forceUpdate: false,
                        publishInReturnManager: false,
                        customRerouteDepartment: true,
                    },
                };
                await ShipmentService.update(request);
            } else if (status !== shipment.shipmentStatus) {
                await ShipmentService.updateStatus({
                    shipmentId: shipment.shipmentId,
                    shipmentStatus: status,
                });
            }

            const response = shipment.trackingNumber?.value
                ? await ShipmentService.getByTrackingNumber(shipment.trackingNumber.value)
                : await ShipmentService.get(shipment.shipmentId.value);
            applyShipment(response.data);
            setNotice({
                severity: "success",
                message: shipmentDetailsChanged ? pl.shipments.messages.saveSuccess : pl.shipments.messages.statusSaveSuccess,
            });
        } catch (error) {
            showError(error, shipmentDetailsChanged
                ? pl.shipments.messages.saveError
                : pl.shipments.messages.statusSaveError);
        } finally {
            setSaving(false);
        }
    };

    const savePerson = async () => {
        const personType = personDialogType;
        if (!shipment) {
            return;
        }
        if (!personType) {
            return;
        }

        setSavingPersonType(personType);
        try {
            if (personType === "SENDER") {
                await ShipmentService.updateSender(shipment.shipmentId.value, personDraft);
            } else {
                await ShipmentService.updateRecipient(shipment.shipmentId.value, personDraft);
            }
            const response = shipment.trackingNumber?.value
                ? await ShipmentService.getByTrackingNumber(shipment.trackingNumber.value)
                : await ShipmentService.get(shipment.shipmentId.value);
            applyShipment(response.data);
            setNotice({
                severity: "success",
                message: personType === "SENDER"
                    ? pl.shipments.messages.senderSaveSuccess
                    : pl.shipments.messages.recipientSaveSuccess,
            });
        } catch (error) {
            showError(error, personType === "SENDER"
                ? pl.shipments.messages.senderSaveError
                : pl.shipments.messages.recipientSaveError);
        } finally {
            setSavingPersonType(null);
        }
    };

    const openPersonDialog = (personType: PersonType) => {
        setPersonDraft(clonePerson(personType === "SENDER" ? shipment?.sender : shipment?.recipient));
        setPersonDialogType(personType);
    };

    const closePersonDialog = () => {
        setPersonDialogType(null);
        setPersonDraft({...emptyPerson});
    };

    const personFields = (title: string, personType: PersonType, person: PersonApi) => {
        return (
            <section
                className={`shipment-edit-section ${
                    personType === "SENDER" ? "shipment-details-person-sender" : "shipment-details-person-recipient"
                }`}
            >
                <div className="shipment-edit-section-header">
                    <Typography variant="h6">{title}</Typography>
                    <div className="shipment-edit-section-actions">
                        <Button
                            className="shipment-edit-section-action"
                            disabled={loading || !shipment || savingPersonType !== null || saving}
                            onClick={() => openPersonDialog(personType)}
                            size="small"
                            startIcon={<Edit />}
                            variant="outlined"
                        >
                            {personType === "SENDER"
                                ? pl.shipments.form.actions.editSender
                                : pl.shipments.form.actions.editRecipient}
                        </Button>
                    </div>
                </div>
                <div className="shipment-details-grid">
                    <TextField
                        InputProps={{readOnly: true}}
                        label={pl.shipments.form.fields.firstName}
                        size="small"
                        value={person.firstName}
                    />
                    <TextField
                        InputProps={{readOnly: true}}
                        label={pl.shipments.form.fields.lastName}
                        size="small"
                        value={person.lastName}
                    />
                    <TextField
                        InputProps={{readOnly: true}}
                        label={pl.shipments.form.fields.email}
                        size="small"
                        value={person.email}
                    />
                    <TextField
                        InputProps={{readOnly: true}}
                        label={pl.shipments.form.fields.phone}
                        size="small"
                        value={person.telephoneNumber}
                    />
                    <TextField
                        InputProps={{readOnly: true}}
                        label={pl.shipments.form.fields.city}
                        size="small"
                        value={person.city}
                    />
                    <TextField
                        InputProps={{readOnly: true}}
                        label={pl.shipments.form.fields.postalCode}
                        size="small"
                        value={person.postalCode}
                    />
                    <TextField
                        className="shipment-details-wide"
                        InputProps={{readOnly: true}}
                        label={pl.shipments.form.fields.street}
                        size="small"
                        value={person.street}
                    />
                </div>
            </section>
        );
    };

    return (
        <div className="shipments-page">
            <div className="shipments-shell">
                <div className="shipments-header">
                    <div className="shipments-title">
                        <span className="shipments-title-icon"><LocalShipping /></span>
                        <Box>
                            <Typography variant="h4">
                                {shipment
                                    ? pl.shipments.page.editTitleWithShipment.replace("{value}", shipment.trackingNumber?.value || `#${shipment.shipmentId.value}`)
                                    : pl.shipments.page.editTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {shipment
                                    ? `${shipment.trackingNumber?.value || pl.common.dash} · ${fullName(shipment.sender)} → ${fullName(shipment.recipient)}`
                                    : pl.shipments.page.editLoadingSubtitle}
                            </Typography>
                        </Box>
                    </div>
                    <div className="shipment-edit-header-actions">
                        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate("/shipments/list")}>
                            {pl.navigation.shipmentList}
                        </Button>
                        <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={loadShipment}>
                            {pl.common.refresh}
                        </Button>
                        <Button
                            disabled={loading || saving || !shipment
                                || (status === shipment.shipmentStatus && !shipmentDetailsChanged)}
                            startIcon={<Save />}
                            variant="contained"
                            onClick={saveShipment}
                        >
                            {pl.common.saveChanges}
                        </Button>
                    </div>
                </div>

                <div className="shipments-panel shipment-edit-panel">
                    {loading ? (
                        <div className="shipment-edit-loader">
                            <CircularProgress size={30} />
                            <span>{pl.shipments.page.editLoadingSubtitle}</span>
                        </div>
                    ) : shipment ? (
                        <>
                            <section className="shipment-details-summary shipment-edit-summary">
                                <div>
                                    <span>{pl.shipments.summary.tracking}</span>
                                    <strong>{shipment.trackingNumber?.value || pl.common.dash}</strong>
                                </div>
                                <div>
                                    <span>{pl.shipments.summary.dimensions}</span>
                                    <strong>{shipment.dimensions
                                        ? `${shipment.dimensions.length} × ${shipment.dimensions.width} × ${shipment.dimensions.height} ${shipment.dimensions.unit}`
                                        : pl.common.dash}</strong>
                                </div>
                                <div>
                                    <span>{pl.shipments.summary.destination}</span>
                                    <strong>{departmentCodeValue(shipment.destination) || pl.common.dash}</strong>
                                </div>
                                <div>
                                    <span>{pl.shipments.summary.price}</span>
                                    <strong>{formatPrice(shipment)}</strong>
                                </div>
                                <div>
                                    <span>{pl.shipments.summary.priority}</span>
                                    <strong>{pl.shipments.priority[shipment.shipmentPriority]}</strong>
                                </div>
                            </section>

                            <section className="shipment-edit-section">
                                <div className="shipment-edit-section-header">
                                    <Typography variant="h6">{pl.shipments.form.sections.shipmentData}</Typography>
                                </div>
                                <div className="shipment-details-grid">
                                    <TextField label={pl.shipments.form.fields.length} size="small" type="number" value={length}
                                        onChange={(event) => setLength(event.target.value)} />
                                    <TextField label={pl.shipments.form.fields.width} size="small" type="number" value={width}
                                        onChange={(event) => setWidth(event.target.value)} />
                                    <TextField label={pl.shipments.form.fields.height} size="small" type="number" value={height}
                                        onChange={(event) => setHeight(event.target.value)} />
                                    <TextField label={pl.shipments.form.fields.lengthUnit} select size="small" value={lengthUnit}
                                        onChange={(event) => setLengthUnit(event.target.value as LengthUnitDto)}>
                                        {(["MM", "CM", "M"] as const).map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
                                    </TextField>
                                    <TextField label={pl.shipments.form.fields.weight} size="small" type="number" value={weight}
                                        onChange={(event) => setWeight(event.target.value)} />
                                    <TextField label={pl.shipments.form.fields.weightUnit} select size="small" value={weightUnit}
                                        onChange={(event) => setWeightUnit(event.target.value as WeightUnitDto)}>
                                        {(["G", "KG"] as const).map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
                                    </TextField>
                                    <TextField label={pl.shipments.form.fields.contentDescription} size="small" value={contentDescription}
                                        onChange={(event) => setContentDescription(event.target.value)} />
                                    <TextField label={pl.shipments.form.fields.customerReference} size="small" value={customerReference}
                                        onChange={(event) => setCustomerReference(event.target.value)} />
                                    <TextField label={pl.shipments.form.fields.declaredValue} size="small" type="number" value={declaredValueAmount}
                                        onChange={(event) => setDeclaredValueAmount(event.target.value)} />
                                    <TextField label={pl.shipments.form.fields.currency} size="small" value={declaredValueCurrency}
                                        onChange={(event) => setDeclaredValueCurrency(event.target.value.toUpperCase())} />
                                </div>
                            </section>

                            <section className="shipment-edit-section">
                                <div className="shipment-edit-section-header">
                                    <Typography variant="h6">{pl.shipments.form.sections.status}</Typography>
                                </div>
                                <TextField
                                    fullWidth
                                    label={pl.shipments.form.fields.shipmentStatus}
                                    select
                                    size="small"
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value as ShipmentStatusDto)}
                                >
                                    {shipment.shipmentStatus === "PLANNED" ? (
                                        <MenuItem disabled value="PLANNED">
                                            {pl.shipments.status.PLANNED}
                                        </MenuItem>
                                    ) : null}
                                    {shipmentChangeStatuses
                                        .filter((shipmentStatus) => shipment.shipmentStatus !== "PLANNED"
                                            || !["CREATED", "PREPARED"].includes(shipmentStatus))
                                        .map((shipmentStatus) => (
                                            <MenuItem key={shipmentStatus} value={shipmentStatus}>
                                                {pl.shipments.status[shipmentStatus]}
                                            </MenuItem>
                                        ))}
                                </TextField>
                            </section>

                            {personFields(pl.shipments.form.sections.sender, "SENDER", sender)}
                            {personFields(pl.shipments.form.sections.receiver, "RECIPIENT", recipient)}
                        </>
                    ) : (
                        <Alert severity="error">{pl.shipments.messages.loadViewError}</Alert>
                    )}
                </div>
            </div>

            <Dialog
                fullWidth
                maxWidth="md"
                onClose={savingPersonType ? undefined : closePersonDialog}
                open={Boolean(personDialogType)}
            >
                <DialogTitle>
                    {personDialogType === "SENDER"
                        ? pl.shipments.form.actions.editSender
                        : pl.shipments.form.actions.editRecipient}
                </DialogTitle>
                <DialogContent>
                    <div className="shipment-person-dialog-grid">
                        <TextField
                            label={pl.shipments.form.fields.firstName}
                            onChange={(event) => updatePersonDraftField("firstName", event)}
                            size="small"
                            value={personDraft.firstName}
                        />
                        <TextField
                            label={pl.shipments.form.fields.lastName}
                            onChange={(event) => updatePersonDraftField("lastName", event)}
                            size="small"
                            value={personDraft.lastName}
                        />
                        <TextField
                            label={pl.shipments.form.fields.email}
                            onChange={(event) => updatePersonDraftField("email", event)}
                            size="small"
                            value={personDraft.email}
                        />
                        <TextField
                            label={pl.shipments.form.fields.phone}
                            onChange={(event) => updatePersonDraftField("telephoneNumber", event)}
                            size="small"
                            value={personDraft.telephoneNumber}
                        />
                        <TextField
                            label={pl.shipments.form.fields.city}
                            onChange={(event) => updatePersonDraftField("city", event)}
                            size="small"
                            value={personDraft.city}
                        />
                        <TextField
                            label={pl.shipments.form.fields.postalCode}
                            onChange={(event) => updatePersonDraftField("postalCode", event)}
                            size="small"
                            value={personDraft.postalCode}
                        />
                        <TextField
                            className="shipment-person-dialog-wide"
                            label={pl.shipments.form.fields.street}
                            onChange={(event) => updatePersonDraftField("street", event)}
                            size="small"
                            value={personDraft.street}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={savingPersonType !== null}
                        onClick={closePersonDialog}
                        startIcon={<Close />}
                        variant="outlined"
                    >
                        {pl.common.cancel}
                    </Button>
                    <Button
                        disabled={!personDialogChanged || savingPersonType !== null}
                        onClick={savePerson}
                        startIcon={savingPersonType ? <CircularProgress color="inherit" size={16} /> : <Save />}
                        variant="contained"
                    >
                        {personDialogType === "SENDER"
                            ? pl.shipments.form.actions.saveSender
                            : pl.shipments.form.actions.saveRecipient}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentEdit;
