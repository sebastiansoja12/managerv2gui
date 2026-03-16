import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Button, CircularProgress, Typography} from "@mui/material";
import {CheckCircle, ErrorOutline, Refresh, Storage} from "@mui/icons-material";
import MicroserviceStatusService from "../../hooks/MicroserviceStatusService";
import pl from "../../i18n/translate";
import {MicroserviceStatusResult} from "./model/MicroserviceStatusDto";
import "./styles/microservice-status.css";

const formatCheckedAt = (value?: string) => {
    if (!value) {
        return pl.common.dash;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return pl.common.dash;
    }

    return date.toLocaleString(pl.common.locale);
};

const getStatusLabel = (service: MicroserviceStatusResult) => {
    if (service.state === "online") {
        return pl.microservices.status.online;
    }

    if (service.state === "offline") {
        return pl.microservices.status.offline;
    }

    return pl.microservices.status.unknown;
};

function MicroserviceStatus() {
    const [services, setServices] = useState<MicroserviceStatusResult[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const onlineCount = useMemo(
        () => services.filter((service) => service.state === "online").length,
        [services]
    );

    const offlineCount = useMemo(
        () => services.filter((service) => service.state === "offline").length,
        [services]
    );

    const checkServices = useCallback(() => {
        setLoading(true);
        setError("");
        MicroserviceStatusService.checkAll()
            .then(setServices)
            .catch((exception: unknown) => {
                setError(exception instanceof Error ? exception.message : pl.microservices.messages.loadError);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        checkServices();
    }, [checkServices]);

    return (
        <main className="microservice-status-page">
            <section className="microservice-status-header">
                <div>
                    <span className="microservice-status-kicker">{pl.microservices.page.kicker}</span>
                    <Typography variant="h4">{pl.microservices.page.title}</Typography>
                    <p>{pl.microservices.page.subtitle}</p>
                </div>
                <div className="microservice-status-summary">
                    <div>
                        <CheckCircle fontSize="small" />
                        <span>{pl.microservices.status.online}</span>
                        <strong>{onlineCount}</strong>
                    </div>
                    <div>
                        <ErrorOutline fontSize="small" />
                        <span>{pl.microservices.status.offline}</span>
                        <strong>{offlineCount}</strong>
                    </div>
                    <div>
                        <Storage fontSize="small" />
                        <span>{pl.microservices.page.servicesCount}</span>
                        <strong>{services.length}</strong>
                    </div>
                </div>
            </section>

            {error ? <Alert severity="error">{error}</Alert> : undefined}

            <section className="microservice-status-panel">
                <div className="microservice-status-panel-header">
                    <Typography variant="h5">{pl.microservices.page.listTitle}</Typography>
                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={checkServices}>
                        {pl.common.refresh}
                    </Button>
                </div>

                {loading && !services.length ? (
                    <div className="microservice-status-loader">
                        <CircularProgress size={28} />
                        <span>{pl.microservices.page.loading}</span>
                    </div>
                ) : (
                    <div className="microservice-status-table-wrap">
                        <table className="microservice-status-table">
                            <thead>
                            <tr>
                                <th>{pl.microservices.columns.name}</th>
                                <th>{pl.microservices.columns.url}</th>
                                <th>{pl.microservices.columns.status}</th>
                                <th>{pl.microservices.columns.latency}</th>
                                <th>{pl.microservices.columns.lastCheck}</th>
                                <th>{pl.microservices.columns.message}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {services.map((service) => (
                                <tr key={service.id}>
                                    <td><strong>{service.name}</strong></td>
                                    <td>{service.baseUrl || service.environmentVariable}</td>
                                    <td>
                                        <span className={`microservice-status-badge microservice-status-badge-${service.state}`}>
                                            {getStatusLabel(service)}
                                        </span>
                                    </td>
                                    <td>{service.latencyMs ? `${service.latencyMs} ms` : pl.common.dash}</td>
                                    <td>{formatCheckedAt(service.checkedAt)}</td>
                                    <td>{service.message}</td>
                                </tr>
                            ))}
                            {!services.length ? (
                                <tr>
                                    <td className="microservice-status-empty" colSpan={6}>
                                        {pl.microservices.page.empty}
                                    </td>
                                </tr>
                            ) : undefined}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

export default MicroserviceStatus;
