import React, { useState } from 'react';
import { Box, Button, Container, TextField, Typography } from '@mui/material';
import AuthService from '../../hooks/AuthService';
import {LoginRequest} from "./model/LoginRequest";
import { useNavigate } from 'react-router-dom';


const Login: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const loginData: LoginRequest = { username, password };
            const response = await AuthService.login(loginData);

            const authToken = response.data.authenticationToken;
            localStorage.setItem('authToken', authToken);
        } catch (error) {
            console.error('Login failed:', error);
        }

        localStorage.setItem('logged', String(true));
        navigate('/');
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
                    Login
                </Typography>
                <Box component="form" noValidate sx={{ mt: 1 }}>
                    {/* Username Input */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    {/* Password Input */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* Login Button */}
                    <Button
                        type="button"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        onClick={handleLogin}
                    >
                        Login
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;
