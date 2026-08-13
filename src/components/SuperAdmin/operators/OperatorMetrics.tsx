import React from "react";
import {CheckCircle, Inventory2, LocalShipping, TrendingUp} from "components/ui/icons";
import pl from "../../../i18n/translate";

type OperatorMetricsProps = {
    activeOperators: number;
    lockerOperators: number;
    internationalOperators: number;
    enabledFeatures: number;
};

function OperatorMetrics({activeOperators, lockerOperators, internationalOperators, enabledFeatures}: OperatorMetricsProps) {
    return (
        <section className="super-admin-metrics" aria-label={pl.superAdmin.metrics.ariaLabel}>
            <article className="super-admin-metric-card">
                <span className="super-admin-metric-icon super-admin-metric-icon-green"><CheckCircle fontSize="small"/></span>
                <strong>{activeOperators}</strong>
                <small>{pl.superAdmin.metrics.activeOperators}</small>
            </article>
            <article className="super-admin-metric-card">
                <span className="super-admin-metric-icon super-admin-metric-icon-blue"><Inventory2 fontSize="small"/></span>
                <strong>{lockerOperators}</strong>
                <small>{pl.superAdmin.metrics.lockerOperators}</small>
            </article>
            <article className="super-admin-metric-card">
                <span className="super-admin-metric-icon super-admin-metric-icon-orange"><LocalShipping fontSize="small"/></span>
                <strong>{internationalOperators}</strong>
                <small>{pl.superAdmin.metrics.internationalOperators}</small>
            </article>
            <article className="super-admin-metric-card">
                <span className="super-admin-metric-icon super-admin-metric-icon-slate"><TrendingUp fontSize="small"/></span>
                <strong>{enabledFeatures}</strong>
                <small>{pl.superAdmin.metrics.enabledFeatures}</small>
            </article>
        </section>
    );
}

export default OperatorMetrics;
