import React from "react";
import {Route, Routes} from "react-router-dom";
import OrganizationChat from "../Chat/OrganizationChat";
import Couriers from "../Couriers/Couriers";
import CourierDetails from "../Couriers/CourierDetails";
import Deliveries from "../Deliveries/Deliveries";
import DeliveryEdit from "../Deliveries/DeliveryEdit";
import Departments from "../Departments";
import DevicePairing from "../Devices/DevicePairing";
import GlobalConfiguration from "../GlobalConfiguration/GlobalConfiguration";
import OperationalDashboard from "../Home/OperationalDashboard";
import ModulePlaceholder from "../Home/ModulePlaceholder";
import LoginPage from "../LoginPage/LoginPage";
import ProcessDetails from "../Process/ProcessDetails";
import Processes from "../Process/Processes";
import PalletCreate from "../Pallets/PalletCreate";
import PalletCreateFromShipments from "../Pallets/PalletCreateFromShipments";
import PalletDetailsView from "../Pallets/PalletDetailsView";
import PalletList from "../Pallets/PalletList";
import PalletScanner from "../Pallets/PalletScanner";
import CarrierList from "../Carriers/CarrierList";
import DriverList from "../Carriers/DriverList";
import CarrierDetailsView from "../Carriers/CarrierDetailsView";
import DriverDetailsView from "../Carriers/DriverDetailsView";
import PickupPointCatalog from "../PickupPoints/PickupPointCatalog";
import Returns from "../Returns/Returns";
import ShipmentCreate from "../Shipment/ShipmentCreate";
import ShipmentDetails from "../Shipment/ShipmentDetails";
import ShipmentHistoryDetails from "../Shipment/ShipmentHistoryDetails";
import ShipmentList from "../Shipment/ShipmentList";
import ShipmentScanner from "../ShipmentScanner/ShipmentScanner";
import UserProfile from "../UserProfile/UserProfile";
import UsersPage from "../Users/UsersPage";
import {isPathAllowedForProfile, OperationalProfile} from "../../config/operationalProfile";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "./types";
import {useOperatorCapabilities} from "./OperatorCapabilitiesContext";

type AppRoutesProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
    operationalProfile?: OperationalProfile;
};

function AppRoutes({onOpenTab, operationalProfile = "warehouse"}: AppRoutesProps) {
    const {returnsStatus} = useOperatorCapabilities();
    const guarded = (path: string, element: React.ReactElement) => (
        isPathAllowedForProfile(path, operationalProfile)
            ? element
            : <ModulePlaceholder forbidden title={pl.modules.placeholder.forbiddenTitle}/>
    );
    const guardedReturns = (element: React.ReactElement) => (
        returnsStatus === "loading" ? null
            : returnsStatus === "available" ? guarded("/returns", element)
                : <ModulePlaceholder description={pl.modules.placeholder.returnDisabledDescription}
                                     forbidden title={pl.modules.placeholder.forbiddenTitle}/>
    );

    return (
        <Routes>
            <Route path="/" element={<OperationalDashboard onOpenTab={onOpenTab}/>}/>
            <Route path="depots" element={guarded("/depots", <Departments/>)}/>
            <Route path="pickup-points" element={guarded("/pickup-points", <PickupPointCatalog/>)}/>
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
            <Route path="returns" element={guardedReturns(<Returns onOpenTab={onOpenTab}/>)}/>
            <Route path="deliveries" element={guarded("/deliveries", <Deliveries/>)}/>
            <Route path="deliveries/:deliveryId/edit" element={guarded("/deliveries/1/edit", <DeliveryEdit/>)}/>
            <Route path="returns/:returnId" element={guardedReturns(<Returns onOpenTab={onOpenTab}/>)}/>
            <Route path="couriers" element={guarded("/couriers", <Couriers/>)}/>
            <Route path="couriers/:supplierCode" element={guarded("/couriers", <CourierDetails/>)}/>
            <Route path="vehicles" element={guarded("/vehicles", <ModulePlaceholder title={pl.home.tiles.vehicles.title}/>)}/>
            <Route path="pallets" element={guarded("/pallets", <PalletList onOpenTab={onOpenTab} variant="all"/>)}/>
            <Route path="pallets/scan" element={guarded("/pallets/scan", <PalletScanner onOpenTab={onOpenTab}/>)}/>
            <Route path="pallets/create" element={guarded("/pallets/create", <PalletCreate onOpenTab={onOpenTab}/>)}/>
            <Route path="pallets/create-from-shipments" element={guarded("/pallets/create-from-shipments", <PalletCreateFromShipments onOpenTab={onOpenTab}/>)}/>
            <Route path="pallets/cancelled" element={guarded("/pallets/cancelled", <PalletList key="cancelled" onOpenTab={onOpenTab} variant="cancelled"/>)}/>
            <Route path="pallets/empty" element={guarded("/pallets/empty", <PalletList key="empty" onOpenTab={onOpenTab} variant="empty"/>)}/>
            <Route path="carriers" element={guarded("/carriers", <CarrierList onOpenTab={onOpenTab}/>)}/>
            <Route path="carriers/:carrierId" element={guarded("/carriers/1", <CarrierDetailsView onOpenTab={onOpenTab}/>)}/>
            <Route path="drivers" element={guarded("/drivers", <DriverList onOpenTab={onOpenTab}/>)}/>
            <Route path="drivers/:driverId" element={guarded("/drivers/1", <DriverDetailsView onOpenTab={onOpenTab}/>)}/>
            <Route path="pallets/tracking/:trackingNumber" element={guarded("/pallets/tracking/1", <PalletDetailsView onOpenTab={onOpenTab}/>)}/>
            <Route path="shipment-scanner" element={guarded("/shipment-scanner", <ShipmentScanner/>)}/>
            <Route path="courier-deliveries" element={guarded("/courier-deliveries", <ModulePlaceholder title={pl.home.tiles.courierDeliveries.title}/>)}/>
            <Route path="suppliers" element={guarded("/suppliers", <ModulePlaceholder title={pl.navigation.suppliers}/>)}/>
            <Route path="users" element={guarded("/users", <UsersPage/>)}/>
            <Route path="chat" element={guarded("/chat", <OrganizationChat/>)}/>
            <Route path="deals" element={guarded("/deals", <ModulePlaceholder title={pl.navigation.deals}/>)}/>
            <Route path="billing" element={guarded("/billing", <ModulePlaceholder title={pl.navigation.billing}/>)}/>
            <Route path="support" element={guarded("/support", <ModulePlaceholder title={pl.navigation.support}/>)}/>
            <Route path="login" element={<LoginPage/>}/>
            <Route path="profile" element={<UserProfile/>}/>
            <Route path="device-pairing" element={guarded("/device-pairing", <DevicePairing/>)}/>
            <Route path="global-configuration" element={guarded("/global-configuration", <GlobalConfiguration/>)}/>
        </Routes>
    );
}

export default AppRoutes;
