import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';

interface Event { id: number; groomName: string; brideName: string; location: string; phoneNumber: string; weddingDate: string; functionNameEn: string; functionNameTa: string; }
interface Gift { id: number; donorName: string; donorPlace: string; amount: number; receiptNumber?: string; typistName?: string; typistId?: number; denominations?: { denomination: number; quantity: number }[]; createdAt: string; }
interface Typist { id: number; name: string; code?: string; }
interface GiftForm { donorName: string; donorPlace: string; totalAmount?: string; }

const PREDEFINED_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function GiftCollectionPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [typists, setTypists] = useState<Typist[]>([]);
    const [selectedTypistId, setSelectedTypistId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [printingTest, setPrintingTest] = useState(false);
    const [enteredTotalAmount, setEnteredTotalAmount] = useState('');
    const [selectedDenominations, setSelectedDenominations] = useState<{ [key: number]: string }>({});
    const [newTypistName, setNewTypistName] = useState('');
    const [showTypistForm, setShowTypistForm] = useState(false);
    const [editingGiftId, setEditingGiftId] = useState<number | null>(null);
    const [editingGift, setEditingGift] = useState<Gift | null>(null);

    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<GiftForm>();
    const editGiftIdFromUrl = useMemo(() => {
        const rawValue = searchParams.get('giftId');
        if (!rawValue) return null;
        const parsed = Number(rawValue);
        return Number.isNaN(parsed) ? null : parsed;
    }, [searchParams]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [wRes, gRes, tRes] = await Promise.all([
                    client.get(`/weddings/${weddingId}`),
                    client.get(`/weddings/${weddingId}/gifts`),
                    client.get(`/events/${weddingId}/typists`),
                ]);
                setEvent(wRes.data);
                setGifts(gRes.data.gifts);
                setTotalAmount(gRes.data.totalAmount);
                setTypists(tRes.data);
            } catch {
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [weddingId]);

    useEffect(() => {
        if (!editGiftIdFromUrl || gifts.length === 0) return;
        const matchedGift = gifts.find((gift) => gift.id === editGiftIdFromUrl);
        if (!matchedGift) {
            toast.error('Selected gift not found');
            return;
        }
        setEditingGiftId(matchedGift.id);
        setEditingGift(matchedGift);
    }, [editGiftIdFromUrl, gifts]);

    useEffect(() => {
        if (!editingGift) return;

        reset({
            donorName: editingGift.donorName,
            donorPlace: editingGift.donorPlace,
        });

        if (editingGift.denominations && editingGift.denominations.length > 0) {
            const denomMap: { [key: number]: string } = {};
            editingGift.denominations.forEach((d) => {
                denomMap[d.denomination] = String(d.quantity);
            });
            setSelectedDenominations(denomMap);
        } else {
            setSelectedDenominations({});
        }

        setSelectedTypistId(editingGift.typistId ? String(editingGift.typistId) : '');
        setEnteredTotalAmount(String(editingGift.amount || ''));
    }, [editingGift, reset]);

    const clearForm = () => {
        setEditingGiftId(null);
        setEditingGift(null);
        reset();
        setEnteredTotalAmount('');
        setSelectedDenominations({});
        setSelectedTypistId('');
        setSearchParams({});
    };

    const refreshGiftSummary = async () => {
        const totalRes = await client.get(`/weddings/${weddingId}/gifts`);
        setGifts(totalRes.data.gifts);
        setTotalAmount(totalRes.data.totalAmount);
    };

    const calcTotalFromSelectedDenominations = () => {
        return Object.entries(selectedDenominations).reduce((sum, [denom, qty]) => {
            return sum + (parseInt(denom) * (parseInt(qty) || 0));
        }, 0);
    };

    const validateDenominationsTotal = () => {
        const entered = parseFloat(enteredTotalAmount) || 0;
        const calculated = calcTotalFromSelectedDenominations();
        const hasDenominations = Object.values(selectedDenominations).some((qty) => qty && parseInt(qty) > 0);

        if (!hasDenominations) {
            toast.error('Please enter denomination quantities (e.g. ₹500 x 2)');
            return false;
        }

        if (entered !== calculated) {
            toast.error(`Denomination total ₹${calculated.toLocaleString('en-IN')} does not match entered amount ₹${entered.toLocaleString('en-IN')}. Please fix the denominations.`);
            return false;
        }

        return true;
    };

    const printReceipt = async (giftId: number) => {
        await client.post(`/weddings/${weddingId}/gifts/${giftId}/thermal-print`, { lang });
    };

    const handleTestPrint = async () => {
        setPrintingTest(true);
        try {
            const res = await client.post('/settings/test-print', { lang });
            toast.success(res.data?.message || 'Test receipt printed');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Test print failed');
        } finally {
            setPrintingTest(false);
        }
    };

    const onSubmit = async (data: GiftForm) => {
        if (!data.donorName?.trim()) {
            toast.error('Please enter donor name');
            return;
        }
        if (!data.donorPlace?.trim()) {
            toast.error('Please enter donor place');
            return;
        }

        const amount = parseFloat(enteredTotalAmount) || 0;
        if (amount <= 0) {
            toast.error('Please enter a total amount');
            return;
        }
        if (!validateDenominationsTotal()) return;

        const denominations = Object.entries(selectedDenominations)
            .filter(([_, qty]) => qty && parseInt(qty) > 0)
            .map(([denom, qty]) => ({
                denomination: parseInt(denom),
                quantity: parseInt(qty),
            }));

        try {
            let res: { data: Gift };
            const payload = {
                donorName: data.donorName.trim(),
                donorPlace: data.donorPlace.trim(),
                amount,
                typistId: selectedTypistId ? parseInt(selectedTypistId) : null,
                denominations,
            };

            if (editingGiftId) {
                res = await client.put(`/weddings/${weddingId}/gifts/${editingGiftId}`, payload);
                toast.success('Gift updated!');
            } else {
                res = await client.post(`/weddings/${weddingId}/gifts`, payload);
                toast.success('Gift saved!');
            }

            await refreshGiftSummary();
            await printReceipt(res.data.id);
            toast.success('Receipt printed!');

            if (editingGiftId) {
                clearForm();
                navigate(`/admin/weddings/${weddingId}`);
                return;
            }

            clearForm();
        } catch (err: any) {
            console.error('Gift save/print failed:', err);
            toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to save');
        }
    };

    const addTypist = async () => {
        if (!newTypistName.trim()) return;
        try {
            const res = await client.post(`/events/${weddingId}/typists`, { name: newTypistName.trim() });
            setTypists([...typists, res.data]);
            setNewTypistName('');
            setShowTypistForm(false);
            toast.success('Typist added!');
        } catch {
            toast.error('Failed to add typist');
        }
    };

    if (loading) return <div className="page"><div className="spinner" /></div>;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '1080px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    <Link to="/admin/events/new" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {t.gifts.createAnother}
                    </Link>
                    <Link to={`/admin/weddings/${weddingId}`} className="btn btn-outline btn-sm">
                        {t.gifts.viewRecords}
                    </Link>
                </div>

                {event && (
                    <div className="wedding-info-header">
                        <h2>💍 {event.groomName} & {event.brideName}</h2>
                        <div className="details">
                            <span>📍 {event.location}</span>
                            {event.phoneNumber && <span>📞 {event.phoneNumber}</span>}
                            <span>📅 {new Date(event.weddingDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span>🎁 {gifts.length} {t.gifts.gifts}</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{t.gifts.total}: ₹{totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                )}

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                            {editingGiftId ? t.gifts.editGiftEntry : t.gifts.addGift}
                        </h3>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleTestPrint} disabled={printingTest}>
                            {printingTest ? '...' : t.settings.testPrint}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="gift-entry-grid">
                            <div>
                                <div className="form-group">
                                    <label>{t.gifts.selectTypist}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select className="form-control" value={selectedTypistId} onChange={(e) => setSelectedTypistId(e.target.value)} style={{ flex: 1 }}>
                                            <option value="">{t.gifts.noTypist}</option>
                                            {typists.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowTypistForm(!showTypistForm)}>+</button>
                                    </div>
                                    {showTypistForm && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <input className="form-control" placeholder={t.typist.name} value={newTypistName} onChange={(e) => setNewTypistName(e.target.value)} style={{ flex: 1 }} />
                                            <button type="button" className="btn btn-success btn-sm" onClick={addTypist}>{t.typist.addTypist}</button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>{t.gifts.donorName}</label>
                                    <input className="form-control" placeholder={t.gifts.donorNamePlaceholder} {...register('donorName')} />
                                </div>

                                <div className="form-group">
                                    <label>{t.gifts.place}</label>
                                    <input className="form-control" placeholder={t.gifts.placePlaceholder} {...register('donorPlace')} />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>{t.gifts.totalAmount || 'Total Amount (₹)'}</label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        placeholder="e.g. 5000"
                                        value={enteredTotalAmount}
                                        onChange={(e) => setEnteredTotalAmount(e.target.value)}
                                        style={{ fontSize: '1rem' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="form-group">
                                    <label>{t.gifts.selectDenominations || 'Select Denominations'}</label>
                                    <div className="gift-denomination-grid">
                                        {PREDEFINED_DENOMINATIONS.map((denom) => (
                                            <div key={denom} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>₹{denom}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={selectedDenominations[denom] || ''}
                                                    onChange={(e) => setSelectedDenominations((prev) => ({ ...prev, [denom]: e.target.value }))}
                                                    className="form-control"
                                                    style={{ textAlign: 'center', fontSize: '0.95rem' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(124,58,237,0.1)', borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.gifts.calculatedTotal || 'Denominations Total'}: </span>
                                    <span className="amount-total">₹{calcTotalFromSelectedDenominations().toLocaleString('en-IN')}</span>
                                    {enteredTotalAmount && calcTotalFromSelectedDenominations() !== parseFloat(enteredTotalAmount) && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--error)', marginTop: '4px' }}>
                                            ❌ {t.gifts.mismatchWarning || 'Mismatch with entered amount'}
                                        </div>
                                    )}
                                    {enteredTotalAmount && calcTotalFromSelectedDenominations() === parseFloat(enteredTotalAmount) && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '4px' }}>
                                            ✅ {t.gifts.validationSuccess || 'Amount matches!'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="gift-entry-actions">
                            <button type="submit" className="btn btn-success gift-submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? t.gifts.saving : editingGiftId ? t.gifts.updateGift : t.gifts.saveGift}
                            </button>
                            {editingGiftId && (
                                <button type="button" className="btn btn-outline" onClick={clearForm}>
                                    {t.functions.cancel}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
