import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Allowed origin ────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://kalaprayag.com';

// ── Rate limiter (30 req/min per IP) ─────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.reset) {
        rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
        return false;
    }
    if (entry.count >= RATE_LIMIT) return true;
    entry.count++;
    return false;
}

// ── Whitelisted Sarvam endpoints ──────────────────────────────────────────────
const ALLOWED_ENDPOINTS = [
    'v1/chat/completions',
    'v1/translate',
    'v1/text-to-speech',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    let endpoint = req.query.endpoint;
    if (Array.isArray(endpoint)) endpoint = endpoint[0];

    // CORS — lock to production domain only
    const origin = req.headers.origin || '';
    if (origin === ALLOWED_ORIGIN || origin.endsWith('.vercel.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api-subscription-key');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Rate limiting
    const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
    if (isRateLimited(ip)) {
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    try {
        const apiKey = process.env.VITE_SARVAM_API_KEY || process.env.SARVAM_API_KEY || '';

        if (!endpoint) {
            return res.status(400).json({ message: 'Missing endpoint parameter in proxy' });
        }

        // Whitelist endpoint to prevent abuse
        if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
            return res.status(403).json({ message: 'Endpoint not allowed' });
        }

        // Safely extract body. Vercel parses JSON automatically if Content-Type is application/json.
        const bodyContent = typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body || {});

        const response = await fetch(`https://api.sarvam.ai/${endpoint}`, {
            method: 'POST',
            headers: {
                'api-subscription-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: bodyContent,
        });

        const dataText = await response.text();
        let data;
        try {
            data = JSON.parse(dataText);
        } catch (e) {
            data = { error: dataText };
        }

        // Return Sarvam error status if it fails
        if (!response.ok) {
            return res.status(response.status).json({
                message: data.message || data.error || `Sarvam API responded with ${response.status}`,
                status: response.status
            });
        }

        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({ message: 'Internal Proxy Error' });
    }
}
