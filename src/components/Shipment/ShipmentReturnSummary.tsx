import React from "react";
import {useNavigate} from "react-router-dom";
import {Button, Chip} from "components/ui";
import {Loop} from "components/ui/icons";
import pl from "../../i18n/translate";
import {useOperatorCapabilities} from "../AppShell/OperatorCapabilitiesContext";
import {ReturnPackageDto} from "../Returns/model/ReturnPackage";
import "./styles/shipment-return-summary.css";

type Props = {
    returnPackage: ReturnPackageDto | null;
};

const ShipmentReturnSummary: React.FC<Props> = ({returnPackage}) => {
    const navigate = useNavigate();
    const {returnsStatus} = useOperatorCapabilities();
    const translations = pl.shipments.returnSummary;
    if (!returnPackage) return null;

    return (
        <section className="shipment-return-summary" aria-label={translations.title}>
            <div className="shipment-return-summary-copy">
                <Loop aria-hidden="true" />
                <div className="shipment-return-summary-details">
                    <div className="shipment-return-summary-heading">
                        <h2>{translations.title}</h2>
                        <Chip className={`tm-status tm-status-${returnPackage.returnStatus.toLowerCase()}`}
                              label={pl.returns.status[returnPackage.returnStatus] || returnPackage.returnStatus}
                              size="small" />
                    </div>
                    <p>{pl.returns.fields.returnId}: <strong>{returnPackage.returnPackageId.value}</strong></p>
                </div>
            </div>
            {returnsStatus === "available" ? <div className="shipment-return-summary-actions">
                <Button variant="contained" onClick={() =>
                    navigate(`/returns/${encodeURIComponent(returnPackage.returnPackageId.value)}`)
                }>{translations.open}</Button>
            </div> : null}
        </section>
    );
};

export default ShipmentReturnSummary;
