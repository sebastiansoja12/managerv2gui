import React, {ChangeEvent, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from "components/ui";
import {ArrowBack, LocalShipping, Map, Save} from "components/ui/icons";
import {useLocation, useNavigate} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {
    countryCodes,
    DangerousGoodApi,
    DeliveryMethodDto,
    deliveryMethods,
    PersonApi,
    PickupMethodDto,
    pickupMethods,
    ShipmentCreateInitialState,
    ShipmentCreateRequestApi,
    ShipmentPriorityDto,
    shipmentPriorities,
    shipmentSizes,
    ShipmentSizeDto,
} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";
import {PickupPointSummary} from "../PickupPoints/model/PickupPoint";
import DangerousGoodForm, {createEmptyDangerousGood, isDangerousGoodValid} from "./DangerousGoodForm";
import ShipmentDeliveryPointMapDialog from "./ShipmentDeliveryPointMapDialog";
import "./styles/shipments.css";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

type ShipmentCreateLocationState = {
    similarShipment?: ShipmentCreateInitialState;
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

const initialShipmentSize: ShipmentSizeDto = "SMALL";
const initialShipmentPriority: ShipmentPriorityDto = "MEDIUM";
const initialPriceAmount = "15";
const initialCurrency = "PLN";
const initialIssuerCountryCode = "PL";
const initialReceiverCountryCode = "PL";
const initialPickupMethod: PickupMethodDto = "DEPARTMENT";
const initialDeliveryMethod: DeliveryMethodDto = "COURIER";

const clonePerson = (person?: PersonApi): PersonApi => ({
    ...emptyPerson,
    ...(person || {}),
});

const ShipmentCreate: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const shipmentTranslations = pl.shipments;
    const similarShipment = (location.state as ShipmentCreateLocationState | null)?.similarShipment;
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [sender, setSender] = useState<PersonApi>(() => clonePerson(similarShipment?.sender));
    const [recipient, setRecipient] = useState<PersonApi>(() => clonePerson(similarShipment?.recipient));
    const [shipmentSize, setShipmentSize] = useState<ShipmentSizeDto>(similarShipment?.shipmentSize || initialShipmentSize);
    const [shipmentPriority, setShipmentPriority] = useState<ShipmentPriorityDto>(similarShipment?.shipmentPriority || initialShipmentPriority);
    const [priceAmount, setPriceAmount] = useState<string>(similarShipment?.priceAmount || initialPriceAmount);
    const [currency, setCurrency] = useState<string>(similarShipment?.currency || initialCurrency);
    const [issuerCountryCode, setIssuerCountryCode] = useState<string>(similarShipment?.issuerCountryCode || initialIssuerCountryCode);
    const [receiverCountryCode, setReceiverCountryCode] = useState<string>(similarShipment?.receiverCountryCode || initialReceiverCountryCode);
    const [pickupMethod, setPickupMethod] = useState<PickupMethodDto>(similarShipment?.pickupMethod || initialPickupMethod);
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodDto>(similarShipment?.deliveryMethod || initialDeliveryMethod);
    const [deliveryMapOpen, setDeliveryMapOpen] = useState(false);
    const [deliveryPickupPoint, setDeliveryPickupPoint] = useState<PickupPointSummary | null>(null);
    const [pickupPointId, setPickupPointId] = useState<string>(similarShipment?.pickupPointId || "");
    const [dangerousEnabled, setDangerousEnabled] = useState<boolean>(Boolean(similarShipment?.dangerousGood));
    const [dangerousGood, setDangerousGood] = useState<DangerousGoodApi>(() => (
        similarShipment?.dangerousGood
            ? {...similarShipment.dangerousGood}
            : createEmptyDangerousGood()
    ));

    const textField = (
        label: string,
        value: string,
        onChange: (value: string) => void,
        type: "text" | "number" | "email" = "text",
    ) => (
        <TextField
            fullWidth
            label={label}
            size="small"
            type={type}
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        />
    );

    const selectField = <T extends string,>(
        label: string,
        value: T,
        values: readonly T[],
        onChange: (value: T) => void,
        optionLabel: (value: T) => string = (option) => option,
    ) => (
        <TextField
            fullWidth
            select
            label={label}
            size="small"
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value as T)}
        >
            {values.map((option) => (
                <MenuItem key={option} value={option}>{optionLabel(option)}</MenuItem>
            ))}
        </TextField>
    );

    const handlePersonChange = (
        person: PersonApi,
        setPerson: React.Dispatch<React.SetStateAction<PersonApi>>,
        field: keyof PersonApi,
        value: string,
    ) => {
        setPerson({
            ...person,
            [field]: value,
        });
    };

    const personFields = (
        title: string,
        person: PersonApi,
        setPerson: React.Dispatch<React.SetStateAction<PersonApi>>,
        tone: "sender" | "receiver",
    ) => (
        <div className={`shipments-section shipments-create-section shipments-create-section-${tone}`}>
            <div className="shipments-section-title">{title}</div>
            <div className="shipments-form-grid">
                {textField(shipmentTranslations.form.fields.firstName, person.firstName, (value) => handlePersonChange(person, setPerson, "firstName", value))}
                {textField(shipmentTranslations.form.fields.lastName, person.lastName, (value) => handlePersonChange(person, setPerson, "lastName", value))}
                {textField(shipmentTranslations.form.fields.email, person.email, (value) => handlePersonChange(person, setPerson, "email", value), "email")}
                {textField(shipmentTranslations.form.fields.phone, person.telephoneNumber, (value) => handlePersonChange(person, setPerson, "telephoneNumber", value))}
                {textField(shipmentTranslations.form.fields.city, person.city, (value) => handlePersonChange(person, setPerson, "city", value))}
                {textField(shipmentTranslations.form.fields.postalCode, person.postalCode, (value) => handlePersonChange(person, setPerson, "postalCode", value))}
                {textField(shipmentTranslations.form.fields.street, person.street, (value) => handlePersonChange(person, setPerson, "street", value))}
            </div>
        </div>
    );

    const createRequest = (): ShipmentCreateRequestApi => ({
        sender,
        recipient,
        shipmentSize,
        price: {
            amount: Number(priceAmount) || 0,
            currency,
        },
        ...(dangerousEnabled ? {dangerousGood} : {}),
        shipmentPriority,
        issuerCountryCode,
        receiverCountryCode,
        pickupMethod,
        deliveryMethod,
        ...(["PICKUP_POINT", "LOCKER"].includes(pickupMethod) && pickupPointId.trim()
            ? {pickupPointId: {value: pickupPointId.trim()}}
            : {}),
        ...(deliveryMethod !== "COURIER" && deliveryPickupPoint
            ? {deliveryPickupPointId: deliveryPickupPoint.pickupPointId}
            : {}),
    });

    const resetForm = () => {
        setSender({...emptyPerson});
        setRecipient({...emptyPerson});
        setShipmentSize(initialShipmentSize);
        setShipmentPriority(initialShipmentPriority);
        setPriceAmount(initialPriceAmount);
        setCurrency(initialCurrency);
        setIssuerCountryCode(initialIssuerCountryCode);
        setReceiverCountryCode(initialReceiverCountryCode);
        setPickupMethod(initialPickupMethod);
        setDeliveryMethod(initialDeliveryMethod);
        setDeliveryMapOpen(false);
        setDeliveryPickupPoint(null);
        setPickupPointId("");
        setDangerousEnabled(false);
        setDangerousGood(createEmptyDangerousGood());
    };

    const showError = (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        const message = apiError.message || (error as Error).message || shipmentTranslations.messages.createError;
        setNotice({severity: "error", message});
    };

    const createShipment = async () => {
        if (deliveryMethod !== "COURIER" && !deliveryPickupPoint) {
            setNotice({severity: "error", message: shipmentTranslations.messages.deliveryPickupPointRequired});
            return;
        }
        if (dangerousEnabled && !isDangerousGoodValid(dangerousGood)) {
            setNotice({severity: "error", message: shipmentTranslations.dangerousGood.invalid});
            return;
        }
        setLoading(true);
        try {
            const response = await ShipmentService.create(createRequest());
            setNotice({
                severity: "success",
                message: shipmentTranslations.messages.createSuccess
                    .replace("{shipmentId}", String(response.data.shipmentId))
                    .replace("{trackingNumber}", String(response.data.trackingNumber)),
            });
            resetForm();
            navigate(`/shipments/tracking/${encodeURIComponent(response.data.trackingNumber)}/edit`);
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="shipments-page shipments-create-page">
            <div className="shipments-shell shipments-create-shell">
                <div className="shipments-header">
                    <div className="shipments-title">
                        <span className="shipments-title-icon"><LocalShipping /></span>
                        <Box className="shipments-create-heading-copy">
                            <span className="shipments-create-kicker">{pl.common.brand}</span>
                            <Typography variant="h4">{shipmentTranslations.page.createTitle}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {shipmentTranslations.page.createSubtitle}
                            </Typography>
                        </Box>
                    </div>
                    <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate("/shipments/list")}>
                        {pl.navigation.shipmentList}
                    </Button>
                </div>

                <div className="shipments-panel shipments-create-panel">
                    <div className="shipments-panel-title">
                        <Save fontSize="small" />
                        <Typography variant="h6">{shipmentTranslations.form.sections.shipmentData}</Typography>
                    </div>

                    <div className="shipments-form-grid-three shipments-create-data-grid">
                        {selectField(shipmentTranslations.form.fields.size, shipmentSize, shipmentSizes, (value) => {
                            setShipmentSize(value);
                            setDeliveryPickupPoint(null);
                        }, (option) => shipmentTranslations.size[option])}
                        {selectField(shipmentTranslations.form.fields.priority, shipmentPriority, shipmentPriorities, setShipmentPriority, (option) => shipmentTranslations.priority[option])}
                        {textField(shipmentTranslations.form.fields.amount, priceAmount, setPriceAmount, "number")}
                        {textField(shipmentTranslations.form.fields.currency, currency, setCurrency)}
                        {selectField(shipmentTranslations.form.fields.issuerCountry, issuerCountryCode, countryCodes, setIssuerCountryCode)}
                        {selectField(shipmentTranslations.form.fields.receiverCountry, receiverCountryCode, countryCodes, (value) => {
                            setReceiverCountryCode(value);
                            setDeliveryPickupPoint(null);
                        })}
                        {selectField(shipmentTranslations.form.fields.pickupMethod, pickupMethod, pickupMethods, setPickupMethod, (option) => shipmentTranslations.pickupMethod[option])}
                        <div className="shipment-delivery-method-field">
                            {selectField(shipmentTranslations.form.fields.deliveryMethod, deliveryMethod, deliveryMethods, (value) => {
                                setDeliveryMethod(value);
                                setDeliveryMapOpen(false);
                                setDeliveryPickupPoint(null);
                            }, (option) => shipmentTranslations.deliveryMethod[option])}
                            {deliveryMethod !== "COURIER" && (
                                <Button variant="outlined" startIcon={<Map />} onClick={() => setDeliveryMapOpen(true)}>
                                    {shipmentTranslations.deliveryPointMap.open}
                                </Button>
                            )}
                        </div>
                        {deliveryMethod !== "COURIER" && deliveryPickupPoint ? (
                            <div className="shipment-delivery-point-selection">
                                <span>{shipmentTranslations.deliveryPointMap.selected}</span>
                                <strong>{deliveryPickupPoint.code} · {deliveryPickupPoint.name}</strong>
                                <small>{deliveryPickupPoint.address
                                    ? `${deliveryPickupPoint.address.street} ${deliveryPickupPoint.address.buildingNumber}, ${deliveryPickupPoint.address.city}`
                                    : pl.common.dash}</small>
                                <Button onClick={() => setDeliveryPickupPoint(null)} variant="text">
                                    {shipmentTranslations.deliveryPointMap.removeSelection}
                                </Button>
                            </div>
                        ) : null}
                        {["PICKUP_POINT", "LOCKER"].includes(pickupMethod)
                            ? textField(shipmentTranslations.form.fields.pickupPoint, pickupPointId, setPickupPointId)
                            : null}
                    </div>

                    {personFields(shipmentTranslations.form.sections.sender, sender, setSender, "sender")}
                    {personFields(shipmentTranslations.form.sections.receiver, recipient, setRecipient, "receiver")}

                    <div className="shipments-section shipments-create-section shipments-create-section-dangerous">
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                            <div className="shipments-section-title">{shipmentTranslations.form.sections.dangerousGood}</div>
                            <FormControlLabel
                                control={<Checkbox checked={dangerousEnabled} onChange={(event) => {
                                    setDangerousEnabled(event.target.checked);
                                    setDeliveryPickupPoint(null);
                                    if (!event.target.checked) {
                                        setDangerousGood(createEmptyDangerousGood());
                                    }
                                }} />}
                                label={shipmentTranslations.form.fields.containsDangerousGoods}
                            />
                        </Stack>
                        {dangerousEnabled ? (
                            <DangerousGoodForm value={dangerousGood} onChange={setDangerousGood} />
                        ) : null}
                    </div>

                    <div className="shipments-actions">
                        <Button disabled={loading} variant="contained" startIcon={<Save />} onClick={createShipment}>
                            {shipmentTranslations.actions.create}
                        </Button>
                    </div>
                </div>
            </div>

            {deliveryMapOpen && deliveryMethod !== "COURIER" && (
                <ShipmentDeliveryPointMapDialog
                    deliveryMethod={deliveryMethod}
                    hasDangerousGoods={dangerousEnabled}
                    onClose={() => setDeliveryMapOpen(false)}
                    onSelect={(point) => {
                        setDeliveryPickupPoint(point);
                        setDeliveryMapOpen(false);
                    }}
                    receiverCountryCode={receiverCountryCode}
                    selectedPointId={deliveryPickupPoint?.pickupPointId.value || null}
                    shipmentSize={shipmentSize}
                />
            )}

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentCreate;
