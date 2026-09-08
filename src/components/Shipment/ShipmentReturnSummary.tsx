import React from "react";
import {useNavigate} from "react-router-dom";
import {Button, Chip} from "components/ui";
import {Loop} from "components/ui/icons";
import pl from "../../i18n/translate";
import {ReturnPackageDto} from "../Returns/model/ReturnPackage";
import "./styles/shipment-return-summary.css";

type Props = {
    returnPackage: ReturnPackageDto | null;
};

const ShipmentReturnSummary: React.FC<Props> = ({returnPackage}) => {
    const navigate = useNavigate();
    const translations = pl.shipments.returnSummary;
    if (!returnPackage) return null;

    return (
        <section className="shipment-return-summary" aria-label={translations.title}>
            <div className="shipment-return-summary-copy">
                <Loop aria-hidden="true" />
                <div>
                    <span>{translations.title}</span>
                    <strong>{pl.returns.fields.returnId}: {returnPackage.returnPackageId.value}</strong>
                </div>
            </div>
            <div className="shipment-return-summary-actions">
                <Chip className={`tm-status tm-status-${returnPackage.returnStatus.toLowerCase()}`}
                      label={pl.returns.status[returnPackage.returnStatus] || returnPackage.returnStatus}
                      size="small" />
                <Button variant="outlined" onClick={() =>
                    navigate(`/returns/${encodeURIComponent(returnPackage.returnPackageId.value)}`)
                }>{translations.open}</Button>
            </div>
        </section>
    );
};

export default ShipmentReturnSummary;
