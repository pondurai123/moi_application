import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const isAdmin = !!localStorage.getItem('adminToken');

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span className="emoji">💍</span>
                    {t.app.title}
                </Link>
                <div className="navbar-links">
                    <LanguageToggle />
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        {t.nav.newEvent}
                    </Link>
                    {isAdmin ? (
                        <>
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
                        <Link to="/admin/login">{t.nav.admin}</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
