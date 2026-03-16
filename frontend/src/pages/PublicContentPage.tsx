import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
    pageKey?: string;
    pageType?: 'about' | 'contact';
    titleKey: string;
    subtitleKey: string;
    fallbackKey: string;
}

export default function PublicContentPage({ pageKey, pageType, titleKey, subtitleKey, fallbackKey }: Props) {
    const { t, lang } = useLanguage();
    const [content, setContent] = useState('');
    const [brandName, setBrandName] = useState('');
    const text = (key: string) => key.split('.').reduce((value: any, part) => value?.[part], t) || '';
    const resolvedPageKey = pageKey || (pageType === 'about'
        ? (lang === 'ta' ? 'aboutUsContentTa' : 'aboutUsContentEn')
        : (lang === 'ta' ? 'contactUsContentTa' : 'contactUsContentEn'));

    useEffect(() => {
        client.get('/settings').then((res) => {
            setContent(res.data?.[resolvedPageKey] || '');
            setBrandName(res.data?.brandName || '');
        }).catch(() => {
            setContent('');
        });
    }, [resolvedPageKey]);

    return (
        <div className="page">
            <div className="container public-page-container">
                <div className="page-header">
                    <h1>{text(titleKey)}</h1>
                    <p>{text(subtitleKey)}</p>
                </div>

                <article className="card public-copy">
                    <p>{content || text(fallbackKey)}</p>
                </article>

                <div className="public-page-footer">
                    <p>{brandName || t.app.title}</p>
                    <Link to="/">{t.marketing.backHome}</Link>
                </div>
            </div>
        </div>
    );
}
