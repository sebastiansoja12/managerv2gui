import React, {FormEvent, useCallback, useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {Add, Block, CheckCircle, Key, Refresh} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import PlatformOwnerAccountService from "../../../hooks/PlatformOwnerAccountService";
import pl from "../../../i18n/translate";
import {usePlatformOwnerSession} from "../auth/PlatformOwnerSession";
import {
    CreatePlatformOwnerRequest,
    createEmptyPlatformOwnerRequest,
    PlatformOwnerAccount,
} from "./model/PlatformOwnerAccount";

const createFields = [
    ["firstName", pl.superAdmin.owners.firstName, "text"],
    ["lastName", pl.superAdmin.owners.lastName, "text"],
    ["username", pl.superAdmin.owners.username, "text"],
    ["email", pl.superAdmin.owners.email, "email"],
    ["password", pl.superAdmin.owners.password, "password"],
] as const;

const initials = (owner: PlatformOwnerAccount) => (
    `${owner.firstName?.[0] || ""}${owner.lastName?.[0] || ""}`.toUpperCase() || "PO"
);

function PlatformOwnersPanel() {
    const {platformOwner} = usePlatformOwnerSession();
    const [owners, setOwners] = useState<PlatformOwnerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [createRequest, setCreateRequest] = useState<CreatePlatformOwnerRequest>(createEmptyPlatformOwnerRequest());
    const [passwordOwner, setPasswordOwner] = useState<PlatformOwnerAccount | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [dialogError, setDialogError] = useState("");

    const loadOwners = useCallback(() => {
        setLoading(true);
        setError("");
        PlatformOwnerAccountService.getAll()
            .then(setOwners)
            .catch((requestError) => setError(getBackendErrorMessage(requestError, pl.superAdmin.owners.loadError)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadOwners();
    }, [loadOwners]);

    const isCurrentOwner = (owner: PlatformOwnerAccount) => String(owner.platformOwnerId) === String(platformOwner?.platformOwnerId);

    const toggleBlocked = (owner: PlatformOwnerAccount) => {
        setError("");
        const request = owner.active
            ? PlatformOwnerAccountService.block(owner.platformOwnerId)
            : PlatformOwnerAccountService.unblock(owner.platformOwnerId);
        request.then(loadOwners)
            .catch((requestError) => setError(getBackendErrorMessage(requestError, pl.superAdmin.owners.saveError)));
    };

    const openCreate = () => {
        setCreateRequest(createEmptyPlatformOwnerRequest());
        setDialogError("");
        setCreateOpen(true);
    };

    const openPasswordChange = (owner: PlatformOwnerAccount) => {
        setNewPassword("");
        setDialogError("");
        setPasswordOwner(owner);
    };

    const submitCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setDialogError("");
        PlatformOwnerAccountService.create(createRequest)
            .then(() => {
                setCreateOpen(false);
                loadOwners();
            })
            .catch((requestError) => setDialogError(getBackendErrorMessage(requestError, pl.superAdmin.owners.saveError)))
            .finally(() => setSaving(false));
    };

    const submitPassword = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!passwordOwner) {
            return;
        }
        setSaving(true);
        setDialogError("");
        PlatformOwnerAccountService.changePassword(passwordOwner.platformOwnerId, {password: newPassword})
            .then(() => setPasswordOwner(null))
            .catch((requestError) => setDialogError(getBackendErrorMessage(requestError, pl.superAdmin.owners.saveError)))
            .finally(() => setSaving(false));
    };

    return (
        <section className="super-admin-module-section">
            <div className="super-admin-module-heading super-admin-module-heading-actions">
                <div>
                    <span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span>
                    <h2>{pl.superAdmin.owners.title}</h2>
                    <p>{pl.superAdmin.owners.subtitle}</p>
                </div>
                <div className="super-admin-module-heading-buttons">
                    <button aria-label={pl.superAdmin.audit.refresh} className="super-admin-icon-button" disabled={loading} onClick={loadOwners} type="button">
                        <Refresh fontSize="small" />
                    </button>
                    <button className="super-admin-primary-button" onClick={openCreate} type="button">
                        <Add fontSize="small" /><span>{pl.superAdmin.owners.add}</span>
                    </button>
                </div>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <div className="super-admin-directory-table super-admin-member-table">
                <div className="super-admin-directory-row super-admin-directory-head super-admin-owner-row">
                    <span>{pl.superAdmin.owners.name}</span>
                    <span>{pl.superAdmin.owners.email}</span>
                    <span>{pl.superAdmin.owners.status}</span>
                    <span>{pl.superAdmin.owners.actions}</span>
                </div>
                {owners.map((owner) => (
                    <div className="super-admin-directory-row super-admin-owner-row" key={owner.platformOwnerId}>
                        <span className="super-admin-member-person">
                            <span className="super-admin-member-avatar super-admin-member-avatar-superadmin">{initials(owner)}</span>
                            <span className="super-admin-member-name">
                                <strong>
                                    {`${owner.firstName} ${owner.lastName}`.trim() || owner.username}
                                    {isCurrentOwner(owner) ? <em className="super-admin-owner-you">{pl.superAdmin.owners.you}</em> : null}
                                </strong>
                                <small>@{owner.username}</small>
                            </span>
                        </span>
                        <span className="super-admin-member-email" title={owner.email}>{owner.email}</span>
                        <span className={`super-admin-member-role ${owner.active ? "super-admin-member-role-supplier" : "super-admin-member-role-admin"}`}>
                            {owner.active ? pl.superAdmin.owners.active : pl.superAdmin.owners.blocked}
                        </span>
                        <span className="super-admin-owner-actions">
                            <button className="super-admin-secondary-button super-admin-compact-button" onClick={() => openPasswordChange(owner)} type="button">
                                <Key fontSize="small" /><span>{pl.superAdmin.owners.changePassword}</span>
                            </button>
                            <button
                                className="super-admin-secondary-button super-admin-compact-button"
                                disabled={isCurrentOwner(owner)}
                                onClick={() => toggleBlocked(owner)}
                                type="button"
                            >
                                {owner.active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                                <span>{owner.active ? pl.superAdmin.owners.block : pl.superAdmin.owners.unblock}</span>
                            </button>
                        </span>
                    </div>
                ))}
                {!loading && !owners.length ? <div className="super-admin-directory-empty">{pl.superAdmin.owners.empty}</div> : null}
            </div>

            <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={createOpen} onClose={saving ? undefined : () => setCreateOpen(false)}>
                <form onSubmit={submitCreate}>
                    <DialogTitle>{pl.superAdmin.owners.createTitle}</DialogTitle>
                    <DialogContent>
                        {dialogError ? <Alert severity="error" sx={{mb: 2}}>{dialogError}</Alert> : null}
                        <div className="super-admin-form-grid">
                            {createFields.map(([key, label, type], index) => (
                                <label key={key}>
                                    <span>{label}</span>
                                    <input
                                        autoComplete={type === "password" ? "new-password" : "off"}
                                        autoFocus={index === 0}
                                        required
                                        type={type}
                                        value={createRequest[key]}
                                        onChange={(event) => setCreateRequest((current) => ({...current, [key]: event.target.value}))}
                                    />
                                </label>
                            ))}
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <button className="super-admin-secondary-button" disabled={saving} onClick={() => setCreateOpen(false)} type="button">{pl.superAdmin.owners.cancel}</button>
                        <button className="super-admin-primary-button" disabled={saving} type="submit">{saving ? pl.superAdmin.owners.saving : pl.superAdmin.owners.save}</button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog className="super-admin-dialog" fullWidth maxWidth="xs" open={Boolean(passwordOwner)} onClose={saving ? undefined : () => setPasswordOwner(null)}>
                <form onSubmit={submitPassword}>
                    <DialogTitle>{pl.superAdmin.owners.passwordTitle}</DialogTitle>
                    <DialogContent>
                        <p className="super-admin-directory-context">@{passwordOwner?.username}</p>
                        {dialogError ? <Alert severity="error" sx={{mb: 2}}>{dialogError}</Alert> : null}
                        <label className="super-admin-owner-password-field">
                            <span>{pl.superAdmin.owners.newPassword}</span>
                            <input autoComplete="new-password" autoFocus required type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                        </label>
                    </DialogContent>
                    <DialogActions>
                        <button className="super-admin-secondary-button" disabled={saving} onClick={() => setPasswordOwner(null)} type="button">{pl.superAdmin.owners.cancel}</button>
                        <button className="super-admin-primary-button" disabled={saving || !newPassword} type="submit">{saving ? pl.superAdmin.owners.saving : pl.superAdmin.owners.save}</button>
                    </DialogActions>
                </form>
            </Dialog>
        </section>
    );
}

export default PlatformOwnersPanel;
