import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './App.css';
import AppShell from "./components/AppShell/AppShell";
import SuperAdminApplication from "./components/SuperAdmin/SuperAdminApplication";

function App() {
    return (
        <div className="App">
            <div className="page-container">
                <div className="content-wrapper">
                    <BrowserRouter>
                        <Routes>
                            <Route path="/super-admin/*" element={<SuperAdminApplication/>}/>
                            <Route path="/*" element={<AppShell/>}/>
                        </Routes>
                    </BrowserRouter>
                </div>
            </div>
        </div>
    );
}

export default App;
