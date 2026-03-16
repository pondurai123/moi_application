import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';

interface Wedding {
    id: number;
    groomName: string;
    brideName: string;
    location: string;
    weddingDate: string;
    functionNameEn: string;
    functionNameTa: string;
}

export default function AdminDashboardPage() {
    const { lang, t } = useLanguage();
    const [weddings, setWeddings] = useState<Wedding[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchWeddings = async (q = '') => {
        try {
            const res = await client.get('/weddings', { params: q ? { search: q } : {} });
            setWeddings(res.data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchWeddings(); }, []);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchWeddings(search); };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>{t.admin.dashboard}</h1>
                    <p>{t.admin.dashboardSubtitle}</p>
                </div>

                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Link to="/admin/events/new" className="btn btn-primary btn-sm">{t.admin.createEventCta}</Link>
                </div>

                <form className="search-bar" onSubmit={handleSearch}>
                    <input className="form-control" placeholder={t.admin.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button type="submit" className="btn btn-primary">{t.admin.search}</button>
                    {search && <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); fetchWeddings(); }}>{t.admin.clear}</button>}
                </form>

                <div style={{ marginBottom: '24px' }}>
                    <span className="badge badge-purple">{weddings.length} Event{weddings.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? <div className="spinner" /> : weddings.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">💍</div>
                        <p>{t.admin.noEvents} <Link to="/admin/events/new" style={{ color: 'var(--primary)' }}>{t.admin.createOne}</Link></p>
                    </div>
                ) : (
                    <div className="weddings-grid">
                        {weddings.map((w) => {
                            const fnName = lang === 'ta' ? w.functionNameTa : w.functionNameEn;
                            return (
                                <Link key={w.id} to={`/admin/weddings/${w.id}`} className="wedding-card">
                                    {fnName && <span className="badge badge-purple" style={{ marginBottom: '8px' }}>{fnName}</span>}
                                    <h3>💍 {w.groomName} & {w.brideName}</h3>
                                    <div className="meta">
                                        <span>📍 {w.location}</span>
                                        <span>📅 {new Date(w.weddingDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        <span style={{ marginTop: '8px' }}><span className="badge badge-purple">{t.admin.viewGifts}</span></span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
