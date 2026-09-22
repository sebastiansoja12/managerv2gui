import React, {useState} from "react";
import {
    Business,
    Cable,
    ChatBubbleOutline,
    ChevronRight,
    DirectionsCar,
    Inventory2Outlined,
    LocalShipping,
    LocationOn,
    Map,
    Public,
    QrCodeScanner,
    Tune,
} from "components/ui/icons";
import pl from "../../i18n/translate";
import CommunicationConfigurationPanel from "./CommunicationConfigurationPanel";
import CourierConfigurationPolicyPanel from "./CourierConfigurationPolicyPanel";
import DepartmentConfigurationPanel from "./DepartmentConfigurationPanel";
import FleetConfigurationPanel from "./FleetConfigurationPanel";
import GeocodingConfigurationPanel from "./GeocodingConfigurationPanel";
import IntegrationsConfigurationPanel from "./IntegrationsConfigurationPanel";
import {GlobalConfigurationSectionKey} from "./model/GlobalConfigurationSection";
import PickupPointConfigurationPanel from "./PickupPointConfigurationPanel";
import RegionalConfigurationPanel from "./RegionalConfigurationPanel";
import SortingConfigurationPanel from "./SortingConfigurationPanel";
import ShipmentConfigurationPanel from "./ShipmentConfigurationPanel";
import "./styles/global-configuration.css";

const sections: GlobalConfigurationSectionKey[] = [
    "shipments",
    "couriers",
    "departments",
    "sorting",
    "pickupPoints",
    "fleet",
    "communication",
    "regional",
    "geocoding",
    "integrations",
];

const sectionIcons: Record<GlobalConfigurationSectionKey, React.ReactNode> = {
    shipments: <Inventory2Outlined fontSize="small" />,
    couriers: <LocalShipping fontSize="small" />,
    departments: <Business fontSize="small" />,
    geocoding: <Map fontSize="small" />,
    integrations: <Cable fontSize="small" />,
    sorting: <QrCodeScanner fontSize="small" />,
    pickupPoints: <LocationOn fontSize="small" />,
    fleet: <DirectionsCar fontSize="small" />,
    communication: <ChatBubbleOutline fontSize="small" />,
    regional: <Public fontSize="small" />,
};

const sectionPanels: Record<GlobalConfigurationSectionKey, React.ReactNode> = {
    shipments: <ShipmentConfigurationPanel />,
    couriers: <CourierConfigurationPolicyPanel />,
    departments: <DepartmentConfigurationPanel />,
    geocoding: <GeocodingConfigurationPanel />,
    integrations: <IntegrationsConfigurationPanel />,
    sorting: <SortingConfigurationPanel />,
    pickupPoints: <PickupPointConfigurationPanel />,
    fleet: <FleetConfigurationPanel />,
    communication: <CommunicationConfigurationPanel />,
    regional: <RegionalConfigurationPanel />,
};

function GlobalConfiguration() {
    const [activeSection, setActiveSection] = useState<GlobalConfigurationSectionKey>("shipments");
    const activeSectionTranslation = pl.globalConfiguration.sections[activeSection];

    return (
        <main className="global-configuration-page">
            <div className="global-configuration-shell">
                <nav
                    className="global-configuration-crumbs"
                    aria-label={pl.globalConfiguration.page.sectionsTitle}
                >
                    <div className="global-configuration-crumbs-trail">
                        <span className="global-configuration-crumbs-root">
                            <Tune fontSize="small" aria-hidden="true" />
                            {pl.globalConfiguration.page.kicker}
                        </span>
                        <ChevronRight className="global-configuration-crumbs-separator" aria-hidden="true" />
                        <div className="global-configuration-crumbs-sections" role="tablist">
                            {sections.map((section) => {
                                const isActive = activeSection === section;
                                return (
                                    <button
                                        aria-current={isActive ? "page" : undefined}
                                        aria-selected={isActive}
                                        className="global-configuration-crumbs-section"
                                        data-active={isActive}
                                        key={section}
                                        onClick={() => setActiveSection(section)}
                                        role="tab"
                                        type="button"
                                    >
                                        {pl.globalConfiguration.sections[section].title}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <span className="global-configuration-crumbs-page" title={pl.globalConfiguration.page.subtitle}>
                        {pl.globalConfiguration.page.title}
                    </span>
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
