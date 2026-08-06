import React from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import {initializePlatformOwnerSession, usePlatformOwnerSession} from "./auth/PlatformOwnerSession";
import SuperAdminLogin from "./auth/SuperAdminLogin";
import SuperAdminOperatorsPage from "./operators/SuperAdminOperatorsPage";
import "./styles/super-admin.css";

function SuperAdminApplication() {
    const platformOwnerSession = usePlatformOwnerSession();
    const authenticated = platformOwnerSession.status === "authenticated";

    React.useEffect(() => {
        void initializePlatformOwnerSession();
    }, []);

    if (platformOwnerSession.status === "initializing") {
        return null;
    }

    return (
        <Routes>
            <Route path="login" element={<SuperAdminLogin/>}/>
            <Route
                path="operators"
                element={authenticated ? <SuperAdminOperatorsPage/> : <Navigate to="/super-admin/login" replace/>}
            />
            <Route path="*" element={<Navigate to={authenticated ? "/super-admin/operators" : "/super-admin/login"} replace/>}/>
        </Routes>
    );
}

export default SuperAdminApplication;
