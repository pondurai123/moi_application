import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';

interface LoginForm { username: string; password: string; }

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [showPass, setShowPass] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        try {
            const res = await client.post('/admin/login', data);
            localStorage.setItem('adminToken', res.data.token);
            toast.success(`Welcome back, ${res.data.username}! 👋`);
            navigate('/admin');
        } catch (err: any) { toast.error(err.response?.data?.error || 'Login failed'); }
    };

    return (
        <div className="page-center">
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div className="hero" style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem' }}>{t.admin.login}</h1>
                    <p>{t.admin.loginSubtitle}</p>
                </div>
                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label>{t.admin.username}</label>
                            <input className={`form-control ${errors.username ? 'error' : ''}`} placeholder="admin" autoComplete="username"
                                {...register('username', { required: true })} />
                        </div>
                        <div className="form-group">
                            <label>{t.admin.password}</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPass ? 'text' : 'password'} className={`form-control ${errors.password ? 'error' : ''}`}
                                    placeholder="••••••••" autoComplete="current-password" style={{ paddingRight: '48px' }}
                                    {...register('password', { required: true })} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={isSubmitting}>
                            {isSubmitting ? t.admin.loggingIn : t.admin.loginBtn}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.admin.defaultCreds}</p>
                </div>
            </div>
        </div>
    );
}
