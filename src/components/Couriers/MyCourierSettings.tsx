import React from "react";
import CourierConfigurationDialog from "./CourierConfigurationDialog";
import "./styles/couriers.css";

function MyCourierSettings() {
    return <CourierConfigurationDialog open variant="page" onClose={() => undefined} />;
}

export default MyCourierSettings;
