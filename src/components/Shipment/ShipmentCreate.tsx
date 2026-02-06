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
                <MenuItem key={option} value={option}>{option}</MenuItem>
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
                {textField("Imię", person.firstName, (value) => handlePersonChange(person, setPerson, "firstName", value))}
                {textField("Nazwisko", person.lastName, (value) => handlePersonChange(person, setPerson, "lastName", value))}
                {textField("Email", person.email, (value) => handlePersonChange(person, setPerson, "email", value), "email")}
                {textField("Telefon", person.telephoneNumber, (value) => handlePersonChange(person, setPerson, "telephoneNumber", value))}
                {textField("Miasto", person.city, (value) => handlePersonChange(person, setPerson, "city", value))}
                {textField("Kod pocztowy", person.postalCode, (value) => handlePersonChange(person, setPerson, "postalCode", value))}
                {textField("Ulica", person.street, (value) => handlePersonChange(person, setPerson, "street", value))}
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
        const message = apiError.message || (error as Error).message || "Nie udało się utworzyć przesyłki";
        setNotice({severity: "error", message});
    };

    const createShipment = async () => {
        setLoading(true);
        try {
            const response = await ShipmentService.create(createRequest(),
                "");
            setNotice({
                severity: "success",
                message: `Utworzono przesyłkę ${response.data.shipmentId}, tracking ${response.data.trackingNumber}`,
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
                            <Typography variant="h4">Utwórz przesyłkę</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Formularz tworzenia nowej przesyłki
                            </Typography>
                        </Box>
                    </div>
                    <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate("/shipments/list")}>
                        Lista przesyłek
                    </Button>
                </div>

                <div className="shipments-panel shipments-create-panel">
                    <div className="shipments-panel-title">
                        <Save fontSize="small" />
                        <Typography variant="h6">Dane przesyłki</Typography>
                    </div>

                    <div className="shipments-form-grid-three">
                        {selectField("Rozmiar", shipmentSize, shipmentSizes, setShipmentSize)}
                        {selectField("Priorytet", shipmentPriority, shipmentPriorities, setShipmentPriority)}
                        {textField("Operator", carrierOperator, setCarrierOperator)}
                        {textField("Kwota", priceAmount, setPriceAmount, "number")}
                        {textField("Waluta", currency, setCurrency)}
                        {selectField("Kraj nadania", issuerCountryCode, countryCodes, setIssuerCountryCode)}
                        {selectField("Kraj odbioru", receiverCountryCode, countryCodes, setReceiverCountryCode)}
                    </div>

                    {personFields("Nadawca", sender, setSender)}
                    {personFields("Odbiorca", recipient, setRecipient)}

                    <div className="shipments-section">
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                            <div className="shipments-section-title">Towar niebezpieczny</div>
                            <FormControlLabel
                                control={<Checkbox checked={dangerousEnabled} onChange={(event) => setDangerousEnabled(event.target.checked)} />}
                                label="Aktywny"
                            />
                        </Stack>
                        {dangerousEnabled ? (
                            <div className="shipments-form-grid">
                                {textField("Nazwa", dangerousGood.name, (value) => setDangerousGood({...dangerousGood, name: value}))}
                                {textField("Opis", dangerousGood.description, (value) => setDangerousGood({...dangerousGood, description: value}))}
                                {textField("Klasyfikacja", dangerousGood.classificationCode, (value) => setDangerousGood({...dangerousGood, classificationCode: value}))}
                                {textField("Symbole zagrożeń", dangerousGood.hazardSymbols.join(","), (value) => setDangerousGood({...dangerousGood, hazardSymbols: value.split(",").map((item) => item.trim()).filter(Boolean)}))}
                                {textField("Magazynowanie", dangerousGood.storageRequirements, (value) => setDangerousGood({...dangerousGood, storageRequirements: value}))}
                                {textField("Instrukcje obsługi", dangerousGood.handlingInstructions, (value) => setDangerousGood({...dangerousGood, handlingInstructions: value}))}
                                {textField("Waga", dangerousGood.weight.value.toString(), (value) => setDangerousGood({...dangerousGood, weight: {...dangerousGood.weight, value: Number(value) || 0}}), "number")}
                                {textField("Jednostka", dangerousGood.weight.unit, (value) => setDangerousGood({...dangerousGood, weight: {...dangerousGood.weight, unit: value}}))}
                                {textField("Opakowanie", dangerousGood.packaging, (value) => setDangerousGood({...dangerousGood, packaging: value}))}
                                {textField("Kontakt alarmowy", dangerousGood.emergencyContact, (value) => setDangerousGood({...dangerousGood, emergencyContact: value}))}
                                {selectField("Kraj pochodzenia", dangerousGood.countryOfOrigin, countryCodes, (value) => setDangerousGood({...dangerousGood, countryOfOrigin: value}))}
                                {textField("Karta charakterystyki", dangerousGood.safetyDataSheet, (value) => setDangerousGood({...dangerousGood, safetyDataSheet: value}))}
                                <FormControlLabel control={<Checkbox checked={dangerousGood.flammable} onChange={(event) => setDangerousGood({...dangerousGood, flammable: event.target.checked})} />} label="Łatwopalny" />
                                <FormControlLabel control={<Checkbox checked={dangerousGood.corosive} onChange={(event) => setDangerousGood({...dangerousGood, corosive: event.target.checked})} />} label="Żrący" />
                                <FormControlLabel control={<Checkbox checked={dangerousGood.toxic} onChange={(event) => setDangerousGood({...dangerousGood, toxic: event.target.checked})} />} label="Toksyczny" />
                            </div>
                        ) : null}
                    </div>

                    <div className="shipments-actions">
                        <Button disabled={loading} variant="contained" startIcon={<Save />} onClick={createShipment}>
                            Utwórz przesyłkę
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
