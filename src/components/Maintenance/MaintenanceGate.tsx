import React, {useCallback, useEffect, useState} from "react";
import {Construction, Refresh} from "components/ui/icons";
import ImpersonationService from "../../hooks/ImpersonationService";
import MaintenanceService from "../../hooks/MaintenanceService";
import pl from "../../i18n/translate";
import {clearMaintenance, reportMaintenance, useMaintenanceState} from "./maintenanceStore";
import "./styles/maintenance.css";

export const MAINTENANCE_POLL_INTERVAL_MS = 30000;

type MaintenanceGateProps = {
    children: React.ReactNode;
};

const resolveMaintenance = async () => {
    const status = await MaintenanceService.getPublicStatus();
    if (!status?.enabled) {
        clearMaintenance();
        return;
    }
    const impersonation = await ImpersonationService.getCurrent().catch(() => null);
    if (impersonation) {
        clearMaintenance();
        return;
    }
    reportMaintenance(status.message);
};

function MaintenanceGate({children}: MaintenanceGateProps) {
    const maintenance = useMaintenanceState();
    const [checking, setChecking] = useState(false);

    const check = useCallback(() => {
        setChecking(true);
        return resolveMaintenance()
            .catch(() => undefined)
            .finally(() => setChecking(false));
    }, []);

    useEffect(() => {
        void check();
    }, [check]);

    useEffect(() => {
        if (!maintenance.active) {
            return undefined;
        }
        const interval = window.setInterval(() => {
            void check();
        }, MAINTENANCE_POLL_INTERVAL_MS);
        return () => window.clearInterval(interval);
    }, [check, maintenance.active]);

    if (!maintenance.active) {
        return <>{children}</>;
    }

    return (
        <main className="maintenance-screen">
            <section aria-live="polite" className="maintenance-card" role="status">
                <span className="maintenance-icon"><Construction /></span>
                <span className="maintenance-kicker">{pl.maintenance.kicker}</span>
                <h1>{pl.maintenance.title}</h1>
                <p>{maintenance.message || pl.maintenance.defaultMessage}</p>
                <button className="maintenance-retry" disabled={checking} onClick={() => void check()} type="button">
                    <Refresh fontSize="small" />
                    <span>{checking ? pl.maintenance.checking : pl.maintenance.retry}</span>
                </button>
                <small>{pl.maintenance.autoRefresh}</small>
            </section>
        </main>
    );
}

export default MaintenanceGate;
