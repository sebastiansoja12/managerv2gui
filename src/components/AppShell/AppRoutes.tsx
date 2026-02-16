import {Route, Routes} from "react-router-dom";
import Departments from "../Departments";
import LoginPage from "../LoginPage/LoginPage";
import ShipmentCreate from "../Shipment/ShipmentCreate";
import ShipmentList from "../Shipment/ShipmentList";
import SoftwareConfigurationList from "../SoftwareConfiguration/SoftwareConfigurationList";
import UserProfile from "../UserProfile/UserProfile";

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<ShipmentList/>}/>
            <Route path="depots" element={<Departments/>}/>
            <Route path="parcels" element={<ShipmentList/>}/>
            <Route path="shipments" element={<ShipmentList/>}/>
            <Route path="shipments/list" element={<ShipmentList/>}/>
            <Route path="shipments/create" element={<ShipmentCreate/>}/>
            <Route path="login" element={<LoginPage/>}/>
            <Route path="profile" element={<UserProfile/>}/>
            <Route path="software-configurations" element={<SoftwareConfigurationList/>}/>
        </Routes>
    );
}

export default AppRoutes;
