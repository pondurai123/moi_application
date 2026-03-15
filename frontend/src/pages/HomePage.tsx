import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';

interface FunctionType { id: number; nameEn: string; nameTa: string; }

interface EventForm {
    groomName: string;
    brideName: string;
    location: string;
    phoneNumber: string;
    weddingDate: string;
    functionTypeId: number;
}

export default function HomePage() {
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const [functionTypes, setFunctionTypes] = useState<FunctionType[]>([]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EventForm>();

    useEffect(() => {
        client.get('/function-types').then((res) => setFunctionTypes(res.data)).catch(() => { });
    }, []);

    const onSubmit = async (data: EventForm) => {
        try {
            const res = await client.post('/weddings', { ...data, functionTypeId: Number(data.functionTypeId) });
            toast.success('Event created! 🎊');
            navigate(`/collect/${res.data.id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed');
        }
    };

    return (
        <div className="page-center">
            <div style={{ width: '100%', maxWidth: '560px' }}>
                <div className="hero">
                    <h1>💍 {t.home.heroTitle}</h1>
                    <p>{t.home.heroSubtitle}</p>
                </div>

                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text)' }}>
                        {t.home.createEvent}
                    </h2>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Function Type */}
                        <div className="form-group">
                            <label>{t.home.functionType}</label>
                            <select className="form-control" {...register('functionTypeId', { required: true })}>
                                {functionTypes.map((fn) => (
                                    <option key={fn.id} value={fn.id}>{lang === 'ta' ? fn.nameTa : fn.nameEn}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t.home.person1}</label>
                                <input className={`form-control ${errors.groomName ? 'error' : ''}`} placeholder={t.home.person1Placeholder}
                                    {...register('groomName', { required: true })} />
                                {errors.groomName && <p className="error-msg">{t.home.person1} is required</p>}
                            </div>
                            <div className="form-group">
                                <label>{t.home.person2}</label>
                                <input className={`form-control ${errors.brideName ? 'error' : ''}`} placeholder={t.home.person2Placeholder}
                                    {...register('brideName', { required: true })} />
                                {errors.brideName && <p className="error-msg">{t.home.person2} is required</p>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t.home.location}</label>
                                <input className={`form-control ${errors.location ? 'error' : ''}`} placeholder={t.home.locationPlaceholder}
                                    {...register('location', { required: true })} />
                            </div>
                            <div className="form-group">
                                <label>{t.home.phone}</label>
                                <input className="form-control" placeholder={t.home.phonePlaceholder}
                                    {...register('phoneNumber')} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.home.eventDate}</label>
                            <input type="date" className={`form-control ${errors.weddingDate ? 'error' : ''}`}
                                {...register('weddingDate', { required: true })} />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={isSubmitting}>
                            {isSubmitting ? t.home.creating : t.home.startCollection}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
