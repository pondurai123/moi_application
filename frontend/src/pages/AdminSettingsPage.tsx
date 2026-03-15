import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';

export default function AdminSettingsPage() {
    const { t } = useLanguage();
    const [settings, setSettings] = useState({
        phone: '',
        brandName: '',
        brandContact: '',
        receiptAdditionalText: '',
        logoUrl: '',
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await client.get('/settings');
                setSettings((prev) => ({ ...prev, ...res.data }));
            } catch { toast.error('Failed to load settings'); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { logoUrl, ...rest } = settings;
            const res = await client.put('/settings', rest);
            setSettings((prev) => ({ ...prev, ...res.data }));
            toast.success(t.settings.saved);
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (optional but good)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Logo file too large. Max 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await client.post('/settings/logo', { logoData: reader.result });
                setSettings((prev) => ({ ...prev, logoUrl: res.data.logoUrl }));
                toast.success('Logo uploaded! ✅');
            } catch (err: any) {
                if (err.response?.status === 403 || err.response?.status === 401) {
                    toast.error('Session expired. Please login again.');
                } else {
                    toast.error(err.response?.data?.error || 'Failed to upload logo');
                }
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) return <div className="page"><div className="spinner" /></div>;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '600px' }}>
                <div className="page-header">
                    <h1>{t.settings.title}</h1>
                    <p>{t.settings.subtitle}</p>
                </div>

                <div className="card">
                    {/* Logo */}
                    <div className="form-group">
                        <label>{t.settings.logo}</label>
                        {settings.logoUrl && (
                            <div style={{ marginBottom: '12px' }}>
                                <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '60px', borderRadius: '8px' }} />
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ color: 'var(--text-muted)' }} />
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label>{t.settings.phone}</label>
                        <input
                            className="form-control"
                            value={settings.phone}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Brand Name */}
                    <div className="form-group">
                        <label>{t.settings.brandName}</label>
                        <input
                            className="form-control"
                            value={settings.brandName}
                            onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                        />
                    </div>

                    {/* Brand Contact */}
                    <div className="form-group">
                        <label>{t.settings.brandContact}</label>
                        <input
                            className="form-control"
                            value={settings.brandContact}
                            onChange={(e) => setSettings({ ...settings, brandContact: e.target.value })}
                        />
                    </div>

                    {/* Receipt Additional Text */}
                    <div className="form-group">
                        <label>{t.settings.receiptText}</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            value={settings.receiptAdditionalText}
                            onChange={(e) => setSettings({ ...settings, receiptAdditionalText: e.target.value })}
                        />
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '...' : t.settings.saveSettings}
                    </button>
                </div>
            </div>
        </div>
    );
}
