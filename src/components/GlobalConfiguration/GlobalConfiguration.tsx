import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    TextField,
    Typography,
} from "@mui/material";
import {
    Refresh,
    Save,
} from "@mui/icons-material";
import {getBackendErrorMessage} from "../../api/errorMessage";
import SoftwareConfigurationService from "../../hooks/SoftwareConfigurationService";
import pl from "../../i18n/translate";
import Software from "../SoftwareConfiguration/model/Software";
import GeocodingConfigurationPanel from "./GeocodingConfigurationPanel";
import IntegrationsConfigurationPanel from "./IntegrationsConfigurationPanel";
import {GlobalConfigurationSection, GlobalConfigurationSectionKey} from "./model/GlobalConfigurationSection";
import "./styles/global-configuration.css";

type PropertyDraft = {
    name: string;
    value: string;
};

type CourierConfigurationDraft = {
    copyDepartmentCodeFromDevice: boolean;
    skipInvalidShipments: boolean;
    generateNewReturnCodes: boolean;
    editDeliveryArea: boolean;
    substituteCourier: string;
    autoGenerateLabels: boolean;
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

const sections: GlobalConfigurationSection[] = [
    {
        key: "suppliers",
        categoryAliases: ["supplier", "suppliers", "courier", "couriers"],
    },
    {
        key: "shipments",
        categoryAliases: ["shipment", "shipments", "parcel", "parcels"],
    },
    {
        key: "configuration",
        categoryAliases: ["configuration", "config", "system", "software", "global"],
    },
    {
        key: "geocoding",
        categoryAliases: [],
    },
    {
        key: "integrations",
        categoryAliases: [],
    },
];

const isDedicatedConfigurationSection = (sectionKey: GlobalConfigurationSectionKey) => (
    sectionKey === "geocoding" || sectionKey === "integrations"
);

const normalizeCategory = (value?: string) => (value || "").trim().toLowerCase();

const propertyBelongsToSection = (property: Software, section: GlobalConfigurationSection) => {
    const category = normalizeCategory(property.category);
    if (!category) {
        return section.key === "configuration";
    }

    return section.categoryAliases.some((alias) => category.includes(alias));
};

const getSectionForProperty = (property: Software) => (
    sections.find((section) => propertyBelongsToSection(property, section)) || sections[2]
);

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

function GlobalConfiguration() {
    const [properties, setProperties] = useState<Software[]>([]);
    const [drafts, setDrafts] = useState<Record<string, PropertyDraft>>({});
    const [courierConfiguration, setCourierConfiguration] = useState<CourierConfigurationDraft>(readCourierConfiguration);
    const [loading, setLoading] = useState<boolean>(false);
    const [savingId, setSavingId] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [activeSectionKey, setActiveSectionKey] = useState<GlobalConfigurationSectionKey>("suppliers");

    const retrieveProperties = useCallback(() => {
        setLoading(true);
        setError("");
        setSuccess("");
        SoftwareConfigurationService.getAll()
            .then((response) => {
                setProperties(response.data);
                setDrafts({});
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.globalConfiguration.messages.loadError));
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        retrieveProperties();
    }, [retrieveProperties]);

    const propertiesBySection = useMemo(() => {
        const grouped = sections.reduce((accumulator, section) => ({
            ...accumulator,
            [section.key]: [] as Software[],
        }), {} as Record<GlobalConfigurationSectionKey, Software[]>);

        properties.forEach((property) => {
            const section = getSectionForProperty(property);
            grouped[section.key].push(property);
        });

        return grouped;
    }, [properties]);

    const activeSection = sections.find((section) => section.key === activeSectionKey) || sections[0];
    const activeSectionProperties = propertiesBySection[activeSection.key];
    const activeSectionTranslation = pl.globalConfiguration.sections[activeSection.key];

    const updateDraft = (id: string, field: keyof PropertyDraft, value: string) => {
        const property = properties.find((item) => item.id === id);
        setDrafts((currentDrafts) => ({
            ...currentDrafts,
            [id]: {
                name: currentDrafts[id]?.name ?? property?.name ?? "",
                value: currentDrafts[id]?.value ?? property?.value ?? "",
                [field]: value,
            },
        }));
    };

    const updateCourierConfiguration = (field: keyof CourierConfigurationDraft, value: string | boolean) => {
        setCourierConfiguration((currentConfiguration) => ({
            ...currentConfiguration,
            [field]: value,
        }));
    };

    const saveCourierConfiguration = () => {
        window.localStorage.setItem(COURIER_CONFIGURATION_STORAGE_KEY, JSON.stringify(courierConfiguration));
        setError("");
        setSuccess(pl.globalConfiguration.courierConfiguration.messages.saved);
    };

    const saveProperty = (property: Software, section: GlobalConfigurationSection) => {
        const draft = drafts[property.id] || {
            name: property.name,
            value: property.value,
        };

        setSavingId(property.id);
        setError("");
        setSuccess("");
        SoftwareConfigurationService.update(property.id, {
            category: property.category || section.key,
            name: draft.name,
            value: draft.value,
        })
            .then((response) => {
                const updatedProperty = response.data;
                setProperties((currentProperties) => currentProperties.map((item) => (
                    item.id === property.id ? updatedProperty : item
                )));
                setDrafts((currentDrafts) => {
                    const nextDrafts = {...currentDrafts};
                    delete nextDrafts[property.id];
                    return nextDrafts;
                });
                setSuccess(pl.globalConfiguration.messages.updateSuccess);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.globalConfiguration.messages.updateError));
            })
            .finally(() => {
                setSavingId("");
            });
    };

    return (
        <main className="global-configuration-page">
            <section className="global-configuration-header">
                <div>
                    <span className="global-configuration-kicker">{pl.globalConfiguration.page.kicker}</span>
                    <Typography variant="h4">{pl.globalConfiguration.page.title}</Typography>
                    <p>{pl.globalConfiguration.page.subtitle}</p>
                </div>
            </section>

            <nav className="global-configuration-tabs" aria-label={pl.globalConfiguration.page.sectionsTitle}>
                <div className="global-configuration-tab-list">
                    {sections.map((section) => {
                        const sectionTranslation = pl.globalConfiguration.sections[section.key];
                        const isActive = activeSectionKey === section.key;

                        return (
                            <button
                                className={`global-configuration-tab${isActive ? " global-configuration-tab-active" : ""}`}
                                key={section.key}
                                onClick={() => setActiveSectionKey(section.key)}
                                type="button"
                            >
                                {sectionTranslation.title}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {!isDedicatedConfigurationSection(activeSection.key) && error
                ? <Alert severity="error">{error}</Alert>
                : undefined}
            {!isDedicatedConfigurationSection(activeSection.key) && success
                ? <Alert severity="success">{success}</Alert>
                : undefined}

            <section className="global-configuration-toolbar">
                <div>
                    <h2>{activeSectionTranslation.title}</h2>
                    <p>{activeSectionTranslation.description}</p>
                </div>
                {!isDedicatedConfigurationSection(activeSection.key) ? (
                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={retrieveProperties}>
                        {pl.common.refresh}
                    </Button>
                ) : undefined}
            </section>

            {activeSection.key === "geocoding" ? (
                <GeocodingConfigurationPanel />
            ) : activeSection.key === "integrations" ? (
                <IntegrationsConfigurationPanel />
            ) : loading ? (
                <div className="global-configuration-loader">
                    <CircularProgress size={28} />
                    <span>{pl.globalConfiguration.page.loading}</span>
                </div>
            ) : (
                <>
                    {activeSection.key === "suppliers" ? (
                        <section className="global-configuration-section global-configuration-courier-panel">
                            <div className="global-configuration-panel-header">
                                <h3>{pl.globalConfiguration.courierConfiguration.title}</h3>
                                <Button startIcon={<Save />} variant="contained" onClick={saveCourierConfiguration}>
                                    {pl.common.saveChanges}
                                </Button>
                            </div>

                            <div className="global-configuration-courier-grid">
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
                                    label={pl.globalConfiguration.courierConfiguration.fields.substituteCourier}
                                    size="small"
                                    value={courierConfiguration.substituteCourier}
                                    onChange={(event) => updateCourierConfiguration("substituteCourier", event.target.value)}
                                />
                            </div>
                        </section>
                    ) : undefined}

                    <section className="global-configuration-section">
                        <div className="global-configuration-table-wrap">
                            <table className="global-configuration-table">
                                <thead>
                                <tr>
                                    <th>{pl.globalConfiguration.columns.name}</th>
                                    <th>{pl.globalConfiguration.columns.category}</th>
                                    <th>{pl.globalConfiguration.columns.value}</th>
                                    <th>{pl.common.actions}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {activeSectionProperties.map((property) => {
                                    const draft = drafts[property.id];
                                    const saving = savingId === property.id;

                                    return (
                                        <tr key={property.id}>
                                            <td>
                                                <TextField
                                                    disabled={saving}
                                                    fullWidth
                                                    size="small"
                                                    value={draft?.name ?? property.name}
                                                    onChange={(event) => updateDraft(property.id, "name", event.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <span className="global-configuration-category">{property.category || activeSection.key}</span>
                                            </td>
                                            <td>
                                                <TextField
                                                    disabled={saving}
                                                    fullWidth
                                                    size="small"
                                                    value={draft?.value ?? property.value}
                                                    onChange={(event) => updateDraft(property.id, "value", event.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <Button
                                                    disabled={saving}
                                                    startIcon={<Save />}
                                                    variant="contained"
                                                    onClick={() => saveProperty(property, activeSection)}
                                                >
                                                    {pl.common.saveChanges}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!activeSectionProperties.length ? (
                                    <tr>
                                        <td className="global-configuration-empty" colSpan={4}>
                                            {pl.globalConfiguration.page.emptySection}
                                        </td>
                                    </tr>
                                ) : undefined}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}

export default GlobalConfiguration;
