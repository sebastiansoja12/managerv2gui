import React, {useEffect, useState} from "react";
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
    IconButton,
    MenuItem,
    TextField,
} from "components/ui";
import {Close, Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import CourierService from "../../hooks/CourierService";
import pl from "../../i18n/translate";
import {CourierDto} from "./dto/CourierDto";

type CourierConfigurationDraft = {
    copyDepartmentCodeFromDevice: boolean;
    skipInvalidShipments: boolean;
    generateNewReturnCodes: boolean;
    editDeliveryArea: boolean;
    substituteCourier: string;
    autoGenerateLabels: boolean;
};

type CourierConfigurationDialogProps = {
    open: boolean;
    onClose: () => void;
};

const COURIER_CONFIGURATION_STORAGE_KEY = "manager.globalConfiguration.courier";

const defaultCourierConfiguration: CourierConfigurationDraft = {
    copyDepartmentCodeFromDevice: false,
    skipInvalidShipments: false,
    generateNewReturnCodes: false,
    editDeliveryArea: false,
    substituteCourier: "",
    autoGenerateLabels: false,
};

const readCourierConfiguration = (): CourierConfigurationDraft => {
    try {
        const storedValue = window.localStorage.getItem(COURIER_CONFIGURATION_STORAGE_KEY);
        if (!storedValue) {
            return defaultCourierConfiguration;
        }

        return {
            ...defaultCourierConfiguration,
            ...JSON.parse(storedValue),
        };
    } catch {
        return defaultCourierConfiguration;
    }
};

function CourierConfigurationDialog({open, onClose}: CourierConfigurationDialogProps) {
    const [courierConfiguration, setCourierConfiguration] = useState<CourierConfigurationDraft>(readCourierConfiguration);
    const [availableCouriers, setAvailableCouriers] = useState<CourierDto[]>([]);
    const [loadingCouriers, setLoadingCouriers] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (open) {
            setCourierConfiguration(readCourierConfiguration());
            setLoadingCouriers(true);
            setLoadError("");
            setSaved(false);
            CourierService.getAll()
                .then((response) => {
                    const activeCouriers = response.data
                        .filter((courier) => courier.status === "ACTIVE")
                        .sort((left, right) => {
                            const leftName = `${left.firstName || ""} ${left.lastName || ""}`.trim();
                            const rightName = `${right.firstName || ""} ${right.lastName || ""}`.trim();
                            return leftName.localeCompare(rightName, pl.common.locale);
                        });
                    setAvailableCouriers(activeCouriers);
                    setCourierConfiguration((currentConfiguration) => {
                        if (
                            currentConfiguration.substituteCourier
                            && !activeCouriers.some((courier) => courier.supplierCode.value === currentConfiguration.substituteCourier)
                        ) {
                            return {
                                ...currentConfiguration,
                                substituteCourier: "",
                            };
                        }

                        return currentConfiguration;
                    });
                })
                .catch((exception: unknown) => {
                    setAvailableCouriers([]);
                    setLoadError(getBackendErrorMessage(exception, pl.couriers.page.loadError));
                })
                .finally(() => {
                    setLoadingCouriers(false);
                });
        }
    }, [open]);

    const updateCourierConfiguration = (field: keyof CourierConfigurationDraft, value: string | boolean) => {
        setCourierConfiguration((currentConfiguration) => ({
            ...currentConfiguration,
            [field]: value,
        }));
        setSaved(false);
    };

    const saveCourierConfiguration = () => {
        window.localStorage.setItem(COURIER_CONFIGURATION_STORAGE_KEY, JSON.stringify(courierConfiguration));
        setSaved(true);
    };

    return (
        <Dialog
            className="courier-configuration-dialog"
            fullWidth
            maxWidth="lg"
            open={open}
            PaperProps={{className: "courier-configuration-dialog-paper"}}
            onClose={onClose}
        >
            <DialogTitle className="courier-configuration-dialog-title">
                <span>{pl.globalConfiguration.courierConfiguration.title}</span>
                <IconButton aria-label={pl.common.close} onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent className="courier-configuration-dialog-content">
                {saved ? <Alert severity="success">{pl.globalConfiguration.courierConfiguration.messages.saved}</Alert> : undefined}
                <div className="courier-configuration-grid">
                    <FormControlLabel
                        control={(
                            <Checkbox
                                checked={courierConfiguration.copyDepartmentCodeFromDevice}
                                onChange={(event) => updateCourierConfiguration("copyDepartmentCodeFromDevice", event.target.checked)}
                            />
                        )}
                        label={pl.globalConfiguration.courierConfiguration.fields.copyDepartmentCodeFromDevice}
                    />
                    <FormControlLabel
                        control={(
                            <Checkbox
                                checked={courierConfiguration.skipInvalidShipments}
                                onChange={(event) => updateCourierConfiguration("skipInvalidShipments", event.target.checked)}
                            />
                        )}
                        label={pl.globalConfiguration.courierConfiguration.fields.skipInvalidShipments}
                    />
                    <FormControlLabel
                        control={(
                            <Checkbox
                                checked={courierConfiguration.generateNewReturnCodes}
                                onChange={(event) => updateCourierConfiguration("generateNewReturnCodes", event.target.checked)}
                            />
                        )}
                        label={pl.globalConfiguration.courierConfiguration.fields.generateNewReturnCodes}
                    />
                    <FormControlLabel
                        control={(
                            <Checkbox
                                checked={courierConfiguration.editDeliveryArea}
                                onChange={(event) => updateCourierConfiguration("editDeliveryArea", event.target.checked)}
                            />
                        )}
                        label={pl.globalConfiguration.courierConfiguration.fields.editDeliveryArea}
                    />
                    <FormControlLabel
                        control={(
                            <Checkbox
                                checked={courierConfiguration.autoGenerateLabels}
                                onChange={(event) => updateCourierConfiguration("autoGenerateLabels", event.target.checked)}
                            />
                        )}
                        label={pl.globalConfiguration.courierConfiguration.fields.autoGenerateLabels}
                    />
                    <TextField
                        fullWidth
                        disabled={loadingCouriers}
                        label={pl.globalConfiguration.courierConfiguration.fields.substituteCourier}
                        select
                        size="small"
                        value={courierConfiguration.substituteCourier}
                        onChange={(event) => updateCourierConfiguration("substituteCourier", event.target.value)}
                    >
                        <MenuItem value="">{pl.common.dash}</MenuItem>
                        {availableCouriers.map((courier) => {
                            const code = courier.supplierCode.value;
                            const name = `${courier.firstName || ""} ${courier.lastName || ""}`.trim();
                            return (
                                <MenuItem key={code} value={code}>
                                    {name ? `${name} (${code})` : code}
                                </MenuItem>
                            );
                        })}
                    </TextField>
                </div>
                {loadingCouriers ? (
                    <div className="courier-configuration-loading">
                        <CircularProgress size={18} />
                        <span>{pl.common.loading}</span>
                    </div>
                ) : undefined}
                {loadError ? <Alert severity="error">{loadError}</Alert> : undefined}
            </DialogContent>
            <DialogActions className="courier-configuration-dialog-actions">
                <Button onClick={onClose}>{pl.couriers.actions.cancelEdit}</Button>
                <Button startIcon={<Save />} variant="contained" onClick={saveCourierConfiguration}>
                    {pl.common.saveChanges}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CourierConfigurationDialog;
