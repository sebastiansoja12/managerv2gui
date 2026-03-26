import React from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import {isSuperAdminAuthenticated} from "../../auth/SuperAdminAuthTokenStorage";
import SuperAdminLogin from "./auth/SuperAdminLogin";
import SuperAdminOperatorsPage from "./operators/SuperAdminOperatorsPage";
import "./styles/super-admin.css";

function SuperAdminApplication() {
    return (
        <Routes>
            <Route path="login" element={<SuperAdminLogin/>}/>
            <Route
                path="operators"
                element={isSuperAdminAuthenticated() ? <SuperAdminOperatorsPage/> : <Navigate to="/super-admin/login" replace/>}
            />
            <Route path="*" element={<Navigate to={isSuperAdminAuthenticated() ? "/super-admin/operators" : "/super-admin/login"} replace/>}/>
        </Routes>
    );
}

export default SuperAdminApplication;
