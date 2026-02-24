import React, {ChangeEvent, useEffect, useMemo, useState} from "react";
import {Alert, Button, Chip, Snackbar, TextField, Typography} from "@mui/material";
import {Key, Person, Refresh} from "@mui/icons-material";
import AuthService from "../../hooks/AuthService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import "./styles/user-profile.css";

type Notice = {
    severity: "success" | "error";
    message: string;
};

function UserProfile() {
    const [user, setUser] = useState<CurrentUserDto | null>(null);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [repeatPassword, setRepeatPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [notice, setNotice] = useState<Notice | null>(null);


    const permissions = useMemo(() => user?.rolePermissions || [], [user]);

    const showError = React.useCallback((error: unknown, fallbackMessage: string) => {
        const apiError = error as ApiErrorResponse;
        setNotice({severity: "error", message: apiError.message || fallbackMessage});
    }, []);

    const loadProfile = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await AuthService.me();
            setUser(response.data);
        } catch (error) {
            showError(error, "Nie udało się pobrać danych użytkownika");
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const changePassword = async () => {
        if (!currentPassword || !newPassword || !repeatPassword) {
            setNotice({severity: "error", message: "Uzupełnij wszystkie pola hasła"});
            return;
        }

        if (newPassword !== repeatPassword) {
            setNotice({severity: "error", message: "Nowe hasła nie są takie same"});
            return;
        }

        setLoading(true);
        try {
            await AuthService.changePassword({currentPassword, newPassword});
            setCurrentPassword("");
            setNewPassword("");
            setRepeatPassword("");
            setNotice({severity: "success", message: "Hasło zostało zmienione"});
        } catch (error) {
            showError(error, "Nie udało się zmienić hasła");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-profile-page">
            <div className="user-profile-shell">
                <div className="user-profile-header">
                    <div className="user-profile-title">
                        <span className="user-profile-title-icon"><Person /></span>
                        <div>
                            <Typography variant="h4">Mój profil</Typography>
                            <p>Informacje o koncie, roli i permisjach użytkownika.</p>
                        </div>
                    </div>
                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={loadProfile}>
                        Odśwież
                    </Button>
                </div>

                <div className="user-profile-grid">
                    <section className="user-profile-card">
                        <Typography variant="h5">Dane użytkownika</Typography>
                        <div className="user-profile-details">
                            <div>
                                <span>Login</span>
                                <strong>{user?.username || "-"}</strong>
                            </div>
                            <div>
                                <span>Imię i nazwisko</span>
                                <strong>{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "-"}</strong>
                            </div>
                            <div>
                                <span>Email</span>
                                <strong>{user?.email || "-"}</strong>
                            </div>
                            <div>
                                <span>Rola</span>
                                <strong>{user?.role || "-"}</strong>
                            </div>
                            <div>
                                <span>Oddział</span>
                                <strong>{user?.departmentCode || "-"}</strong>
                            </div>
                            <div>
                                <span>ID użytkownika</span>
                                <strong>{user?.userId?.value || "-"}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="user-profile-card">
                        <Typography variant="h5">Zmiana hasła</Typography>
                        <div className="user-profile-password">
                            <TextField
                                fullWidth
                                label="Obecne hasło"
                                size="small"
                                type="password"
                                value={currentPassword}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setCurrentPassword(event.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Nowe hasło"
                                size="small"
                                type="password"
                                value={newPassword}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setNewPassword(event.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Powtórz nowe hasło"
                                size="small"
                                type="password"
                                value={repeatPassword}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setRepeatPassword(event.target.value)}
                            />
                            <Button disabled={loading} startIcon={<Key />} variant="contained" onClick={changePassword}>
                                Zmień hasło
                            </Button>
                        </div>
                    </section>
                </div>

                <section className="user-profile-card user-profile-permissions-card">
                    <Typography variant="h5">Permisje</Typography>
                    <div className="user-profile-permissions">
                        {permissions.length ? permissions.map((permission) => (
                            <Chip key={permission.role} label={permission.role} />
                        )) : <span>Brak przypisanych permisji</span>}
                    </div>
                </section>
            </div>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
}

export default UserProfile;
