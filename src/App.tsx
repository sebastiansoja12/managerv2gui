import React from 'react';
import {BrowserRouter} from 'react-router-dom';
import './App.css';
import AppShell from "./components/AppShell/AppShell";

function App() {
    return (
        <div className="App">
            <div className="page-container">
                <div className="content-wrapper">
                    <BrowserRouter>
                        <AppShell/>
                    </BrowserRouter>
                </div>
            </div>
        </div>
    );
}

export default App;
