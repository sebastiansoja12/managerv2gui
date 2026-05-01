import { createTheme } from '@mui/material';

const appTheme = createTheme({
    palette: {
        primary: {
            main: '#3f86d9',
            dark: '#2f73c4',
            light: '#7fb2ea',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#343434',
            dark: '#141414',
            light: '#70757d',
            contrastText: '#ffffff',
        },
        background: {
            default: '#fafafa',
            paper: '#ffffff',
        },
        text: {
            primary: '#141414',
            secondary: '#70757d',
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 800,
                },
                containedPrimary: {
                    boxShadow: '0 14px 28px rgba(63, 134, 217, 0.2)',
                    '&:hover': {
                        backgroundColor: '#2f73c4',
                        boxShadow: '0 16px 32px rgba(63, 134, 217, 0.26)',
                    },
                },
                outlinedPrimary: {
                    borderColor: '#c7dcf4',
                    color: '#245a9b',
                    '&:hover': {
                        backgroundColor: '#eef6ff',
                        borderColor: '#3f86d9',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3f86d9',
                    },
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    '&.Mui-focused': {
                        color: '#245a9b',
                    },
                },
            },
        },
    },
});

export default appTheme;
