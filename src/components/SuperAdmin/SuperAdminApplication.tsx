import React from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import {initializeAuthSession} from "../../auth/AuthSession";
import {useAuthState} from "../../auth/AuthState";
import SuperAdminLogin from "./auth/SuperAdminLogin";
import SuperAdminOperatorsPage from "./operators/SuperAdminOperatorsPage";
import "./styles/super-admin.css";

function SuperAdminApplication() {
    const authState = useAuthState();
    const authenticated = authState.status === "authenticated";

    React.useEffect(() => {
        void initializeAuthSession();
    }, []);

    if (authState.status === "initializing") {
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
