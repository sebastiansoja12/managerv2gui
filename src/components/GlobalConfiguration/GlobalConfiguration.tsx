import React, {useState} from "react";
import {Typography} from "components/ui";
import {Cable, Inventory2Outlined, Map, SettingsSuggest} from "components/ui/icons";
import pl from "../../i18n/translate";
import GeocodingConfigurationPanel from "./GeocodingConfigurationPanel";
import IntegrationsConfigurationPanel from "./IntegrationsConfigurationPanel";
import {GlobalConfigurationSectionKey} from "./model/GlobalConfigurationSection";
import ShipmentConfigurationPanel from "./ShipmentConfigurationPanel";
import "./styles/global-configuration.css";

const sections: GlobalConfigurationSectionKey[] = ["shipments", "geocoding", "integrations"];

const sectionIcons: Record<GlobalConfigurationSectionKey, React.ReactNode> = {
    shipments: <Inventory2Outlined fontSize="small" />,
    geocoding: <Map fontSize="small" />,
    integrations: <Cable fontSize="small" />,
};

const sectionPanels: Record<GlobalConfigurationSectionKey, React.ReactNode> = {
    shipments: <ShipmentConfigurationPanel />,
    geocoding: <GeocodingConfigurationPanel />,
    integrations: <IntegrationsConfigurationPanel />,
};

function GlobalConfiguration() {
    const [activeSection, setActiveSection] = useState<GlobalConfigurationSectionKey>("shipments");
    const activeSectionTranslation = pl.globalConfiguration.sections[activeSection];

    return (
        <main className="global-configuration-page">
            <div className="global-configuration-shell">
                <section className="global-configuration-header">
                    <div className="global-configuration-title-icon" aria-hidden="true">
                        <SettingsSuggest />
                    </div>
                    <div className="global-configuration-heading">
                        <span className="global-configuration-kicker">{pl.globalConfiguration.page.kicker}</span>
                        <Typography variant="h4">{pl.globalConfiguration.page.title}</Typography>
                        <p>{pl.globalConfiguration.page.subtitle}</p>
                    </div>
                </section>

                <nav className="global-configuration-tabs" aria-label={pl.globalConfiguration.page.sectionsTitle}>
                    <div className="global-configuration-tab-list">
                        {sections.map((section) => {
                            const isActive = activeSection === section;
                            return (
                                <button
                                    className={`global-configuration-tab${isActive ? " global-configuration-tab-active" : ""}`}
                                    key={section}
                                    aria-pressed={isActive}
                                    onClick={() => setActiveSection(section)}
                                    type="button"
                                >
                                    <span className="global-configuration-tab-icon" aria-hidden="true">
                                        {sectionIcons[section]}
                                    </span>
                                    {pl.globalConfiguration.sections[section].title}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <div className="global-configuration-content">
                    <section className="global-configuration-toolbar">
                        <div className="global-configuration-toolbar-heading">
                            <span className="global-configuration-section-icon" aria-hidden="true">
                                {sectionIcons[activeSection]}
                            </span>
                            <div>
                                <h2>{activeSectionTranslation.title}</h2>
                                <p>{activeSectionTranslation.description}</p>
                            </div>
                        </div>
                    </section>

                    {sectionPanels[activeSection]}
                </div>
            </div>
        </main>
    );
}

export default GlobalConfiguration;
