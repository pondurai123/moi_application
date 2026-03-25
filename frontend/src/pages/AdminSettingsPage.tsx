import { useEffect, useState, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client, { getFullAssetUrl } from '../api/client';

export default function AdminSettingsPage() {
    const { t, lang } = useLanguage();
    const [settings, setSettings] = useState({
        phone: '',
        brandName: '',
        brandContact: '',
        receiptAdditionalText: '',
        logoUrl: '',
        printerName: '',
        aboutUsContentEn: '',
        aboutUsContentTa: '',
        termsContent: '',
        privacyContent: '',
        contactUsContentEn: '',
        contactUsContentTa: '',
    });
    const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
    const [defaultPrinter, setDefaultPrinter] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [printingTest, setPrintingTest] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [settingsRes, printersRes] = await Promise.all([
                    client.get('/settings'),
                    client.get('/settings/printers'),
                ]);
                setSettings((prev) => ({ ...prev, ...settingsRes.data }));
                setAvailablePrinters(printersRes.data.printers || []);
                setDefaultPrinter(printersRes.data.defaultPrinter || '');
            } catch {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
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
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleTestPrint = async () => {
        setPrintingTest(true);
        try {
            const res = await client.post('/settings/test-print', { lang, printerName: settings.printerName || undefined });
            toast.success(res.data?.message || (lang === 'ta' ? 'சோதனை ரசீது அச்சிடப்பட்டது' : 'Test receipt printed'));
        } catch (err: any) {
            toast.error(err.response?.data?.error || (lang === 'ta' ? 'சோதனை அச்சு தோல்வி' : 'Test print failed'));
        } finally {
            setPrintingTest(false);
        }
    };

    const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Logo file too large. Max 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await client.post('/settings/logo', { logoData: reader.result });
                const newLogoUrl = res.data.logoUrl;
                setSettings((prev) => ({ ...prev, logoUrl: newLogoUrl }));
                e.target.value = '';
                toast.success('Logo uploaded successfully!');
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
                    <div className="form-group">
                        <label>{t.settings.logo}</label>
                        {settings.logoUrl && (
                            <div style={{ marginBottom: '12px', textAlign: 'center', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                                <img src={getFullAssetUrl(settings.logoUrl)} alt="Logo" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ color: 'var(--text-muted)' }} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.printerName}</label>
                        <select
                            className="form-control"
                            value={settings.printerName}
                            onChange={(e) => setSettings({ ...settings, printerName: e.target.value })}
                        >
                            <option value="">{defaultPrinter ? `${t.settings.useDefaultPrinter}: ${defaultPrinter}` : t.settings.autoDetectPrinter}</option>
                            {availablePrinters.map((printer) => (
                                <option key={printer} value={printer}>{printer}</option>
                            ))}
                        </select>
                        <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {t.settings.printerHelp}
                        </p>
                    </div>

                    <div className="form-group">
                        <label>{t.settings.phone}</label>
                        <input className="form-control" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+91 98765 43210" />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.brandName}</label>
                        <input className="form-control" value={settings.brandName} onChange={(e) => setSettings({ ...settings, brandName: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.brandContact}</label>
                        <textarea className="form-control" value={settings.brandContact} onChange={(e) => setSettings({ ...settings, brandContact: e.target.value })} rows={3} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.receiptText}</label>
                        <textarea className="form-control" rows={3} value={settings.receiptAdditionalText} onChange={(e) => setSettings({ ...settings, receiptAdditionalText: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.aboutUsEnglish}</label>
                        <textarea className="form-control" rows={5} value={settings.aboutUsContentEn} onChange={(e) => setSettings({ ...settings, aboutUsContentEn: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.aboutUsTamil}</label>
                        <textarea className="form-control" rows={5} value={settings.aboutUsContentTa} onChange={(e) => setSettings({ ...settings, aboutUsContentTa: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.terms}</label>
                        <textarea className="form-control" rows={5} value={settings.termsContent} onChange={(e) => setSettings({ ...settings, termsContent: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.privacy}</label>
                        <textarea className="form-control" rows={5} value={settings.privacyContent} onChange={(e) => setSettings({ ...settings, privacyContent: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.contactUsEnglish}</label>
                        <textarea className="form-control" rows={5} value={settings.contactUsContentEn} onChange={(e) => setSettings({ ...settings, contactUsContentEn: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>{t.settings.contactUsTamil}</label>
                        <textarea className="form-control" rows={5} value={settings.contactUsContentTa} onChange={(e) => setSettings({ ...settings, contactUsContentTa: e.target.value })} />
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
                        {saving ? '...' : t.settings.saveSettings}
                    </button>

                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }} onClick={handleTestPrint} disabled={printingTest}>
                        {printingTest ? '...' : t.settings.testPrint}
                    </button>
                </div>
            </div>
        </div>
    );
}
