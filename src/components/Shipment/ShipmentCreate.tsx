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
} from "@mui/material";
import {ArrowBack, LocalShipping, Save} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {
    countryCodes,
    DangerousGoodApi,
    PersonApi,
    ShipmentCreateRequestApi,
    ShipmentPriorityDto,
    shipmentPriorities,
    shipmentSizes,
    ShipmentSizeDto,
} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";
import "./styles/shipments.css";

type Notice = {
    severity: "success" | "error" | "info";
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

const emptyDangerousGood: DangerousGoodApi = {
    name: "",
    description: "",
    classificationCode: "",
    hazardSymbols: [],
    storageRequirements: "",
    handlingInstructions: "",
    weight: {
        value: 0,
        unit: "KG",
    },
    packaging: "",
    flammable: false,
    corosive: false,
    toxic: false,
    emergencyContact: "",
    countryOfOrigin: "PL",
    safetyDataSheet: "",
};

const ShipmentCreate: React.FC = () => {
    const navigate = useNavigate();
    const shipmentTranslations = pl.shipments;
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [sender, setSender] = useState<PersonApi>({...emptyPerson});
    const [recipient, setRecipient] = useState<PersonApi>({...emptyPerson});
    const [shipmentSize, setShipmentSize] = useState<ShipmentSizeDto>("SMALL");
    const [shipmentPriority, setShipmentPriority] = useState<ShipmentPriorityDto>("MEDIUM");
    const [priceAmount, setPriceAmount] = useState<string>("15");
    const [currency, setCurrency] = useState<string>("PLN");
    const [issuerCountryCode, setIssuerCountryCode] = useState<string>("PL");
    const [receiverCountryCode, setReceiverCountryCode] = useState<string>("DE");
    const [carrierOperator, setCarrierOperator] = useState<string>("");
    const [dangerousEnabled, setDangerousEnabled] = useState<boolean>(false);
    const [dangerousGood, setDangerousGood] = useState<DangerousGoodApi>({...emptyDangerousGood});

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
    ) => (
        <div className="shipments-section">
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
        dangerousGood: dangerousEnabled ? dangerousGood : null,
        shipmentPriority,
        issuerCountryCode,
        receiverCountryCode,
        carrierOperator,
    });

    const showError = (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        const message = apiError.message || (error as Error).message || shipmentTranslations.messages.createError;
        setNotice({severity: "error", message});
    };

    const createShipment = async () => {
        setLoading(true);
        try {
            const response = await ShipmentService.create(createRequest());
            setNotice({
                severity: "success",
                message: shipmentTranslations.messages.createSuccess
                    .replace("{shipmentId}", String(response.data.shipmentId))
                    .replace("{trackingNumber}", String(response.data.trackingNumber)),
            });
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="shipments-page">
            <div className="shipments-shell">
                <div className="shipments-header">
                    <div className="shipments-title">
                        <span className="shipments-title-icon"><LocalShipping /></span>
                        <Box>
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

                    <div className="shipments-form-grid-three">
                        {selectField(shipmentTranslations.form.fields.size, shipmentSize, shipmentSizes, setShipmentSize, (option) => shipmentTranslations.size[option])}
                        {selectField(shipmentTranslations.form.fields.priority, shipmentPriority, shipmentPriorities, setShipmentPriority, (option) => shipmentTranslations.priority[option])}
                        {textField(shipmentTranslations.form.fields.operator, carrierOperator, setCarrierOperator)}
                        {textField(shipmentTranslations.form.fields.amount, priceAmount, setPriceAmount, "number")}
                        {textField(shipmentTranslations.form.fields.currency, currency, setCurrency)}
                        {selectField(shipmentTranslations.form.fields.issuerCountry, issuerCountryCode, countryCodes, setIssuerCountryCode)}
                        {selectField(shipmentTranslations.form.fields.receiverCountry, receiverCountryCode, countryCodes, setReceiverCountryCode)}
                    </div>

                    {personFields(shipmentTranslations.form.sections.sender, sender, setSender)}
                    {personFields(shipmentTranslations.form.sections.receiver, recipient, setRecipient)}

                    <div className="shipments-section">
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                            <div className="shipments-section-title">{shipmentTranslations.form.sections.dangerousGood}</div>
                            <FormControlLabel
                                control={<Checkbox checked={dangerousEnabled} onChange={(event) => setDangerousEnabled(event.target.checked)} />}
                                label={shipmentTranslations.form.fields.active}
                            />
                        </Stack>
                        {dangerousEnabled ? (
                            <div className="shipments-form-grid">
                                {textField(shipmentTranslations.form.fields.name, dangerousGood.name, (value) => setDangerousGood({...dangerousGood, name: value}))}
                                {textField(shipmentTranslations.form.fields.description, dangerousGood.description, (value) => setDangerousGood({...dangerousGood, description: value}))}
                                {textField(shipmentTranslations.form.fields.classification, dangerousGood.classificationCode, (value) => setDangerousGood({...dangerousGood, classificationCode: value}))}
                                {textField(shipmentTranslations.form.fields.hazardSymbols, dangerousGood.hazardSymbols.join(","), (value) => setDangerousGood({...dangerousGood, hazardSymbols: value.split(",").map((item) => item.trim()).filter(Boolean)}))}
                                {textField(shipmentTranslations.form.fields.storageRequirements, dangerousGood.storageRequirements, (value) => setDangerousGood({...dangerousGood, storageRequirements: value}))}
                                {textField(shipmentTranslations.form.fields.handlingInstructions, dangerousGood.handlingInstructions, (value) => setDangerousGood({...dangerousGood, handlingInstructions: value}))}
                                {textField(shipmentTranslations.form.fields.weight, dangerousGood.weight.value.toString(), (value) => setDangerousGood({...dangerousGood, weight: {...dangerousGood.weight, value: Number(value) || 0}}), "number")}
                                {textField(shipmentTranslations.form.fields.unit, dangerousGood.weight.unit, (value) => setDangerousGood({...dangerousGood, weight: {...dangerousGood.weight, unit: value}}))}
                                {textField(shipmentTranslations.form.fields.packaging, dangerousGood.packaging, (value) => setDangerousGood({...dangerousGood, packaging: value}))}
                                {textField(shipmentTranslations.form.fields.emergencyContact, dangerousGood.emergencyContact, (value) => setDangerousGood({...dangerousGood, emergencyContact: value}))}
                                {selectField(shipmentTranslations.form.fields.countryOfOrigin, dangerousGood.countryOfOrigin, countryCodes, (value) => setDangerousGood({...dangerousGood, countryOfOrigin: value}))}
                                {textField(shipmentTranslations.form.fields.safetyDataSheet, dangerousGood.safetyDataSheet, (value) => setDangerousGood({...dangerousGood, safetyDataSheet: value}))}
                                <FormControlLabel control={<Checkbox checked={dangerousGood.flammable} onChange={(event) => setDangerousGood({...dangerousGood, flammable: event.target.checked})} />} label={shipmentTranslations.form.fields.flammable} />
                                <FormControlLabel control={<Checkbox checked={dangerousGood.corosive} onChange={(event) => setDangerousGood({...dangerousGood, corosive: event.target.checked})} />} label={shipmentTranslations.form.fields.corrosive} />
                                <FormControlLabel control={<Checkbox checked={dangerousGood.toxic} onChange={(event) => setDangerousGood({...dangerousGood, toxic: event.target.checked})} />} label={shipmentTranslations.form.fields.toxic} />
                            </div>
                        ) : null}
                    </div>

                    <div className="shipments-actions">
                        <Button disabled={loading} variant="contained" startIcon={<Save />} onClick={createShipment}>
                            {shipmentTranslations.actions.create}
                        </Button>
                    </div>
                </div>
            </div>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
};

export default ShipmentCreate;
