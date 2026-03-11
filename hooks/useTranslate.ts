import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../services/sarvamTranslate';

// Module-level cache: lang → (originalText → translatedText)
// Shared across ALL component instances so we never fetch the same string twice
const cache = new Map<string, Map<string, string>>();

function getCached(lang: string, text: string): string | undefined {
    return cache.get(lang)?.get(text);
}

function setCached(lang: string, text: string, translated: string) {
    if (!cache.has(lang)) cache.set(lang, new Map());
    cache.get(lang)!.set(text, translated);
}

// Module-level counter to force a re-render when ANY translation lands in cache
// This saves us from maintaining per-component Maps and state update races.
type Listener = () => void;
const listeners = new Set<Listener>();
function notifyAll() {
    listeners.forEach(fn => fn());
}

export function useTranslate() {
    const { language, setIsTranslating } = useLanguage();

    // A simple tick counter — incrementing it forces every subscriber to re-render
    const [, setTick] = useState(0);
    const pendingRef = useRef<Set<string>>(new Set());

    // Register/unregister as a listener so notifyAll() from any t() call re-renders us
    useEffect(() => {
        const rerender = () => setTick(n => n + 1);
        listeners.add(rerender);
        return () => { listeners.delete(rerender); };
    }, []);

    // Clear pending set when language changes so we re-fetch for the new language
    useEffect(() => {
        pendingRef.current.clear();
        setTick(n => n + 1); // force re-render so t() uses fresh cache lookups
    }, [language]);

    const t = useCallback(
        (text: string): string => {
            if (!text || language === 'en-IN') return text;

            // Return cached translation immediately if available
            const cached = getCached(language, text);
            if (cached !== undefined) return cached;

            // Not cached — kick off async fetch (deduplicated per language+text)
            const pendingKey = `${language}:${text}`;
            if (!pendingRef.current.has(pendingKey)) {
                pendingRef.current.add(pendingKey);
                setIsTranslating(true);

                translateText(text, language).then(result => {
                    setCached(language, text, result);
                    setIsTranslating(false);
                    notifyAll(); // re-render ALL components that use useTranslate
                });
            }

            // Show original while loading
            return text;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [language, setIsTranslating]
        // Note: intentionally NOT depending on `translations` state — 
        // we read directly from the module-level cache instead.
    );

    return { t, language };
}
