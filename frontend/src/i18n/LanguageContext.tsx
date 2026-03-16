import { createContext, useContext, useState, type ReactNode } from 'react';
import en from './en.json';
import ta from './ta.json';

type Language = 'en' | 'ta';
type Translations = typeof en;

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: Translations;
}

const translations: Record<Language, Translations> = { en, ta };

const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    setLang: () => { },
    t: en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>(() => {
        return (localStorage.getItem('lang') as Language) || 'en';
    });

    const setLang = (l: Language) => {
        setLangState(l);
        localStorage.setItem('lang', l);
    };

    const t = translations[lang];

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
