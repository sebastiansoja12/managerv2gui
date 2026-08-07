import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {Construction, Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import PlatformSystemService from "../../../hooks/PlatformSystemService";
import pl from "../../../i18n/translate";
import {MaintenanceMode} from "./model/SystemStatus";

const MAX_MESSAGE_LENGTH = 500;

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return "";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

function MaintenancePanel() {
    const texts = pl.superAdmin.maintenance;
    const [maintenance, setMaintenance] = useState<MaintenanceMode | null>(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        PlatformSystemService.getMaintenance()
            .then((currentMaintenance) => {
                setMaintenance(currentMaintenance);
                setMessage(currentMaintenance.message || "");
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [texts.loadError]);

    const enabled = Boolean(maintenance?.enabled);

    const save = (nextEnabled: boolean) => {
        setSaving(true);
        setError("");
        setSaved(false);
        PlatformSystemService.updateMaintenance({enabled: nextEnabled, message: message.trim()})
            .then((savedMaintenance) => {
                setMaintenance(savedMaintenance);
                setMessage(savedMaintenance.message || "");
                setSaved(true);
                setConfirmOpen(false);
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.saveError)))
            .finally(() => setSaving(false));
    };

    const submitMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        save(enabled);
    };

    return (
        <section className="super-admin-module-section">
            <div className="super-admin-module-heading">
                <span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span>
                <h2>{texts.title}</h2>
                <p>{texts.subtitle}</p>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {saved ? <Alert severity="success">{enabled ? texts.enabledNotice : texts.disabledNotice}</Alert> : null}

            <article className={`super-admin-maintenance-card ${enabled ? "is-enabled" : ""}`}>
                <span className="super-admin-maintenance-icon"><Construction /></span>
                <div>
                    <span className="super-admin-access-card-label">{texts.state}</span>
                    <strong>{loading ? pl.common.dash : enabled ? texts.enabled : texts.disabled}</strong>
                    <p>{enabled ? texts.enabledHint : texts.disabledHint}</p>
                    {maintenance?.updatedBy ? (
                        <small>{texts.updatedBy.replace("{user}", `@${maintenance.updatedBy}`).replace("{time}", formatDateTime(maintenance.updatedAt))}</small>
                    ) : null}
                </div>
                <button
                    className={enabled ? "super-admin-primary-button" : "super-admin-danger-button"}
                    disabled={loading || saving}
                    onClick={() => (enabled ? save(false) : setConfirmOpen(true))}
                    type="button"
                >
                    {enabled ? texts.disable : texts.enable}
                </button>
            </article>

            <form className="super-admin-announcement-panel" onSubmit={submitMessage}>
                <label>
                    <span>{texts.message}</span>
                    <textarea
                        maxLength={MAX_MESSAGE_LENGTH}
                        onChange={(event) => {
                            setMessage(event.target.value);
                            setSaved(false);
                        }}
                        placeholder={texts.messagePlaceholder}
                        rows={4}
                        value={message}
                    />
                </label>
                <div className="super-admin-announcement-footer">
                    <span>{texts.scope} · {message.length}/{MAX_MESSAGE_LENGTH}</span>
                    <div>
                        <button className="super-admin-secondary-button" disabled={loading || saving} type="submit">
                            <Save fontSize="small" />{texts.saveMessage}
                        </button>
                    </div>
                </div>
            </form>

            <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={confirmOpen} onClose={saving ? undefined : () => setConfirmOpen(false)}>
                <DialogTitle>{texts.confirmTitle}</DialogTitle>
                <DialogContent>
                    <p className="super-admin-impersonation-description">{texts.confirmDescription}</p>
                </DialogContent>
                <DialogActions>
                    <button className="super-admin-secondary-button" disabled={saving} onClick={() => setConfirmOpen(false)} type="button">{texts.cancel}</button>
                    <button className="super-admin-danger-button" disabled={saving} onClick={() => save(true)} type="button">
                        {saving ? texts.saving : texts.enable}
                    </button>
                </DialogActions>
            </Dialog>
        </section>
    );
}

export default MaintenancePanel;
