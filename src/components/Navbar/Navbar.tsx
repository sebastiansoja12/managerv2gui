import React, {useRef} from 'react';
import {FaBars, FaTimes} from 'react-icons/fa';
import './styles/main.css';

const Navbar: React.FC = () => {
    const navRef = useRef<HTMLDivElement>(null);
    const showNavbar = () => {
        if (navRef.current) {
            navRef.current.classList.toggle('responsive_nav');
        }
    };

    return (
        <header>
            <h3>Manager 2.0</h3>
            <nav ref={navRef}>
                <a href="/routes">Routes</a>
                <a href="/parcels">Parcel list</a>
                <a href="/returns">Returns</a>
                <a href="/supplies">Supplies</a>
                <a href="/depots">Depots</a>
                <button className="nav-btn nav-close-btn" onClick={showNavbar}>
                    <FaTimes/>
                </button>
            </nav>
            <button className="nav-btn" onClick={showNavbar}>
                <FaBars/>
            </button>
        </header>
    );
};

export default Navbar;
