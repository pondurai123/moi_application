import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageToggle() {
    const { lang, setLang } = useLanguage();

    return (
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <button
                onClick={() => setLang('en')}
                style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: lang === 'en' ? 'var(--primary)' : 'transparent',
                    color: lang === 'en' ? '#fff' : 'var(--text-muted)',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                }}
            >
                EN
            </button>
            <button
                onClick={() => setLang('ta')}
                style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: lang === 'ta' ? 'var(--primary)' : 'transparent',
                    color: lang === 'ta' ? '#fff' : 'var(--text-muted)',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                }}
            >
                தமிழ்
            </button>
        </div>
    );
}
