import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';

interface FunctionType {
    id: number;
    nameEn: string;
    nameTa: string;
    isActive: boolean;
}

interface FunctionForm {
    nameEn: string;
    nameTa: string;
}

export default function AdminFunctionsPage() {
    const { t } = useLanguage();
    const [functions, setFunctions] = useState<FunctionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editEn, setEditEn] = useState('');
    const [editTa, setEditTa] = useState('');

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FunctionForm>();

    const fetchFunctions = async () => {
        try {
            const res = await client.get('/function-types');
            setFunctions(res.data);
        } catch { toast.error('Failed to load functions'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFunctions(); }, []);

    const onAdd = async (data: FunctionForm) => {
        try {
            await client.post('/function-types', data);
            toast.success('Function type added! ✅');
            reset();
            fetchFunctions();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to add');
        }
    };

    const onEdit = async (id: number) => {
        try {
            await client.put(`/function-types/${id}`, { nameEn: editEn, nameTa: editTa });
            toast.success('Updated! ✅');
            setEditingId(null);
            fetchFunctions();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update');
        }
    };

    const onDelete = async (id: number) => {
        if (!confirm('Deactivate this function type?')) return;
        try {
            await client.delete(`/function-types/${id}`);
            toast.success('Deactivated');
            fetchFunctions();
        } catch { toast.error('Failed to deactivate'); }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>{t.functions.title}</h1>
                    <p>{t.functions.subtitle}</p>
                </div>

                {/* Add function form */}
                <div className="card" style={{ marginBottom: '32px' }}>
                    <form onSubmit={handleSubmit(onAdd)} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                            <label>{t.functions.englishName}</label>
                            <input
                                className={`form-control ${errors.nameEn ? 'error' : ''}`}
                                placeholder={t.functions.englishPlaceholder}
                                {...register('nameEn', { required: true })}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                            <label>{t.functions.tamilName}</label>
                            <input
                                className={`form-control ${errors.nameTa ? 'error' : ''}`}
                                placeholder={t.functions.tamilPlaceholder}
                                {...register('nameTa', { required: true })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ height: '46px' }}>
                            {isSubmitting ? t.functions.adding : t.functions.addFunction}
                        </button>
                    </form>
                </div>

                {/* Functions list */}
                {loading ? <div className="spinner" /> : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th>{t.functions.englishName}</th>
                                    <th>{t.functions.tamilName}</th>
                                    <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {functions.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t.functions.noFunctions}</td></tr>
                                ) : functions.map((fn, idx) => (
                                    <tr key={fn.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                                        {editingId === fn.id ? (
                                            <>
                                                <td><input className="form-control" value={editEn} onChange={(e) => setEditEn(e.target.value)} /></td>
                                                <td><input className="form-control" value={editTa} onChange={(e) => setEditTa(e.target.value)} /></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => onEdit(fn.id)} style={{ marginRight: '8px' }}>{t.functions.save}</button>
                                                    <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>{t.functions.cancel}</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ fontWeight: 500 }}>{fn.nameEn}</td>
                                                <td>{fn.nameTa}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => { setEditingId(fn.id); setEditEn(fn.nameEn); setEditTa(fn.nameTa); }}
                                                        style={{ marginRight: '8px' }}
                                                    >
                                                        {t.functions.edit}
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(fn.id)}>
                                                        {t.functions.delete}
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
