import React, {ChangeEvent, useState} from "react";
import {
    Alert,
    Box,
    Button,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "components/ui";
import {ArrowBack, LocalShipping, Map, Save} from "components/ui/icons";
import {useLocation, useNavigate} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {
    CountryCodeDto,
    DeliveryMethodDto,
    deliveryMethods,
    PackagingTypeDto,
    PersonApi,
    PickupMethodDto,
    pickupMethods,
    ShipmentCreateInitialState,
    ShipmentCreateRequestApi,
    ShipmentPriorityDto,
    ShipmentServiceLevelDto,
    shipmentPriorities,
    ShipmentSizeDto,
    LengthUnitDto,
    WeightUnitDto,
} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";
import {PickupPointSummary} from "../PickupPoints/model/PickupPoint";
import ShipmentDeliveryPointMapDialog from "./ShipmentDeliveryPointMapDialog";
import ShipmentPostalCodeField from "./ShipmentPostalCodeField";
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

const initialShipmentPriority: ShipmentPriorityDto = "MEDIUM";
const initialPriceAmount = "15";
const initialCurrency = "PLN";
const initialPickupMethod: PickupMethodDto = "DEPARTMENT";
const initialDeliveryMethod: DeliveryMethodDto = "COURIER";
const lengthUnits: LengthUnitDto[] = ["MM", "CM", "M"];
const weightUnits: WeightUnitDto[] = ["G", "KG"];
const packagingTypes: Array<PackagingTypeDto | ""> = ["", "ENVELOPE", "BAG", "BOX", "TUBE", "CRATE", "OTHER"];
const serviceLevels: Array<ShipmentServiceLevelDto | ""> = ["", "ECONOMY", "STANDARD", "EXPRESS"];

const legacySizeForPickupPointSearch = (
    length: string,
    width: string,
    height: string,
    lengthUnit: LengthUnitDto,
    weight: string,
    weightUnit: WeightUnitDto,
): ShipmentSizeDto => {
    const lengthValue = Number(length);
    const widthValue = Number(width);
    const heightValue = Number(height);
    const weightValue = Number(weight);
    if (![lengthValue, widthValue, heightValue, weightValue].every(Number.isFinite)) {
        return "SMALL";
    }
    const unitScale = lengthUnit === "MM" ? 0.1 : lengthUnit === "M" ? 100 : 1;
    const maximumDimensionCm = Math.max(lengthValue, widthValue, heightValue) * unitScale;
    const weightKg = weightUnit === "G" ? weightValue / 1000 : weightValue;
    const capacities: Array<[ShipmentSizeDto, number, number]> = [
        ["SMALL", 20, 20], ["TINY", 40, 40], ["MEDIUM", 60, 60],
        ["AVERAGE", 80, 80], ["BIG", 100, 100],
    ];
    return capacities.find(([, maxDimensionCm, maxWeightKg]) => (
        maximumDimensionCm <= maxDimensionCm && weightKg <= maxWeightKg
    ))?.[0] || "CUSTOM";
};

const clonePerson = (person?: PersonApi): PersonApi => ({
    ...emptyPerson,
    ...(person || {}),
});

const withoutCountryCode = ({countryCode, ...person}: PersonApi): PersonApi => person;

const ShipmentCreate: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const shipmentTranslations = pl.shipments;
    const similarShipment = (location.state as ShipmentCreateLocationState | null)?.similarShipment;
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [sender, setSender] = useState<PersonApi>(() => clonePerson(similarShipment?.sender));
    const [recipient, setRecipient] = useState<PersonApi>(() => clonePerson(similarShipment?.recipient));
    const [length, setLength] = useState<string>(similarShipment?.dimensions?.length?.toString() || "");
    const [width, setWidth] = useState<string>(similarShipment?.dimensions?.width?.toString() || "");
    const [height, setHeight] = useState<string>(similarShipment?.dimensions?.height?.toString() || "");
    const [lengthUnit, setLengthUnit] = useState<LengthUnitDto>(similarShipment?.dimensions?.unit || "CM");
    const [weight, setWeight] = useState<string>(similarShipment?.weight?.value?.toString() || "");
    const [weightUnit, setWeightUnit] = useState<WeightUnitDto>(similarShipment?.weight?.unit || "KG");
    const [contentDescription, setContentDescription] = useState<string>(similarShipment?.contentDescription || "");
    const [customerReference, setCustomerReference] = useState<string>(similarShipment?.customerReference || "");
    const [declaredValueAmount, setDeclaredValueAmount] = useState<string>(
        similarShipment?.declaredValue?.amount?.toString() || "",
    );
    const [declaredValueCurrency, setDeclaredValueCurrency] = useState<string>(
        similarShipment?.declaredValue?.currency || similarShipment?.currency || initialCurrency,
    );
    const [shipmentPriority, setShipmentPriority] = useState<ShipmentPriorityDto>(similarShipment?.shipmentPriority || initialShipmentPriority);
    const [packagingType, setPackagingType] = useState<PackagingTypeDto | "">(similarShipment?.packagingType || "");
    const [serviceLevel, setServiceLevel] = useState<ShipmentServiceLevelDto | "">(similarShipment?.serviceLevel || "");
    const [priceAmount, setPriceAmount] = useState<string>(similarShipment?.priceAmount || initialPriceAmount);
    const [currency, setCurrency] = useState<string>(similarShipment?.currency || initialCurrency);
    const [pickupMethod, setPickupMethod] = useState<PickupMethodDto>(similarShipment?.pickupMethod || initialPickupMethod);
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodDto>(similarShipment?.deliveryMethod || initialDeliveryMethod);
    const [deliveryMapOpen, setDeliveryMapOpen] = useState(false);
    const [deliveryPickupPoint, setDeliveryPickupPoint] = useState<PickupPointSummary | null>(null);
    const [deliveryPickupPointId, setDeliveryPickupPointId] = useState<string>(
        similarShipment?.deliveryPickupPointId?.value || "",
    );
    const [pickupPointId, setPickupPointId] = useState<string>(similarShipment?.pickupPointId || "");

    const clearDeliveryPickupPoint = () => {
        setDeliveryPickupPoint(null);
        setDeliveryPickupPointId("");
    };

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
                <ShipmentPostalCodeField
                    id={`shipment-create-${tone}-postal-code`}
                    label={shipmentTranslations.form.fields.postalCode}
                    value={person.postalCode}
                    onChange={(value) => handlePersonChange(person, setPerson, "postalCode", value)}
                    onSelect={(postalCode) => {
                        setPerson({
                            ...person,
                            postalCode: postalCode.postalCode,
                            city: postalCode.city,
                            countryCode: postalCode.countryCode as CountryCodeDto,
                        });
                        if (tone === "receiver") {
                            clearDeliveryPickupPoint();
                        }
                    }}
                />
                {textField(shipmentTranslations.form.fields.street, person.street, (value) => handlePersonChange(person, setPerson, "street", value))}
            </div>
        </div>
    );

    const createRequest = (): ShipmentCreateRequestApi => ({
        sender: withoutCountryCode(sender),
        recipient: withoutCountryCode(recipient),
        dimensions: {
            length: Number(length),
            width: Number(width),
            height: Number(height),
            unit: lengthUnit,
        },
        weight: {
            value: Number(weight),
            unit: weightUnit,
        },
        ...(customerReference.trim() ? {customerReference: customerReference.trim()} : {}),
        ...(contentDescription.trim() ? {contentDescription: contentDescription.trim()} : {}),
        ...(declaredValueAmount.trim() ? {
            declaredValue: {amount: Number(declaredValueAmount), currency: declaredValueCurrency},
        } : {}),
        price: {
            amount: Number(priceAmount) || 0,
            currency,
        },
        shipmentPriority,
        ...(packagingType ? {packagingType} : {}),
        ...(serviceLevel ? {serviceLevel} : {}),
        pickupMethod,
        deliveryMethod,
        ...(["PICKUP_POINT", "LOCKER"].includes(pickupMethod) && pickupPointId.trim()
            ? {pickupPointId: {value: pickupPointId.trim()}}
            : {}),
        ...(deliveryMethod !== "COURIER" && deliveryPickupPointId
            ? {deliveryPickupPointId: {value: deliveryPickupPointId}}
            : {}),
    });

    const resetForm = () => {
        setSender({...emptyPerson});
        setRecipient({...emptyPerson});
        setLength("");
        setWidth("");
        setHeight("");
        setLengthUnit("CM");
        setWeight("");
        setWeightUnit("KG");
        setContentDescription("");
        setCustomerReference("");
        setDeclaredValueAmount("");
        setDeclaredValueCurrency(initialCurrency);
        setShipmentPriority(initialShipmentPriority);
        setPackagingType("");
        setServiceLevel("");
        setPriceAmount(initialPriceAmount);
        setCurrency(initialCurrency);
        setPickupMethod(initialPickupMethod);
        setDeliveryMethod(initialDeliveryMethod);
        setDeliveryMapOpen(false);
        setDeliveryPickupPoint(null);
        setDeliveryPickupPointId("");
        setPickupPointId("");
    };

    const showError = (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        const message = apiError.message || (error as Error).message || shipmentTranslations.messages.createError;
        setNotice({severity: "error", message});
    };

    const createShipment = async () => {
        const dimensionsAndWeight = [length, width, height, weight].map(Number);
        if (!dimensionsAndWeight.every((value) => Number.isFinite(value) && value > 0)) {
            setNotice({severity: "error", message: shipmentTranslations.messages.measurementsRequired});
            return;
        }
        if (declaredValueAmount.trim()
            && (!Number.isFinite(Number(declaredValueAmount)) || Number(declaredValueAmount) < 0)) {
            setNotice({severity: "error", message: shipmentTranslations.messages.declaredValueInvalid});
            return;
        }
        if (deliveryMethod !== "COURIER" && !deliveryPickupPointId) {
            setNotice({severity: "error", message: shipmentTranslations.messages.deliveryPickupPointRequired});
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

    const openDeliveryPointMap = () => {
        const values = [length, width, height, weight].map(Number);
        if (!values.every((value) => Number.isFinite(value) && value > 0)) {
            setNotice({severity: "error", message: shipmentTranslations.messages.measurementsRequired});
            return;
        }
        setDeliveryMapOpen(true);
    };

    const deliveryPointSearchSize = legacySizeForPickupPointSearch(
        length, width, height, lengthUnit, weight, weightUnit,
    );

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
                        {textField(shipmentTranslations.form.fields.length, length, (value) => {
                            setLength(value);
                            clearDeliveryPickupPoint();
                        }, "number")}
                        {textField(shipmentTranslations.form.fields.width, width, (value) => {
                            setWidth(value);
                            clearDeliveryPickupPoint();
                        }, "number")}
                        {textField(shipmentTranslations.form.fields.height, height, (value) => {
                            setHeight(value);
                            clearDeliveryPickupPoint();
                        }, "number")}
                        {selectField(shipmentTranslations.form.fields.lengthUnit, lengthUnit, lengthUnits, (value) => {
                            setLengthUnit(value);
                            clearDeliveryPickupPoint();
                        })}
                        {textField(shipmentTranslations.form.fields.weight, weight, (value) => {
                            setWeight(value);
                            clearDeliveryPickupPoint();
                        }, "number")}
                        {selectField(shipmentTranslations.form.fields.weightUnit, weightUnit, weightUnits, (value) => {
                            setWeightUnit(value);
                            clearDeliveryPickupPoint();
                        })}
                        {textField(shipmentTranslations.form.fields.contentDescription, contentDescription, setContentDescription)}
                        {textField(shipmentTranslations.form.fields.customerReference, customerReference, setCustomerReference)}
                        {textField(shipmentTranslations.form.fields.declaredValue, declaredValueAmount, setDeclaredValueAmount, "number")}
                        {textField(shipmentTranslations.form.fields.declaredValueCurrency, declaredValueCurrency, setDeclaredValueCurrency)}
                        {selectField(shipmentTranslations.form.fields.priority, shipmentPriority, shipmentPriorities, setShipmentPriority, (option) => shipmentTranslations.priority[option])}
                        {selectField(shipmentTranslations.form.fields.packagingType, packagingType, packagingTypes,
                            setPackagingType, (option) => option ? shipmentTranslations.packagingType[option] : pl.common.dash)}
                        {selectField(shipmentTranslations.form.fields.serviceLevel, serviceLevel, serviceLevels,
                            setServiceLevel, (option) => option ? shipmentTranslations.serviceLevel[option] : pl.common.dash)}
                        {textField(shipmentTranslations.form.fields.amount, priceAmount, setPriceAmount, "number")}
                        {textField(shipmentTranslations.form.fields.currency, currency, setCurrency)}
                        {selectField(shipmentTranslations.form.fields.pickupMethod, pickupMethod, pickupMethods, setPickupMethod, (option) => shipmentTranslations.pickupMethod[option])}
                        <div className="shipment-delivery-method-field">
                            {selectField(shipmentTranslations.form.fields.deliveryMethod, deliveryMethod, deliveryMethods, (value) => {
                                setDeliveryMethod(value);
                                setDeliveryMapOpen(false);
                                clearDeliveryPickupPoint();
                            }, (option) => shipmentTranslations.deliveryMethod[option])}
                            {deliveryMethod !== "COURIER" && (
                                <Button variant="outlined" startIcon={<Map />} onClick={openDeliveryPointMap}>
                                    {shipmentTranslations.deliveryPointMap.open}
                                </Button>
                            )}
                        </div>
                        {deliveryMethod !== "COURIER" && deliveryPickupPointId ? (
                            <div className="shipment-delivery-point-selection">
                                <span>{shipmentTranslations.deliveryPointMap.selected}</span>
                                <strong>{deliveryPickupPoint
                                    ? `${deliveryPickupPoint.code} · ${deliveryPickupPoint.name}`
                                    : similarShipment?.deliveryPickupPointCode || deliveryPickupPointId}</strong>
                                {deliveryPickupPoint?.address ? <small>
                                    {`${deliveryPickupPoint.address.street} ${deliveryPickupPoint.address.buildingNumber}, ${deliveryPickupPoint.address.city}`}
                                </small> : null}
                                <Button onClick={clearDeliveryPickupPoint} variant="text">
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
                    onClose={() => setDeliveryMapOpen(false)}
                    onSelect={(point) => {
                        setDeliveryPickupPoint(point);
                        setDeliveryPickupPointId(point.pickupPointId.value);
                        setDeliveryMapOpen(false);
                    }}
                    receiverCountryCode={recipient.countryCode || "PL"}
                    selectedPointId={deliveryPickupPointId || null}
                    shipmentSize={deliveryPointSearchSize}
                />
            )}

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentCreate;
