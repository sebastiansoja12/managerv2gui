import React from 'react';
import './App.css';
import Departments from "./components/Departments";
import {BrowserRouter, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import Navbar from "./components/Navbar/Navbar";
import {AppTabDefinition} from "./components/Navbar/Navbar";
import LoginPage from "./components/LoginPage/LoginPage";
import SoftwareConfigurationList from "./components/SoftwareConfiguration/SoftwareConfigurationList";
import ShipmentList from "./components/Shipment/ShipmentList";
import ShipmentCreate from "./components/Shipment/ShipmentCreate";


const tabTitles: Record<string, string> = {
    "/": "Strona startowa",
    "/shipments": "Lista przesyłek",
    "/shipments/list": "Lista przesyłek",
    "/shipments/create": "Utwórz przesyłkę",
    "/depots": "Oddziały",
    "/parcels": "Lista przesyłek",
    "/login": "Logowanie",
    "/software-configurations": "Software",
};

const normalizePath = (path: string) => path === "/shipments" ? "/shipments/list" : path;

function AppShell() {
    const location = useLocation();
    const navigate = useNavigate();
    const [openTabs, setOpenTabs] = React.useState<AppTabDefinition[]>([
        {label: "Strona startowa", path: "/"},
    ]);

    const activePath = normalizePath(location.pathname);

    const openTab = (tab: AppTabDefinition) => {
        const normalizedTab = {
            ...tab,
            path: normalizePath(tab.path),
        };

        setOpenTabs((currentTabs) => {
            if (currentTabs.some((currentTab) => currentTab.path === normalizedTab.path)) {
                return currentTabs;
            }

            return currentTabs.concat(normalizedTab);
        });
        navigate(normalizedTab.path);
    };

    React.useEffect(() => {
        const label = tabTitles[activePath] || "Nowa karta";
        setOpenTabs((currentTabs) => {
            if (currentTabs.some((tab) => tab.path === activePath)) {
                return currentTabs;
            }

            return currentTabs.concat({label, path: activePath});
        });
    }, [activePath]);

    const closeTab = (path: string) => {
        setOpenTabs((currentTabs) => {
            const nextTabs = currentTabs.filter((tab) => tab.path !== path);
            if (path === activePath) {
                const fallbackTab = nextTabs[nextTabs.length - 1];
                navigate(fallbackTab?.path || "/");
            }

            return nextTabs;
        });
    };

    const closeAllTabs = () => {
        setOpenTabs([]);
        navigate("/");
    };

    return (
        <>
            <Navbar activePath={activePath} onOpenTab={openTab}/>
            <div className="app-tab-strip">
                {openTabs.map((tab) => (
                    <button
                        className={`app-tab${tab.path === activePath ? ' app-tab-active' : ''}`}
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        type="button"
                    >
                        <span>{tab.label}</span>
                        <span
                            className="app-tab-close"
                            onClick={(event) => {
                                event.stopPropagation();
                                closeTab(tab.path);
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            ×
                        </span>
                    </button>
                ))}
                <div className="app-tab-actions">
                    <button className="app-close-tabs-button" onClick={closeAllTabs} type="button">
                        Zamknij wszystkie
                    </button>
                </div>
            </div>
            <div className="app-main-content">
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
        </>
    );
}

function App() {
    return (
        <div className='App'>
            <div className='page-container'>
                <div className='content-wrapper'>
                    <BrowserRouter>
                        <AppShell/>
                    </BrowserRouter>
                </div>
            </div>
        </div>
    );
}

export default App;
