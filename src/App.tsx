import React from 'react';
import './App.css';
import Departments from "./components/Departments";
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Navbar from "./components/Navbar/Navbar";
import RouteLogs from "./components/RouteLog/RouteLogs";
import LoginPage from "./components/LoginPage/LoginPage";
import SoftwareConfigurationList from "./components/SoftwareConfiguration/SoftwareConfigurationList";


function App() {
    return (
        <div className='App'>
            <div className='page-container'>
                <div className='content-wrapper'>
                    <BrowserRouter>
                        <Navbar/>
                        <div>
                            <Routes>
                                <Route path="/"/>
                                <Route path="depots" element={<Departments/>}/>
                                <Route path="parcels" element={<RouteLogs/>} />
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
