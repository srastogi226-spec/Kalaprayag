import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'kp_language';
const DEFAULT_LANG = 'en-IN';

interface LanguageContextValue {
    language: string;
    setLanguage: (lang: string) => void;
    isTranslating: boolean;
    setIsTranslating: (v: boolean) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
    language: DEFAULT_LANG,
    setLanguage: () => { },
    isTranslating: false,
    setIsTranslating: () => { },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<string>(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
        } catch {
            return DEFAULT_LANG;
        }
    });
    const [isTranslating, setIsTranslating] = useState(false);

    const setLanguage = (lang: string) => {
        setLanguageState(lang);
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch { }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, isTranslating, setIsTranslating }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
