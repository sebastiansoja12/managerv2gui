import React from 'react';
import './App.css';
import Depots from "./components/Depots";
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Navbar from "./components/Navbar/Navbar";
import RouteLogs from "./components/RouteLog/RouteLogs";


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
                                <Route path="depots" element={<Depots/>}/>
                                <Route path="parcels" element={<RouteLogs/>} />
                            </Routes>
                        </div>
                    </BrowserRouter>
                </div>
            </div>
        </div>
    );
}

export default App;
