import React, { useState } from 'react';
import { Alert, Box, Button, Container, TextField, Typography } from "components/ui";
import AuthService from '../../hooks/AuthService';
import {LoginRequest} from "./model/LoginRequest";
import { useNavigate } from 'react-router-dom';
import {authenticateCurrentUser} from "../../auth/AuthSession";
import pl from "../../i18n/translate";


const Login: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const loginData: LoginRequest = { username, password };
            await AuthService.login(loginData);
            await authenticateCurrentUser();
            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
            setErrorMessage(pl.login.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page grid min-h-screen place-items-center bg-background px-4 py-10">
            <Container maxWidth="xs" className="max-w-md px-0">
                <section className="login-card rounded-3xl border border-border bg-card p-6 text-left shadow-floating sm:p-8">
                    <div className="login-heading mb-7 text-center">
                        <span className="login-brand-mark mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-panel">M</span>
                        <Typography component="h1" variant="h4" className="text-card-foreground">
                            {pl.login.title}
                        </Typography>
                    </div>
                    <Box component="form" noValidate className="grid gap-4">
                    {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
                    <TextField
                        required
                        fullWidth
                        id="username"
                        label={pl.login.username}
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <TextField
                        required
                        fullWidth
                        name="password"
                        label={pl.login.password}
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        type="button"
                        disabled={loading}
                        fullWidth
                        variant="contained"
                        onClick={handleLogin}
                    >
                        {pl.login.submit}
                    </Button>
                </Box>
                </section>
            </Container>
        </main>
    );
};

export default Login;
