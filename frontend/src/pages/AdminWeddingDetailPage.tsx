import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';
import GiftTable from '../components/GiftTable';
import ExportButtons from '../components/ExportButtons';

interface Event { id: number; groomName: string; brideName: string; location: string; phoneNumber: string; weddingDate: string; functionNameEn: string; functionNameTa: string; }
interface Gift { id: number; donorName: string; donorPlace: string; amount: number; receiptNumber: string; typistName?: string; typistId?: number; createdAt: string; }
interface Typist { id: number; name: string; }

export default function AdminWeddingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { lang, t } = useLanguage();
    const [event, setEvent] = useState<Event | null>(null);
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [typists, setTypists] = useState<Typist[]>([]);
    const [filterTypistId, setFilterTypistId] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchGifts = async (typistId = '') => {
        try {
            const params = typistId ? { typistId } : {};
            const res = await client.get(`/weddings/${id}/gifts`, { params });
            setGifts(res.data.gifts);
            setTotalAmount(res.data.totalAmount);
        } catch { toast.error('Failed to load gifts'); }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [wRes, tRes] = await Promise.all([
                    client.get(`/weddings/${id}`),
                    client.get(`/events/${id}/typists`),
                ]);
                setEvent(wRes.data);
                setTypists(tRes.data);
                await fetchGifts();
            } catch { toast.error('Failed to load'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [id]);

    const handleTypistFilter = (val: string) => {
        setFilterTypistId(val);
        fetchGifts(val);
    };

    if (loading) return <div className="page"><div className="spinner" /></div>;

    const functionName = lang === 'ta' ? event?.functionNameTa : event?.functionNameEn;

    return (
        <div className="page">
            <div className="container">
                <Link to="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
                    {t.admin.backToDashboard}
                </Link>

                {event && (
                    <>
                        <div className="wedding-info-header">
                            <h2>💍 {event.groomName} & {event.brideName}</h2>
                            {functionName && <span className="badge badge-purple" style={{ marginTop: '4px' }}>{functionName}</span>}
                            <div className="details">
                                <span>📍 {event.location}</span>
                                {event.phoneNumber && <span>📞 {event.phoneNumber}</span>}
                                <span>📅 {new Date(event.weddingDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span>🎁 {gifts.length} {t.gifts.gifts}</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                                    {t.gifts.total}: ₹{totalAmount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.gifts.giftRecords} ({gifts.length})</h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {/* Typist filter */}
                                {typists.length > 0 && (
                                    <select className="form-control" style={{ width: 'auto', minWidth: '160px' }} value={filterTypistId} onChange={(e) => handleTypistFilter(e.target.value)}>
                                        <option value="">{t.typist.allTypists}</option>
                                        {typists.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                                    </select>
                                )}
                                <Link to={`/collect/${id}`} className="btn btn-outline btn-sm">{t.admin.addMoreGifts}</Link>
                                <ExportButtons weddingId={id!} typistId={filterTypistId} />
                            </div>
                        </div>

                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <GiftTable gifts={gifts} totalAmount={totalAmount} showTypist={true} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
