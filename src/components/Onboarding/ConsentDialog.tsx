import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {SecurityOutlined} from "components/ui/icons";
import pl from "../../i18n/translate";
import {ConsentType, UserOnboarding} from "./model/UserOnboarding";

type ConsentDialogProps = {
    onboarding: UserOnboarding;
    saving: boolean;
    error?: string;
    onAccept: (acceptedConsents: ConsentType[]) => void;
    onLogout: () => void;
};

function ConsentDialog({onboarding, saving, error, onAccept, onLogout}: ConsentDialogProps) {
    const [acceptedConsents, setAcceptedConsents] = useState<ConsentType[]>([]);

    useEffect(() => {
        setAcceptedConsents(onboarding.consents
            .filter((consent) => consent.accepted)
            .map((consent) => consent.type));
    }, [onboarding]);

    const toggleConsent = (consentType: ConsentType, checked: boolean) => {
        setAcceptedConsents((currentConsents) => checked
            ? [...currentConsents.filter((type) => type !== consentType), consentType]
            : currentConsents.filter((type) => type !== consentType));
    };

    const allRequiredAccepted = onboarding.consents
        .filter((consent) => consent.required)
        .every((consent) => acceptedConsents.includes(consent.type));

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (allRequiredAccepted) {
            onAccept(acceptedConsents);
        }
    };

    return (
        <Dialog className="onboarding-consent-dialog" fullWidth maxWidth="md" open>
            <form onSubmit={submit}>
                <DialogTitle className="onboarding-dialog-title">
                    <span className="onboarding-dialog-icon"><SecurityOutlined /></span>
                    <span>
                        <span className="onboarding-dialog-kicker">{pl.onboarding.consents.kicker}</span>
                        <strong>{pl.onboarding.consents.title}</strong>
                    </span>
                </DialogTitle>
                <DialogContent className="onboarding-consent-content">
                    <p className="onboarding-consent-description">{pl.onboarding.consents.description}</p>
                    {error ? <Alert severity="error">{error}</Alert> : null}
                    <ul className="onboarding-consent-list">
                        {onboarding.consents.map((consent) => {
                            const inputId = `onboarding-consent-${consent.type}`;
                            return (
                                <li className="onboarding-consent-item" key={consent.type}>
                                    <Checkbox
                                        checked={acceptedConsents.includes(consent.type)}
                                        disabled={saving}
                                        id={inputId}
                                        onChange={(event) => toggleConsent(consent.type, event.target.checked)}
                                    />
                                    <label htmlFor={inputId}>
                                        <strong>
                                            {pl.onboarding.consents.types[consent.type].title}
                                            {consent.required
                                                ? <span className="onboarding-consent-required">{pl.onboarding.consents.required}</span>
                                                : <span className="onboarding-consent-optional">{pl.onboarding.consents.optional}</span>}
                                        </strong>
                                        <span>{pl.onboarding.consents.types[consent.type].description}</span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                    <small className="onboarding-consent-version">
                        {pl.onboarding.consents.version.replace("{version}", onboarding.consentVersion)}
                    </small>
                </DialogContent>
                <DialogActions className="onboarding-dialog-actions">
                    <Button disabled={saving} onClick={onLogout} variant="outlined">{pl.onboarding.consents.logout}</Button>
                    <Button disabled={saving || !allRequiredAccepted} type="submit">
                        {saving ? pl.onboarding.consents.saving : pl.onboarding.consents.accept}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default ConsentDialog;
