import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';

interface FunctionType {
    id: number;
    nameEn: string;
    nameTa: string;
}

interface EventForm {
    functionName: string;
    location: string;
    phoneNumber: string;
    weddingDate: string;
    functionTypeId: number;
}

export default function AdminEventCreatePage() {
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const [functionTypes, setFunctionTypes] = useState<FunctionType[]>([]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EventForm>();

    useEffect(() => {
        client.get('/function-types').then((res) => setFunctionTypes(res.data)).catch(() => {
            toast.error('Failed to load function types');
        });
    }, []);

    const onSubmit = async (data: EventForm) => {
        try {
            const res = await client.post('/weddings', { ...data, functionTypeId: Number(data.functionTypeId) });
            toast.success('Event created successfully');
            navigate(`/collect/${res.data.id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to create event');
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '760px' }}>
                <div className="page-header">
                    <h1>{t.home.createEvent}</h1>
                    <p>{t.admin.createEventSubtitle}</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label>{t.home.functionType}</label>
                            <select className="form-control" defaultValue="" {...register('functionTypeId', { required: true })}>
                                <option value="" disabled>{t.admin.selectFunctionType}</option>
                                {functionTypes.map((fn) => (
                                    <option key={fn.id} value={fn.id}>{lang === 'ta' ? fn.nameTa : fn.nameEn}</option>
                                ))}
                            </select>
                            {errors.functionTypeId && <p className="error-msg">{t.home.functionType} is required</p>}
                        </div>

                        <div className="form-group">
                            <label>{t.home.functionName}</label>
                            <input
                                className={`form-control ${errors.functionName ? 'error' : ''}`}
                                placeholder={t.home.functionNamePlaceholder}
                                {...register('functionName', { required: true })}
                            />
                            {errors.functionName && <p className="error-msg">{t.home.functionName} is required</p>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t.home.location}</label>
                                <input
                                    className={`form-control ${errors.location ? 'error' : ''}`}
                                    placeholder={t.home.locationPlaceholder}
                                    {...register('location', { required: true })}
                                />
                                {errors.location && <p className="error-msg">{t.home.location} is required</p>}
                            </div>
                            <div className="form-group">
                                <label>{t.home.phone}</label>
                                <input className="form-control" placeholder={t.home.phonePlaceholder} {...register('phoneNumber')} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.home.eventDate}</label>
                            <input
                                type="date"
                                className={`form-control ${errors.weddingDate ? 'error' : ''}`}
                                {...register('weddingDate', { required: true })}
                            />
                            {errors.weddingDate && <p className="error-msg">{t.home.eventDate} is required</p>}
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={isSubmitting}>
                            {isSubmitting ? t.home.creating : t.home.startCollection}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
