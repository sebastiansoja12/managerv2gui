import React, {ChangeEvent, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Snackbar,
    TextField,
    Typography,
} from "components/ui";
import {Close, ContentCopy, DeleteOutline, Edit, Key, Person, Refresh, Save, SecurityOutlined} from "components/ui/icons";
import AuthService from "../../hooks/AuthService";
import {ApiErrorResponse} from "../../api/ApiResult";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import pl from "../../i18n/translate";
import "./styles/user-profile.css";

type Notice = {
    severity: "success" | "error";
    message: string;
};

export default function UserProfile() {
    const [user, setUser] = useState<CurrentUserDto | null>(null);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [repeatPassword, setRepeatPassword] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [editingFullName, setEditingFullName] = useState<boolean>(false);
    const [fullNameBusy, setFullNameBusy] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [apiKeyBusy, setApiKeyBusy] = useState<boolean>(false);
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
            setFirstName(response.data.firstName || "");
            setLastName(response.data.lastName || "");
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

    const regenerateApiKey = async () => {
        setApiKeyBusy(true);
        try {
            const response = await AuthService.generateApiKey();
            setUser((currentUser) => currentUser ? {...currentUser, apiKey: response.data.apiKey} : currentUser);
            setNotice({severity: "success", message: pl.userProfile.messages.apiKeyGenerated});
        } catch (error) {
            showError(error, pl.userProfile.messages.apiKeyGenerationError);
        } finally {
            setApiKeyBusy(false);
        }
    };

    const startFullNameEditing = () => {
        setFirstName(user?.firstName || "");
        setLastName(user?.lastName || "");
        setEditingFullName(true);
    };

    const cancelFullNameEditing = () => {
        setFirstName(user?.firstName || "");
        setLastName(user?.lastName || "");
        setEditingFullName(false);
    };

    const changeFullName = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedFirstName = firstName.trim();
        const normalizedLastName = lastName.trim();

        if (!normalizedFirstName || !normalizedLastName) {
            setNotice({severity: "error", message: pl.userProfile.messages.fullNameFieldsRequired});
            return;
        }

        setFullNameBusy(true);
        try {
            await AuthService.changeFullName({firstName: normalizedFirstName, lastName: normalizedLastName});
            setUser((currentUser) => currentUser ? {
                ...currentUser,
                firstName: normalizedFirstName,
                lastName: normalizedLastName,
            } : currentUser);
            setFirstName(normalizedFirstName);
            setLastName(normalizedLastName);
            setEditingFullName(false);
            setNotice({severity: "success", message: pl.userProfile.messages.fullNameChanged});
        } catch (error) {
            showError(error, pl.userProfile.messages.fullNameChangeError);
        } finally {
            setFullNameBusy(false);
        }
    };

    const copyApiKey = async () => {
        if (!user?.apiKey) {
            return;
        }

        try {
            if (!navigator.clipboard) {
                throw new Error("Clipboard API is unavailable");
            }
            await navigator.clipboard.writeText(user.apiKey);
            setNotice({severity: "success", message: pl.userProfile.messages.apiKeyCopied});
        } catch (error) {
            showError(error, pl.userProfile.messages.apiKeyCopyError);
        }
    };

    const deleteApiKey = async () => {
        if (!user?.apiKey || !window.confirm(pl.userProfile.messages.apiKeyDeleteConfirmation)) {
            return;
        }

        setApiKeyBusy(true);
        try {
            await AuthService.deleteApiKey();
            setUser((currentUser) => currentUser ? {...currentUser, apiKey: null} : currentUser);
            setNotice({severity: "success", message: pl.userProfile.messages.apiKeyDeleted});
        } catch (error) {
            showError(error, pl.userProfile.messages.apiKeyDeleteError);
        } finally {
            setApiKeyBusy(false);
        }
    };

    return (
        <main className="user-profile-page">
            <div className="user-profile-shell">
                <header className="user-profile-header">
                    <div className="user-profile-heading">
                        <span className="user-profile-kicker"><Person fontSize="small" />{pl.userProfile.kicker}</span>
                        <Typography variant="h4">{pl.userProfile.title}</Typography>
                        <p>{pl.userProfile.subtitle}</p>
                    </div>
                    <Button
                        className="user-profile-refresh-button"
                        disabled={loading}
                        startIcon={<Refresh />}
                        variant="outlined"
                        onClick={loadProfile}
                    >
                        {pl.common.refresh}
                    </Button>
                </header>

                <div className="user-profile-workspace">
                    <section className="user-profile-panel user-profile-identity-panel">
                        <div className="user-profile-panel-header">
                            <span>{pl.userProfile.identityKicker}</span>
                            <Typography variant="h5">{pl.userProfile.userData}</Typography>
                        </div>

                        <div className="user-profile-details">
                            <div className="user-profile-detail">
                                <span>{pl.userProfile.fields.login}</span>
                                <strong>{user?.username || pl.common.dash}</strong>
                            </div>
                            <div className="user-profile-detail user-profile-full-name-summary">
                                <span>{pl.userProfile.fields.fullName}</span>
                                <div>
                                    <strong>{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || pl.common.dash}</strong>
                                    <IconButton
                                        aria-label={pl.userProfile.actions.editFullName}
                                        disabled={loading || fullNameBusy}
                                        size="small"
                                        title={pl.userProfile.actions.editFullName}
                                        onClick={startFullNameEditing}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </div>
                            </div>
                            <div className="user-profile-detail">
                                <span>{pl.userProfile.fields.email}</span>
                                <strong>{user?.email || pl.common.dash}</strong>
                            </div>
                            <div className="user-profile-detail">
                                <span>{pl.userProfile.fields.role}</span>
                                <strong>{user?.role || pl.common.dash}</strong>
                            </div>
                            <div className="user-profile-detail">
                                <span>{pl.userProfile.fields.department}</span>
                                <strong>{user?.departmentCode || pl.common.dash}</strong>
                            </div>
                            <div className="user-profile-detail">
                                <span>{pl.userProfile.fields.language}</span>
                                <strong>{user?.language ? pl.common.languages[user.language as keyof typeof pl.common.languages] : pl.common.dash}</strong>
                            </div>

                            <div className="user-profile-api-key-detail">
                                <div className="user-profile-api-key-label">
                                    <span>{pl.userProfile.fields.apiKey}</span>
                                    <small>{pl.userProfile.apiKeyHelper}</small>
                                </div>
                                <div className="user-profile-api-key-field" data-empty={!user?.apiKey}>
                                    <Key fontSize="small" />
                                    <input
                                        aria-label={pl.userProfile.fields.apiKey}
                                        placeholder={pl.userProfile.apiKeyMissing}
                                        readOnly
                                        type="text"
                                        value={user?.apiKey || ""}
                                    />
                                    <div className="user-profile-api-key-actions">
                                        <IconButton
                                            aria-label={pl.userProfile.actions.regenerateApiKey}
                                            disabled={loading || apiKeyBusy}
                                            title={pl.userProfile.actions.regenerateApiKey}
                                            onClick={regenerateApiKey}
                                        >
                                            <Refresh fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            aria-label={pl.userProfile.actions.copyApiKey}
                                            disabled={!user?.apiKey || apiKeyBusy}
                                            title={pl.userProfile.actions.copyApiKey}
                                            onClick={copyApiKey}
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            aria-label={pl.userProfile.actions.deleteApiKey}
                                            className="user-profile-api-key-delete"
                                            disabled={!user?.apiKey || apiKeyBusy}
                                            title={pl.userProfile.actions.deleteApiKey}
                                            onClick={deleteApiKey}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="user-profile-panel user-profile-security-panel">
                        <div className="user-profile-panel-header">
                            <span><SecurityOutlined fontSize="small" />{pl.userProfile.securityKicker}</span>
                            <Typography variant="h5">{pl.userProfile.changePassword}</Typography>
                        </div>
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

                <section className="user-profile-panel user-profile-permissions-panel">
                    <div className="user-profile-panel-header">
                        <span>{pl.userProfile.permissionsKicker}</span>
                        <Typography variant="h5">{pl.userProfile.permissions}</Typography>
                    </div>
                    <div className="user-profile-permissions">
                        {permissions.length ? permissions.map((permission) => (
                            <Chip key={permission.role} label={permission.role} />
                        )) : <span>{pl.userProfile.noPermissions}</span>}
                    </div>
                </section>
            </div>

            <Dialog
                className="user-profile-full-name-dialog"
                fullWidth
                maxWidth="sm"
                open={editingFullName}
                onClose={fullNameBusy ? undefined : cancelFullNameEditing}
            >
                <form className="user-profile-full-name-form" onSubmit={changeFullName}>
                    <DialogTitle>{pl.userProfile.actions.editFullName}</DialogTitle>
                    <DialogContent>
                        <p className="user-profile-full-name-description">
                            {pl.userProfile.fullNameDialogDescription}
                        </p>
                        <div className="user-profile-full-name-fields">
                            <TextField
                                autoFocus
                                fullWidth
                                label={pl.userProfile.fields.firstName}
                                size="small"
                                value={firstName}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setFirstName(event.target.value)}
                            />
                            <TextField
                                fullWidth
                                label={pl.userProfile.fields.lastName}
                                size="small"
                                value={lastName}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setLastName(event.target.value)}
                            />
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            disabled={fullNameBusy}
                            startIcon={<Close fontSize="small" />}
                            type="button"
                            variant="outlined"
                            onClick={cancelFullNameEditing}
                        >
                            {pl.userProfile.actions.cancelFullName}
                        </Button>
                        <Button
                            disabled={fullNameBusy}
                            startIcon={<Save fontSize="small" />}
                            type="submit"
                            variant="contained"
                        >
                            {pl.userProfile.actions.saveFullName}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </main>
    );
}
