import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';
import GiftTable from '../components/GiftTable';
import ExportButtons from '../components/ExportButtons';
import ReceiptPrint from '../components/ReceiptPrint';

interface Event { id: number; groomName: string; brideName: string; location: string; phoneNumber: string; weddingDate: string; functionNameEn: string; functionNameTa: string; }
interface Gift { id: number; donorName: string; donorPlace: string; amount: number; receiptNumber: string; typistName?: string; typistId?: number; denominations?: { denomination: number; quantity: number }[]; createdAt: string; }
interface Typist { id: number; name: string; code?: string; }
interface GiftForm { donorName: string; donorPlace: string; }

export default function GiftCollectionPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const { lang, t } = useLanguage();
    const [event, setEvent] = useState<Event | null>(null);
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [typists, setTypists] = useState<Typist[]>([]);
    const [selectedTypistId, setSelectedTypistId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [receiptData, setReceiptData] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Denomination rows
    const [denomRows, setDenomRows] = useState([{ denomination: '', quantity: '' }]);

    // Typist management
    const [newTypistName, setNewTypistName] = useState('');
    const [showTypistForm, setShowTypistForm] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GiftForm>();

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
            } catch { toast.error('Failed to load data'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [weddingId]);

    const addDenomRow = () => setDenomRows([...denomRows, { denomination: '', quantity: '' }]);
    const removeDenomRow = (idx: number) => setDenomRows(denomRows.filter((_, i) => i !== idx));
    const updateDenomRow = (idx: number, field: string, value: string) => {
        const rows = [...denomRows];
        (rows[idx] as any)[field] = value;
        setDenomRows(rows);
    };

    const calcTotal = () => {
        return denomRows.reduce((sum, row) => {
            const d = parseFloat(row.denomination) || 0;
            const q = parseInt(row.quantity) || 0;
            return sum + d * q;
        }, 0);
    };

    const onSubmit = async (data: GiftForm) => {
        const amount = calcTotal();
        if (amount <= 0) {
            toast.error('Please add denominations with a total > 0');
            return;
        }

        const denominations = denomRows
            .filter((r) => r.denomination && r.quantity)
            .map((r) => ({ denomination: parseFloat(r.denomination), quantity: parseInt(r.quantity) }));

        try {
            const res = await client.post(`/weddings/${weddingId}/gifts`, {
                ...data,
                amount,
                typistId: selectedTypistId ? parseInt(selectedTypistId) : null,
                denominations,
            });
            setGifts((prev) => [...prev, res.data]);
            setTotalAmount((prev) => prev + parseFloat(res.data.amount));
            reset();
            setDenomRows([{ denomination: '', quantity: '' }]);
            toast.success('Gift saved! 🎁');

            // Fetch receipt data and print
            try {
                const receiptRes = await client.get(`/weddings/${weddingId}/gifts/${res.data.id}/receipt`);
                setReceiptData(receiptRes.data);
                setTimeout(() => printReceipt(), 300);
            } catch { /* receipt optional */ }
        } catch (err: any) {
            toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to save');
        }
    };

    const printReceipt = () => {
        if (!receiptRef.current) return;
        const printWindow = window.open('', '_blank', 'width=360,height=600');
        if (!printWindow) { toast.error('Please allow popups to print receipts'); return; }
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>80mm Thermal Receipt</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body {
            width: 80mm;
            height: auto;
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
          }
          
          body {
            display: block;
          }
          
          .receipt-print {
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            display: block !important;
            color: #000 !important;
            background: #fff !important;
            overflow: visible !important;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            padding: 0;
          }
          
          td, th {
            padding: 2px 4px;
            text-align: left;
          }
          
          img {
            display: block;
            max-width: 32mm;
            height: auto;
            margin: 0 auto;
          }
          
          div {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>${receiptRef.current.innerHTML}</body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            // Keep window open briefly for printing to complete
            setTimeout(() => printWindow.close(), 1000);
        }, 300);
    };

    const addTypist = async () => {
        if (!newTypistName.trim()) return;
        try {
            const res = await client.post(`/events/${weddingId}/typists`, { name: newTypistName.trim() });
            setTypists([...typists, res.data]);
            setNewTypistName('');
            setShowTypistForm(false);
            toast.success('Typist added!');
        } catch { toast.error('Failed to add typist'); }
    };

    if (loading) return <div className="page"><div className="spinner" /></div>;

    const functionName = lang === 'ta' ? event?.functionNameTa : event?.functionNameEn;

    return (
        <div className="page">
            <div className="container">
                <Link to="/admin/events/new" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
                    {t.gifts.createAnother}
                </Link>

                {/* Event header */}
                {event && (
                    <div className="wedding-info-header">
                        <h2>💍 {event.groomName} & {event.brideName}</h2>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {functionName && <span className="badge badge-purple" style={{ marginRight: '12px' }}>{functionName}</span>}
                        </div>
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
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px', alignItems: 'start' }}>
                    {/* Left: Add Gift Form */}
                    <div>
                        <div className="card" style={{ position: 'sticky', top: '80px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>{t.gifts.addGift}</h3>

                            {/* Typist selector */}
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

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="form-group">
                                    <label>{t.gifts.donorName}</label>
                                    <input className={`form-control ${errors.donorName ? 'error' : ''}`} placeholder={t.gifts.donorNamePlaceholder}
                                        {...register('donorName', { required: true })} />
                                </div>
                                <div className="form-group">
                                    <label>{t.gifts.place}</label>
                                    <input className={`form-control ${errors.donorPlace ? 'error' : ''}`} placeholder={t.gifts.placePlaceholder}
                                        {...register('donorPlace', { required: true })} />
                                </div>

                                {/* Denomination rows */}
                                <div className="form-group">
                                    <label>{t.gifts.denominations}</label>
                                    {denomRows.map((row, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                            <input className="form-control" type="number" placeholder="₹500" value={row.denomination}
                                                onChange={(e) => updateDenomRow(idx, 'denomination', e.target.value)} style={{ width: '100px' }} />
                                            <span style={{ color: 'var(--text-muted)' }}>×</span>
                                            <input className="form-control" type="number" placeholder="2" value={row.quantity}
                                                onChange={(e) => updateDenomRow(idx, 'quantity', e.target.value)} style={{ width: '60px' }} />
                                            <span style={{ color: 'var(--success)', fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>
                                                = ₹{((parseFloat(row.denomination) || 0) * (parseInt(row.quantity) || 0)).toLocaleString('en-IN')}
                                            </span>
                                            {denomRows.length > 1 && (
                                                <button type="button" onClick={() => removeDenomRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-outline btn-sm" onClick={addDenomRow}>{t.gifts.addDenomination}</button>
                                </div>

                                {/* Total */}
                                <div style={{ background: 'rgba(124,58,237,0.1)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: '16px', textAlign: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.gifts.total}: </span>
                                    <span className="amount-total">₹{calcTotal().toLocaleString('en-IN')}</span>
                                </div>

                                <button type="submit" className="btn btn-success" style={{ width: '100%' }} disabled={isSubmitting}>
                                    {isSubmitting ? t.gifts.saving : t.gifts.saveGift}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Gifts Table */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {t.gifts.giftRecords} ({gifts.length})
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {typists.length > 0 && (
                                    <select
                                        className="form-control"
                                        style={{ width: 'auto', minWidth: '160px' }}
                                        value={selectedTypistId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedTypistId(val);
                                            const params = val ? { typistId: val } : {};
                                            client.get(`/weddings/${weddingId}/gifts`, { params })
                                                .then(res => {
                                                    setGifts(res.data.gifts);
                                                    setTotalAmount(res.data.totalAmount);
                                                });
                                        }}
                                    >
                                        <option value="">{t.typist.allTypists}</option>
                                        {typists.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                                    </select>
                                )}
                                <ExportButtons weddingId={weddingId!} typistId={selectedTypistId} />
                            </div>
                        </div>
                        <GiftTable gifts={gifts} totalAmount={totalAmount} />
                    </div>
                </div>

                {/* Hidden receipt for printing */}
                <ReceiptPrint ref={receiptRef} data={receiptData} hidden />
            </div>
        </div>
    );
}
