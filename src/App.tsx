import React from 'react';
import './App.css';
import Depots from "./components/Depots";
import {BrowserRouter, Route, Routes} from 'react-router-dom';


function App() {
    return (
        <div className='App'>
            <div className='page-container'>
                <div className='content-wrapper'>
                    <BrowserRouter>
                        <div>
                            <Routes>
                                <Route path="/"/>
                                <Route path="depots" element={<Depots/>}/>
                            </Routes>
                        </div>
                    </BrowserRouter>
                </div>
            </div>
        </div>
    );
}

export default App;
