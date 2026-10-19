import React from "react";
import {getAppEnvironment} from "../../config/appEnvironment";
import {getAppVersion} from "../../config/appVersion";
import pl from "../../i18n/translate";
import "./styles/app-footer.css";

function AppFooter() {
    const environment = getAppEnvironment();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <span className="app-footer-copyright">
                © {currentYear} {pl.common.brand}. {pl.footer.rights}
            </span>
            <div className="app-footer-meta">
                <span
                    aria-label={`${pl.footer.environment}: ${pl.footer.environments[environment]}`}
                    className="app-footer-environment"
                    data-environment={environment}
                >
                    {pl.footer.environments[environment]}
                </span>
                <span className="app-footer-version">
                    {pl.common.version}
                    <strong>{getAppVersion()}</strong>
                </span>
            </div>
        </footer>
    );
}

export default AppFooter;
