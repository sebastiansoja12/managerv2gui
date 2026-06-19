import React from "react";
import {Route, Routes} from "react-router-dom";
import Departments from "../Departments";
import DevicePairing from "../Devices/DevicePairing";
import HomeDashboard from "../Home/HomeDashboard";
import ModulePlaceholder from "../Home/ModulePlaceholder";
import LoginPage from "../LoginPage/LoginPage";
import ShipmentCreate from "../Shipment/ShipmentCreate";
import ShipmentControlCenter from "../Shipment/ShipmentControlCenter";
import ShipmentList from "../Shipment/ShipmentList";
import SoftwareConfigurationList from "../SoftwareConfiguration/SoftwareConfigurationList";
import UserProfile from "../UserProfile/UserProfile";
import {isPathAllowedForProfile, OperationalProfile} from "../../config/operationalProfile";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "./types";

type AppRoutesProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
    operationalProfile?: OperationalProfile;
};

function AppRoutes({onOpenTab, operationalProfile = "warehouse"}: AppRoutesProps) {
    const guarded = (path: string, element: React.ReactElement) => (
        isPathAllowedForProfile(path, operationalProfile)
            ? element
            : <ModulePlaceholder forbidden title={pl.modules.placeholder.forbiddenTitle}/>
    );

    return (
        <Routes>
            <Route path="/" element={<HomeDashboard onOpenTab={onOpenTab} operationalProfile={operationalProfile}/>}/>
            <Route path="depots" element={guarded("/depots", <Departments/>)}/>
            <Route path="parcels" element={guarded("/shipments/list", <ShipmentList onOpenTab={onOpenTab}/>)}/>
            <Route path="shipment-control-center" element={guarded("/shipment-control-center", <ShipmentList onOpenTab={onOpenTab} variant="controlCenter"/>)}/>
            <Route path="shipments" element={guarded("/shipments/list", <ShipmentList onOpenTab={onOpenTab}/>)}/>
            <Route path="shipments/list" element={guarded("/shipments/list", <ShipmentList onOpenTab={onOpenTab}/>)}/>
            <Route path="shipments/create" element={guarded("/shipments/create", <ShipmentCreate/>)}/>
            <Route path="shipments/tracking/:trackingNumber/edit" element={guarded("/shipments/tracking/:trackingNumber/edit", <ShipmentControlCenter/>)}/>
            <Route path="shipments/:shipmentId/edit" element={guarded("/shipments/1/edit", <ShipmentControlCenter/>)}/>
            <Route path="analytics" element={guarded("/analytics", <ModulePlaceholder title={pl.home.tiles.analytics.title}/>)}/>
            <Route path="processes" element={guarded("/processes", <ModulePlaceholder title={pl.home.tiles.processes.title}/>)}/>
            <Route path="couriers" element={guarded("/couriers", <ModulePlaceholder title={pl.home.tiles.couriers.title}/>)}/>
            <Route path="vehicles" element={guarded("/vehicles", <ModulePlaceholder title={pl.home.tiles.vehicles.title}/>)}/>
            <Route path="pallets" element={guarded("/pallets", <ModulePlaceholder title={pl.home.tiles.pallets.title}/>)}/>
            <Route path="shipment-scanner" element={guarded("/shipment-scanner", <ModulePlaceholder title={pl.home.tiles.shipmentScanner.title}/>)}/>
            <Route path="courier-deliveries" element={guarded("/courier-deliveries", <ModulePlaceholder title={pl.home.tiles.courierDeliveries.title}/>)}/>
            <Route path="suppliers" element={guarded("/suppliers", <ModulePlaceholder title={pl.navigation.suppliers}/>)}/>
            <Route path="users" element={guarded("/users", <ModulePlaceholder title={pl.navigation.users}/>)}/>
            <Route path="deals" element={guarded("/deals", <ModulePlaceholder title={pl.navigation.deals}/>)}/>
            <Route path="billing" element={guarded("/billing", <ModulePlaceholder title={pl.navigation.billing}/>)}/>
            <Route path="support" element={guarded("/support", <ModulePlaceholder title={pl.navigation.support}/>)}/>
            <Route path="login" element={<LoginPage/>}/>
            <Route path="profile" element={<UserProfile/>}/>
            <Route path="device-pairing" element={guarded("/device-pairing", <DevicePairing/>)}/>
            <Route path="software-configurations" element={guarded("/software-configurations", <SoftwareConfigurationList/>)}/>
        </Routes>
    );
}

export default AppRoutes;
