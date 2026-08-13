import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './App.css';
import AppShell from "./components/AppShell/AppShell";
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
                                <Route path="/*" element={<AppShell/>}/>
                            </Routes>
                        </BrowserRouter>
                    </div>
                </div>
            </div>
        </AppThemeProvider>
    );
}

export default App;
