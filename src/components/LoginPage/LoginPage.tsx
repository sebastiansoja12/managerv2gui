import React, { useState } from 'react';
import { Alert, Box, Button, Container, TextField, Typography } from '@mui/material';
import AuthService from '../../hooks/AuthService';
import {LoginRequest} from "./model/LoginRequest";
import { useNavigate } from 'react-router-dom';
import {setAuthToken} from "../../auth/AuthTokenStorage";
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
            const response = await AuthService.login(loginData);

            const authToken = response.data.authenticationToken;
            setAuthToken(authToken);
            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
            setErrorMessage(pl.login.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    {pl.login.title}
                </Typography>
                <Box component="form" noValidate sx={{ mt: 1 }}>
                    {errorMessage ? <Alert severity="error" sx={{mb: 2}}>{errorMessage}</Alert> : null}
                    <TextField
                        margin="normal"
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
                        margin="normal"
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
                        sx={{ mt: 3, mb: 2 }}
                        onClick={handleLogin}
                    >
                        {pl.login.submit}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;
