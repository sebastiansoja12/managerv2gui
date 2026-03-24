import React, {useState} from "react";
import {AdminPanelSettings, Shield} from "@mui/icons-material";
import {Alert} from "@mui/material";
import {Navigate, useNavigate} from "react-router-dom";
import {isSuperAdminAuthenticated, setSuperAdminAuthToken} from "../../../auth/SuperAdminAuthTokenStorage";
import SuperAdminAuthService from "../../../hooks/SuperAdminAuthService";
import pl from "../../../i18n/translate";
import {LoginRequest} from "../../LoginPage/model/LoginRequest";

function SuperAdminLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const login = () => {
        const request: LoginRequest = {username, password};
        setLoading(true);
        setError("");

        SuperAdminAuthService.login(request)
            .then((response) => {
                setSuperAdminAuthToken(response.data.authenticationToken);
                navigate("/super-admin/operators", {replace: true});
            })
            .catch(() => setError(pl.superAdmin.login.error))
            .finally(() => setLoading(false));
    };

    if (isSuperAdminAuthenticated()) {
        return <Navigate to="/super-admin/operators" replace/>;
    }

    return (
        <main className="super-admin-login-page">
            <section className="super-admin-login-card">
                <div className="super-admin-login-brand">
                    <span><Shield fontSize="small"/></span>
                    <strong>{pl.superAdmin.brand}</strong>
                </div>
                <div>
                    <span className="super-admin-kicker">{pl.superAdmin.login.kicker}</span>
                    <h1>{pl.superAdmin.login.title}</h1>
                    <p>{pl.superAdmin.login.subtitle}</p>
                </div>
                {error ? <Alert severity="error">{error}</Alert> : null}
                <label>
                    <span>{pl.superAdmin.login.username}</span>
                    <input autoFocus value={username} onChange={(event) => setUsername(event.target.value)}/>
                </label>
                <label>
                    <span>{pl.superAdmin.login.password}</span>
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)}/>
                </label>
                <button className="super-admin-primary-button" disabled={loading || !username || !password} onClick={login} type="button">
                    <AdminPanelSettings fontSize="small"/>
                    <span>{loading ? pl.superAdmin.login.loading : pl.superAdmin.login.submit}</span>
                </button>
            </section>
        </main>
    );
}

export default SuperAdminLogin;
