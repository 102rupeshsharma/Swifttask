import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import './Header.css';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Header = () => {
    const [username, setUsername] = useState<string | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const handleLogout = () => {
        localStorage.clear();
        setUsername(null);
        setDropdownOpen(false);
        navigate('/login', { replace: true });
    };

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    return (
        <header>
            <div className="brand">
                <span>Swift</span><span style={{color:'#2d63d9'}}>Task</span>
            </div>

            <div className='header_btn' ref={dropdownRef}>
                <div className='user-section'>
                    <span className='user-icon'> <FontAwesomeIcon icon={faUser} style={{height:'20px', width:'20px'}} /> </span>
                {username ? (
                        <>
                            <span className='username' onClick={toggleDropdown}>
                                {username} <span style={{ fontSize: '0.8rem' }}></span>
                            </span>
                            {dropdownOpen && (
                                <div className='dropdown'>
                                    <span onClick={handleLogout}>Log out</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className='login-button'>Log in</Link>
                    )}
                    </div>
                
            </div>
        </header>
    );
};

export default Header;
