import React from 'react';
import {
    AppBar,
    Avatar,
    Box,
    Container,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    AccountCircle,
    AltRoute,
    ArrowDropDown,
    FormatListBulleted,
    Dashboard,
    Groups,
    LocalShipping,
    Login,
    Logout,
    Menu as MenuIcon,
    Person,
    PrecisionManufacturing,
    SettingsSuggest,
    Storefront,
} from '@mui/icons-material';
import {NavLink, useLocation} from 'react-router-dom';
import './styles/main.css';

type NavigationItem = {
    label: string;
    path: string;
    icon: React.ElementType;
};

const navigationItems: NavigationItem[] = [
    {label: 'Routes', path: '/routes', icon: AltRoute},
    {label: 'Depots', path: '/depots', icon: Storefront},
    {label: 'Software', path: '/software-configurations', icon: SettingsSuggest},
    {label: 'Suppliers', path: '/suppliers', icon: PrecisionManufacturing},
    {label: 'Users', path: '/users', icon: Groups},
];

const shipmentMenuItems: NavigationItem[] = [
    {label: 'Lista przesyłek', path: '/shipments/list', icon: FormatListBulleted},
    {label: 'Utwórz przesyłkę', path: '/shipments/create', icon: LocalShipping},
];

const isUserLoggedIn = () => localStorage.getItem('logged');

function ResponsiveAppBar() {
    const location = useLocation();
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
    const [anchorElShipments, setAnchorElShipments] = React.useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleOpenShipmentsMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElShipments(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleCloseShipmentsMenu = () => {
        setAnchorElShipments(null);
    };

    const isShipmentsActive = location.pathname.startsWith('/shipments') || location.pathname === '/parcels';

    const renderNavigationLink = (item: NavigationItem) => {
        const Icon = item.icon;

        return (
            <NavLink
                key={item.path}
                to={item.path}
                className={({isActive}) => `navbar-link${isActive ? ' navbar-link-active' : ''}`}
            >
                <Icon className="navbar-link-icon" fontSize="small" />
                <span>{item.label}</span>
            </NavLink>
        );
    };

    const renderMobileMenuItem = (item: NavigationItem) => {
        const Icon = item.icon;

        return (
            <MenuItem className="navbar-mobile-item" key={item.path} onClick={handleCloseNavMenu}>
                <NavLink
                    to={item.path}
                    className={({isActive}) => `navbar-mobile-link${isActive ? ' navbar-mobile-link-active' : ''}`}
                >
                    <Icon fontSize="small" />
                    <span>{item.label}</span>
                </NavLink>
            </MenuItem>
        );
    };

    const renderShipmentMenuItem = (item: NavigationItem) => {
        const Icon = item.icon;

        return (
            <MenuItem className="navbar-mobile-item" key={item.path} onClick={handleCloseShipmentsMenu}>
                <NavLink
                    to={item.path}
                    className={({isActive}) => `navbar-mobile-link${isActive ? ' navbar-mobile-link-active' : ''}`}
                >
                    <Icon fontSize="small" />
                    <span>{item.label}</span>
                </NavLink>
            </MenuItem>
        );
    };

    return (
        <AppBar className="navbar-appbar" position="sticky" elevation={0}>
            <Container maxWidth="xl">
                <Toolbar className="navbar-toolbar" disableGutters>
                    <Box className="navbar-mobile-trigger">
                        <Tooltip title="Menu">
                            <IconButton
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                aria-label="open navigation"
                                className="navbar-icon-button"
                                onClick={handleOpenNavMenu}
                                size="large"
                            >
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={anchorElNav}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                            className="navbar-mobile-menu"
                            id="menu-appbar"
                            keepMounted
                            onClose={handleCloseNavMenu}
                            open={Boolean(anchorElNav)}
                            transformOrigin={{vertical: 'top', horizontal: 'left'}}
                        >
                            {shipmentMenuItems.map(renderMobileMenuItem)}
                            {navigationItems.map(renderMobileMenuItem)}
                        </Menu>
                    </Box>

                    <NavLink className="navbar-brand" to="/">
                        <span className="navbar-brand-mark">
                            <LocalShipping fontSize="small" />
                        </span>
                        <span className="navbar-brand-copy">
                            <Typography className="navbar-brand-title" component="span">
                                Manager 2.0
                            </Typography>
                            <Typography className="navbar-brand-subtitle" component="span">
                                logistics console
                            </Typography>
                        </span>
                    </NavLink>

                    <Box className="navbar-links">
                        <button
                            aria-controls="shipments-menu"
                            aria-haspopup="true"
                            className={`navbar-link navbar-link-button${isShipmentsActive ? ' navbar-link-active' : ''}`}
                            onClick={handleOpenShipmentsMenu}
                            type="button"
                        >
                            <LocalShipping className="navbar-link-icon" fontSize="small" />
                            <span>Shipments</span>
                            <ArrowDropDown className="navbar-link-icon" fontSize="small" />
                        </button>
                        <Menu
                            anchorEl={anchorElShipments}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                            className="navbar-shipments-menu"
                            id="shipments-menu"
                            keepMounted
                            onClose={handleCloseShipmentsMenu}
                            open={Boolean(anchorElShipments)}
                            transformOrigin={{vertical: 'top', horizontal: 'left'}}
                        >
                            {shipmentMenuItems.map(renderShipmentMenuItem)}
                        </Menu>
                        {navigationItems.map(renderNavigationLink)}
                    </Box>

                    <Box className="navbar-user">
                        <Tooltip title="Account">
                            <IconButton className="navbar-avatar-button" onClick={handleOpenUserMenu}>
                                <Avatar className="navbar-avatar" alt="User Avatar">
                                    <Person fontSize="small" />
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={anchorElUser}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                            className="navbar-user-menu"
                            keepMounted
                            onClose={handleCloseUserMenu}
                            open={Boolean(anchorElUser)}
                            transformOrigin={{vertical: 'top', horizontal: 'right'}}
                        >
                            <MenuItem className="navbar-user-item" onClick={handleCloseUserMenu}>
                                <AccountCircle fontSize="small" />
                                <span>Profile</span>
                            </MenuItem>
                            <MenuItem className="navbar-user-item" onClick={handleCloseUserMenu}>
                                <Dashboard fontSize="small" />
                                <span>Dashboard</span>
                            </MenuItem>
                            <MenuItem className="navbar-user-item" onClick={handleCloseUserMenu}>
                                {isUserLoggedIn() ? <Logout fontSize="small" /> : <Login fontSize="small" />}
                                <span>{isUserLoggedIn() ? 'Logout' : 'Log in'}</span>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default ResponsiveAppBar;
