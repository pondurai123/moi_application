import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';
import client from '../api/client';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const isAdmin = !!localStorage.getItem('adminToken');
    const [siteName, setSiteName] = useState<string>('');

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
        navigate('/admin/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    {siteName}
                </Link>
                <div className="navbar-links">
                    <LanguageToggle />
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        {t.marketing.home}
                    </Link>
                    {isAdmin ? (
                        <>
                            <Link to="/admin/events/new" className={location.pathname === '/admin/events/new' ? 'active' : ''}>
                                {t.nav.newEvent}
                            </Link>
                            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                                {t.nav.adminPanel}
                            </Link>
                            <Link to="/admin/functions" className={location.pathname === '/admin/functions' ? 'active' : ''}>
                                {t.nav.functions}
                            </Link>
                            <Link to="/admin/settings" className={location.pathname === '/admin/settings' ? 'active' : ''}>
                                {t.nav.settings}
                            </Link>
                            <button onClick={handleLogout}>{t.nav.logout}</button>
                        </>
                    ) : (
                        <>
                            <a href="/#functions">{t.marketing.functionsTitleTa}</a>
                            <a href="/#features">{t.marketing.featuresTitleTa}</a>
                            <a href="/#how">{t.marketing.howTitleTa}</a>
                            <a href="/#contact">{t.marketing.contactTitle}</a>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
