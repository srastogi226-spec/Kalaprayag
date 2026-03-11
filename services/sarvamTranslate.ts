

export const LANGUAGES = [
    { code: 'en-IN', name: 'English', native: 'English', flag: '🇮🇳' },
    { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
    { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
    { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'or-IN', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'as-IN', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
];

export const translateText = async (
    text: string,
    targetLang: string,
    sourceLang: string = 'en-IN'
): Promise<string> => {
    if (targetLang === 'en-IN' || !text.trim()) return text;

    const url = '/api/sarvam?endpoint=translate';

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: text,
                source_language_code: sourceLang,
                target_language_code: targetLang,
                speaker_gender: 'Female',
                mode: 'formal',
                enable_preprocessing: true,
            }),
        });
        if (!res.ok) {
            console.warn('[Sarvam] API error:', res.status, await res.text());
            return text;
        }
        const data = await res.json();
        return data.translated_text || text;
    } catch (err) {
        console.warn('[Sarvam] Fetch failed:', err);
        return text;
    }
};

export const translateBatch = async (
    texts: string[],
    targetLang: string
): Promise<string[]> => {
    if (targetLang === 'en-IN') return texts;
    return Promise.all(texts.map(t => translateText(t, targetLang)));
};
