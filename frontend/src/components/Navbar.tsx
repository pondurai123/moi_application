import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';
import client from '../api/client';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const token = localStorage.getItem('adminToken');
    const isAdmin = !!token;
    const adminUserStr = localStorage.getItem('adminUser');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
    const [siteName, setSiteName] = useState<string>('');
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await client.get('/settings');
                setSiteName(res.data.brandName || 'Moi');
            } catch {
                setSiteName('Moi');
            }
        };
        fetchSettings();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setMenuOpen(false);
        navigate('/admin/login');
    };

    const handleLinkClick = () => {
        setMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    {siteName}
                </Link>
                
                {/* Hamburger menu button for mobile */}
                <button className="navbar-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <LanguageToggle />
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={handleLinkClick}>
                        {t.marketing.home}
                    </Link>
                    {isAdmin ? (
                        <>
                            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''} onClick={handleLinkClick}>
                                {t.nav.adminPanel}
                            </Link>
                            <Link to="/admin/events/new" className={location.pathname === '/admin/events/new' ? 'active' : ''} onClick={handleLinkClick}>
                                {t.nav.newEvent}
                            </Link>
                            {isSuperAdmin && (
                                <>
                                    <Link to="/admin/functions" className={location.pathname === '/admin/functions' ? 'active' : ''} onClick={handleLinkClick}>
                                        {t.nav.functions}
                                    </Link>
                                    <Link to="/admin/settings" className={location.pathname === '/admin/settings' ? 'active' : ''} onClick={handleLinkClick}>
                                        {t.nav.settings}
                                    </Link>
                                    <Link to="/admin/management" className={location.pathname === '/admin/management' ? 'active' : ''} onClick={handleLinkClick}>
                                        👤 Admin Management
                                    </Link>
                                </>
                            )}
                            <button onClick={handleLogout}>{t.nav.logout}</button>
                        </>
                    ) : (
                        <>
                            <a href="/#functions" onClick={handleLinkClick}>{t.marketing.functionsTitleTa}</a>
                            <a href="/#features" onClick={handleLinkClick}>{t.marketing.featuresTitleTa}</a>
                            <a href="/#how" onClick={handleLinkClick}>{t.marketing.howTitleTa}</a>
                            <a href="/#contact" onClick={handleLinkClick}>{t.marketing.contactTitle}</a>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
