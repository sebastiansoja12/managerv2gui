import React from 'react';
import './App.css';
import Departments from "./components/Departments";
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Navbar from "./components/Navbar/Navbar";
import LoginPage from "./components/LoginPage/LoginPage";
import SoftwareConfigurationList from "./components/SoftwareConfiguration/SoftwareConfigurationList";
import ShipmentList from "./components/Shipment/ShipmentList";
import ShipmentCreate from "./components/Shipment/ShipmentCreate";


function App() {
    return (
        <div className='App'>
            <div className='page-container'>
                <div className='content-wrapper'>
                    <BrowserRouter>
                        <Navbar/>
                        <div>
                            <Routes>
                                <Route path="/" element={<ShipmentList/>}/>
                                <Route path="depots" element={<Departments/>}/>
                                <Route path="parcels" element={<ShipmentList/>} />
                                <Route path="shipments" element={<ShipmentList/>} />
                                <Route path="shipments/list" element={<ShipmentList/>} />
                                <Route path="shipments/create" element={<ShipmentCreate/>} />
                                <Route path="login" element={<LoginPage/>} />
                                <Route path="software-configurations" element={<SoftwareConfigurationList/>} />
                            </Routes>
                        </div>
                    </BrowserRouter>
                </div>
            </div>
        </div>
    );
}

export default App;
