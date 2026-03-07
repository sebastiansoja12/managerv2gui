import React, {ChangeEvent, useEffect, useMemo, useState} from "react";
import {Alert, Button, Chip, Snackbar, TextField, Typography} from "@mui/material";
import {Key, Person, Refresh} from "@mui/icons-material";
import AuthService from "../../hooks/AuthService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import pl from "../../i18n/translate";
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
            showError(error, pl.userProfile.messages.loadError);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const changePassword = async () => {
        if (!currentPassword || !newPassword || !repeatPassword) {
            setNotice({severity: "error", message: pl.userProfile.messages.passwordFieldsRequired});
            return;
        }

        if (newPassword !== repeatPassword) {
            setNotice({severity: "error", message: pl.userProfile.messages.passwordsMismatch});
            return;
        }

        setLoading(true);
        try {
            await AuthService.changePassword({currentPassword, newPassword});
            setCurrentPassword("");
            setNewPassword("");
            setRepeatPassword("");
            setNotice({severity: "success", message: pl.userProfile.messages.passwordChanged});
        } catch (error) {
            showError(error, pl.userProfile.messages.passwordChangeError);
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
                            <Typography variant="h4">{pl.userProfile.title}</Typography>
                            <p>{pl.userProfile.subtitle}</p>
                        </div>
                    </div>
                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={loadProfile}>
                        {pl.common.refresh}
                    </Button>
                </div>

                <div className="user-profile-grid">
                    <section className="user-profile-card">
                        <Typography variant="h5">{pl.userProfile.userData}</Typography>
                        <div className="user-profile-details">
                            <div>
                                <span>{pl.userProfile.fields.login}</span>
                                <strong>{user?.username || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.userProfile.fields.fullName}</span>
                                <strong>{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.userProfile.fields.email}</span>
                                <strong>{user?.email || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.userProfile.fields.role}</span>
                                <strong>{user?.role || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.userProfile.fields.department}</span>
                                <strong>{user?.departmentCode || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.userProfile.fields.userId}</span>
                                <strong>{user?.userId?.value || pl.common.dash}</strong>
                            </div>
                            <div>
                                <span>{pl.userProfile.fields.language}</span>
                                <strong>{user?.language ? pl.common.languages[user.language as keyof typeof pl.common.languages] : pl.common.dash}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="user-profile-card">
                        <Typography variant="h5">{pl.userProfile.changePassword}</Typography>
                        <div className="user-profile-password">
                            <TextField
                                fullWidth
                                label={pl.userProfile.fields.currentPassword}
                                size="small"
                                type="password"
                                value={currentPassword}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setCurrentPassword(event.target.value)}
                            />
                            <TextField
                                fullWidth
                                label={pl.userProfile.fields.newPassword}
                                size="small"
                                type="password"
                                value={newPassword}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setNewPassword(event.target.value)}
                            />
                            <TextField
                                fullWidth
                                label={pl.userProfile.fields.repeatPassword}
                                size="small"
                                type="password"
                                value={repeatPassword}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setRepeatPassword(event.target.value)}
                            />
                            <Button disabled={loading} startIcon={<Key />} variant="contained" onClick={changePassword}>
                                {pl.userProfile.actions.changePassword}
                            </Button>
                        </div>
                    </section>
                </div>

                <section className="user-profile-card user-profile-permissions-card">
                    <Typography variant="h5">{pl.userProfile.permissions}</Typography>
                    <div className="user-profile-permissions">
                        {permissions.length ? permissions.map((permission) => (
                            <Chip key={permission.role} label={permission.role} />
                        )) : <span>{pl.userProfile.noPermissions}</span>}
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
