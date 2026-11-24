import React, {useEffect, useState} from "react";
import {Button, Chip, Typography} from "components/ui";
import {ReportProblemOutlined} from "components/ui/icons";
import IncidentService from "../../hooks/IncidentService";
import pl from "../../i18n/translate";
import {IncidentDto} from "../Incidents/model/Incident";
import {formatIncidentDateTime, severityColor, statusColor} from "../Incidents/incidentPresentation";
import {ShipmentStatusDto} from "./dto/ShipmentDto";

type ShipmentIncidentCardProps = {
    shipmentId: string;
    shipmentStatus: ShipmentStatusDto;
    reloadKey: number;
    onOpenIncident: (incidentId: string) => void;
};

const ShipmentIncidentCard: React.FC<ShipmentIncidentCardProps> = ({shipmentId, shipmentStatus, reloadKey, onOpenIncident}) => {
    const [incidents, setIncidents] = useState<IncidentDto[]>([]);

    useEffect(() => {
        let active = true;
        IncidentService.findByShipment(shipmentId)
            .then((response) => {
                if (active) {
                    setIncidents(response.data.incidents);
                }
            })
            .catch(() => {
                if (active) {
                    setIncidents([]);
                }
            });
        return () => {
            active = false;
        };
    }, [shipmentId, reloadKey]);

    const activeIncidents = incidents.filter((incident) => incident.status !== "RESOLVED");
    const resolvedIncidents = incidents.filter((incident) => incident.status === "RESOLVED");
    const lost = shipmentStatus === "LOST";

    if (!lost && activeIncidents.length === 0) {
        return null;
    }

    return (
        <section
            className={`shipment-dashboard-card shipment-incident-card${lost ? " shipment-incident-card-lost" : ""}`}
            aria-label={pl.incidents.shipmentCard.title}
        >
            <div className="shipment-dashboard-card-header">
                <div className="shipment-dashboard-card-title">
                    <span><ReportProblemOutlined fontSize="small" /></span>
                    <Typography variant="h6">{pl.incidents.shipmentCard.title}</Typography>
                </div>
                {lost ? <Chip className="tm-status tm-status-lost" label={pl.shipments.status.LOST} size="small" /> : null}
            </div>
            <div className="shipment-incident-content">
                {lost ? <div className="shipment-incident-lost">{pl.incidents.shipmentCard.lost}</div> : null}
                {activeIncidents.map((incident) => (
                    <article className="shipment-incident-item" key={incident.incidentId.value}>
                        <div className="shipment-incident-item-header">
                            <strong>{pl.incidents.shipmentCard.active} #{incident.incidentId.value}</strong>
                            <Chip color={statusColor(incident.status)} label={pl.incidents.statuses[incident.status]} size="small" />
                            <Chip color={severityColor(incident.severity)} label={pl.incidents.severities[incident.severity]} size="small" />
                            <Chip label={pl.incidents.categories[incident.category]} size="small" variant="outlined" />
                        </div>
                        <p className="shipment-incident-description">
                            {incident.description || pl.incidents.details.noDescription}
                        </p>
                        <div className="shipment-incident-meta">
                            <span>
                                {pl.incidents.shipmentCard.reportedBy
                                    .replace("{username}", incident.reporter.username || pl.common.dash)
                                    .replace("{reportedAt}", formatIncidentDateTime(incident.reportedAt))}
                            </span>
                            <span>
                                {pl.incidents.shipmentCard.assignee}: {incident.assignee?.username || pl.incidents.list.unassigned}
                            </span>
                            <Button size="small" variant="outlined" onClick={() => onOpenIncident(String(incident.incidentId.value))}>
                                {pl.incidents.shipmentCard.open}
                            </Button>
                        </div>
                    </article>
                ))}
                {resolvedIncidents.length > 0 ? (
                    <div className="shipment-incident-resolved">
                        <strong>{pl.incidents.shipmentCard.resolvedTitle}</strong>
                        {resolvedIncidents.map((incident) => {
                            const resolvedEntry = [...incident.entries].reverse().find((entry) => entry.type === "RESOLVED");
                            return (
                                <button
                                    className="shipment-incident-resolved-item"
                                    key={incident.incidentId.value}
                                    type="button"
                                    onClick={() => onOpenIncident(String(incident.incidentId.value))}
                                >
                                    <span>#{incident.incidentId.value} · {pl.incidents.categories[incident.category]}</span>
                                    <span>{incident.resolution ? pl.incidents.resolutions[incident.resolution] : pl.common.dash}</span>
                                    <span>
                                        {pl.incidents.shipmentCard.resolvedBy
                                            .replace("{username}", resolvedEntry?.actor.username || pl.common.dash)
                                            .replace("{resolvedAt}", incident.resolvedAt ? formatIncidentDateTime(incident.resolvedAt) : pl.common.dash)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        </section>
    );
};

export default ShipmentIncidentCard;
