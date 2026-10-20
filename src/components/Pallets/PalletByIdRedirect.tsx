import React, {useEffect, useState} from "react";
import {Alert, CircularProgress} from "components/ui";
import {Navigate, useParams} from "react-router-dom";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";

function PalletByIdRedirect() {
    const {palletId = ""} = useParams();
    const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;
        setTrackingNumber(null);
        setFailed(false);
        PalletService.getById(palletId)
            .then((response) => {
                if (active) {
                    setTrackingNumber(response.data.trackingNumber);
                }
            })
            .catch(() => {
                if (active) {
                    setFailed(true);
                }
            });
        return () => {active = false;};
    }, [palletId]);

    if (trackingNumber) {
        return <Navigate replace to={`/pallets/tracking/${encodeURIComponent(trackingNumber)}`}/>;
    }
    return failed
        ? <Alert severity="error">{pl.pallets.details.loadError}</Alert>
        : <div className="deliveries-state"><CircularProgress size={24}/></div>;
}

export default PalletByIdRedirect;
