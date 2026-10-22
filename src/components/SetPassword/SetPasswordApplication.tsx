import React, {FormEvent, useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {Alert, Button, TextField, Typography} from "components/ui";
import {Key, LocalShipping} from "components/ui/icons";
import {ApiErrorResponse} from "../../api/ApiResult";
import UserInvitationService from "../../hooks/UserInvitationService";
import pl from "../../i18n/translate";
import {UserInvitation, UserInvitationErrorCode} from "./dto/UserInvitation";
import "../ShipmentEdit/styles/shipment-edit.css";
import "./styles/set-password.css";

export const MIN_PASSWORD_LENGTH = 8;

type SetPasswordStep = "loading" | "form" | "done" | "invalid";

export const resolveInvitationError = (error: unknown): string => {
    const apiError = error as ApiErrorResponse;
    const code = (apiError?.details as {code?: UserInvitationErrorCode} | undefined)?.code;
    const messages = pl.setPassword.errors;
    switch (code) {
        case "EXPIRED":
            return messages.expired;
        case "ALREADY_ACCEPTED":
            return messages.alreadyAccepted;
        case "WEAK_PASSWORD":
            return messages.weakPassword;
        case "INVITATION_NOT_FOUND":
            return messages.notFound;
        default:
            return apiError?.status === 404 ? messages.notFound : messages.generic;
    }
};

function SetPasswordApplication() {
    const translations = pl.setPassword;
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [invitation, setInvitation] = useState<UserInvitation | null>(null);
    const [step, setStep] = useState<SetPasswordStep>(token ? "loading" : "invalid");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState(token ? "" : translations.errors.notFound);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!token) {
            return;
        }
        UserInvitationService.verify(token)
            .then((response) => {
                setInvitation(response.data);
                setStep("form");
            })
            .catch((exception: unknown) => {
                setError(resolveInvitationError(exception));
                setStep("invalid");
            });
    }, [token]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(translations.errors.weakPassword);
            return;
        }
        if (password !== passwordConfirmation) {
            setError(translations.errors.mismatch);
            return;
        }
        setSaving(true);
        setError("");
        UserInvitationService.accept({token, password})
            .then(() => setStep("done"))
            .catch((exception: unknown) => setError(resolveInvitationError(exception)))
            .finally(() => setSaving(false));
    };

    return (
        <main className="shipment-edit-page login-page grid min-h-screen place-items-center bg-background px-4 py-10">
            <section className="shipment-edit-card login-card rounded-3xl border border-border bg-card p-6 text-left shadow-floating sm:p-8">
                <header className="shipment-edit-header">
                    <span className="shipment-edit-brand"><LocalShipping /></span>
                    <div>
                        <Typography component="h1" variant="h4">{translations.title}</Typography>
                        <p>{translations.subtitle}</p>
                    </div>
                </header>

                {step === "loading" ? <p className="shipment-edit-hint">{translations.loading}</p> : null}
                {error ? <Alert severity="error">{error}</Alert> : null}

                {step === "form" && invitation ? (
                    <form className="set-password-form" onSubmit={submit} noValidate>
                        <div className="shipment-edit-meta">
                            <span>{translations.username}</span>
                            <code>{invitation.username}</code>
                        </div>
                        <TextField
                            autoComplete="new-password"
                            disabled={saving}
                            fullWidth
                            helperText={translations.passwordHint.replace("{min}", String(MIN_PASSWORD_LENGTH))}
                            label={translations.password}
                            required
                            type="password"
                            value={password}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                        />
                        <TextField
                            autoComplete="new-password"
                            disabled={saving}
                            fullWidth
                            label={translations.passwordConfirmation}
                            required
                            type="password"
                            value={passwordConfirmation}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPasswordConfirmation(event.target.value)}
                        />
                        <Button disabled={saving} startIcon={<Key />} type="submit" variant="contained">
                            {saving ? translations.saving : translations.submit}
                        </Button>
                    </form>
                ) : null}

                {step === "done" ? (
                    <>
                        <Alert severity="success">{translations.success}</Alert>
                        <Button variant="contained" onClick={() => window.location.assign("/login")}>
                            {translations.goToLogin}
                        </Button>
                    </>
                ) : null}
            </section>
        </main>
    );
}

export default SetPasswordApplication;
