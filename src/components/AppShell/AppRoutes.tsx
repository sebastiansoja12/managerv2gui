import React from "react";
import {Route, Routes} from "react-router-dom";
import Couriers from "../Couriers/Couriers";
import CourierDetails from "../Couriers/CourierDetails";
import Departments from "../Departments";
import DevicePairing from "../Devices/DevicePairing";
import GlobalConfiguration from "../GlobalConfiguration/GlobalConfiguration";
import HomeDashboard from "../Home/HomeDashboard";
import ModulePlaceholder from "../Home/ModulePlaceholder";
import LoginPage from "../LoginPage/LoginPage";
import MicroserviceStatus from "../MicroserviceStatus/MicroserviceStatus";
import ProcessDetails from "../Process/ProcessDetails";
import Processes from "../Process/Processes";
import ShipmentCreate from "../Shipment/ShipmentCreate";
import ShipmentDetails from "../Shipment/ShipmentDetails";
import ShipmentHistoryDetails from "../Shipment/ShipmentHistoryDetails";
import ShipmentList from "../Shipment/ShipmentList";
import ShipmentScanner from "../ShipmentScanner/ShipmentScanner";
import SoftwareConfigurationList from "../SoftwareConfiguration/SoftwareConfigurationList";
import UserProfile from "../UserProfile/UserProfile";
import UsersPage from "../Users/UsersPage";
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
            <Route path="shipment-details" element={guarded("/shipment-details", <ShipmentList onOpenTab={onOpenTab} variant="details"/>)}/>
            <Route path="shipment-control-center" element={guarded("/shipment-details", <ShipmentList onOpenTab={onOpenTab} variant="details"/>)}/>
            <Route path="shipments" element={guarded("/shipments/list", <ShipmentList onOpenTab={onOpenTab}/>)}/>
            <Route path="shipments/list" element={guarded("/shipments/list", <ShipmentList onOpenTab={onOpenTab}/>)}/>
            <Route path="shipments/create" element={guarded("/shipments/create", <ShipmentCreate/>)}/>
            <Route path="shipments/tracking/:trackingNumber/edit" element={guarded("/shipments/tracking/:trackingNumber/edit", <ShipmentDetails/>)}/>
            <Route path="shipments/tracking/:trackingNumber/history" element={guarded("/shipments/tracking/:trackingNumber/history", <ShipmentHistoryDetails/>)}/>
            <Route path="shipments/:shipmentId/edit" element={guarded("/shipments/1/edit", <ShipmentDetails/>)}/>
            <Route path="shipments/:shipmentId/history" element={guarded("/shipments/1/history", <ShipmentHistoryDetails/>)}/>
            <Route path="analytics" element={guarded("/analytics", <ModulePlaceholder title={pl.home.tiles.analytics.title}/>)}/>
            <Route path="processes" element={guarded("/processes", <Processes/>)}/>
            <Route path="processes/:processId" element={guarded("/processes/1", <ProcessDetails/>)}/>
            <Route path="couriers" element={guarded("/couriers", <Couriers/>)}/>
            <Route path="couriers/:supplierCode" element={guarded("/couriers", <CourierDetails/>)}/>
            <Route path="vehicles" element={guarded("/vehicles", <ModulePlaceholder title={pl.home.tiles.vehicles.title}/>)}/>
            <Route path="pallets" element={guarded("/pallets", <ModulePlaceholder title={pl.home.tiles.pallets.title}/>)}/>
            <Route path="shipment-scanner" element={guarded("/shipment-scanner", <ShipmentScanner/>)}/>
            <Route path="courier-deliveries" element={guarded("/courier-deliveries", <ModulePlaceholder title={pl.home.tiles.courierDeliveries.title}/>)}/>
            <Route path="suppliers" element={guarded("/suppliers", <ModulePlaceholder title={pl.navigation.suppliers}/>)}/>
            <Route path="users" element={guarded("/users", <UsersPage/>)}/>
            <Route path="deals" element={guarded("/deals", <ModulePlaceholder title={pl.navigation.deals}/>)}/>
            <Route path="billing" element={guarded("/billing", <ModulePlaceholder title={pl.navigation.billing}/>)}/>
            <Route path="microservices" element={guarded("/microservices", <MicroserviceStatus/>)}/>
            <Route path="support" element={guarded("/support", <ModulePlaceholder title={pl.navigation.support}/>)}/>
            <Route path="login" element={<LoginPage/>}/>
            <Route path="profile" element={<UserProfile/>}/>
            <Route path="device-pairing" element={guarded("/device-pairing", <DevicePairing/>)}/>
            <Route path="global-configuration" element={guarded("/global-configuration", <GlobalConfiguration/>)}/>
            <Route path="software-configurations" element={guarded("/software-configurations", <SoftwareConfigurationList/>)}/>
        </Routes>
    );
}

export default AppRoutes;
