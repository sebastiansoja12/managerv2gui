import React from 'react';
import { ThemeProvider } from '@mui/material';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './App.css';
import AppShell from "./components/AppShell/AppShell";
import SuperAdminApplication from "./components/SuperAdmin/SuperAdminApplication";
import appTheme from "./theme/appTheme";

function App() {
    return (
        <ThemeProvider theme={appTheme}>
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
        </ThemeProvider>
    );
}

export default App;
