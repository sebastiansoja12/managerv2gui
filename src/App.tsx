import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './App.css';
import AppShell from "./components/AppShell/AppShell";
import MaintenanceGate from "./components/Maintenance/MaintenanceGate";
import {OperatorCapabilitiesProvider} from "./components/AppShell/OperatorCapabilitiesContext";
import ShipmentEditApplication from "./components/ShipmentEdit/ShipmentEditApplication";
import SubscriptionGate from "./components/Subscription/SubscriptionGate";
import SuperAdminApplication from "./components/SuperAdmin/SuperAdminApplication";
import {AppThemeProvider} from "./theme/ThemeProvider";

function App() {
    return (
        <AppThemeProvider>
            <div className="App">
                <div className="page-container">
                    <div className="content-wrapper">
                        <BrowserRouter>
                            <Routes>
                                <Route path="/super-admin/*" element={<SuperAdminApplication/>}/>
                                <Route path="/shipment-edit" element={<MaintenanceGate><SubscriptionGate><ShipmentEditApplication/></SubscriptionGate></MaintenanceGate>}/>
                                <Route path="/shipment-edit/:trackingNumber" element={<MaintenanceGate><SubscriptionGate><ShipmentEditApplication/></SubscriptionGate></MaintenanceGate>}/>
                                <Route path="/*" element={<MaintenanceGate><OperatorCapabilitiesProvider><SubscriptionGate><AppShell/></SubscriptionGate></OperatorCapabilitiesProvider></MaintenanceGate>}/>
                            </Routes>
                        </BrowserRouter>
                    </div>
                </div>
            </div>
        </AppThemeProvider>
    );
}

export default App;
