import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';

type Language = 'en' | 'tr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'tr',
    setLanguage: () => { },
    t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('tr'); // Default to TR

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const stored = await AsyncStorage.getItem('user-language');
            if (stored === 'en' || stored === 'tr') {
                setLanguageState(stored);
            }
        } catch (e) {
            console.error('Failed to load language', e);
        }
    };

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await AsyncStorage.setItem('user-language', lang);
    };

    // Helper to get nested translation strings with interpolation support
    const t = (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');
        let current: any = translations[language];
        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path} in ${language}`);
                return path;
            }
            current = current[key];
        }

        // If no params, return the string as-is
        if (!params) return current;

        // Replace {{placeholder}} with actual values
        let result = current;
        for (const [key, value] of Object.entries(params)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
