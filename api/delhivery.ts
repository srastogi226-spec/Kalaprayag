import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Allowed origin (lock to your production domain) ─────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://kalaprayag.com';

// ── Simple in-memory rate limiter (20 req/min per IP) ────────────────────────
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 20;
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

// ── Allowed Delhivery API path prefixes (prevent SSRF) ───────────────────────
const ALLOWED_PATHS = [
    'c/api/pin-codes/json/',
    'api/cmu/create.json',
    'api/v1/packages/json/',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS — lock to production domain
    const origin = req.headers.origin || '';
    if (origin === ALLOWED_ORIGIN || origin.endsWith('.vercel.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate limiting
    const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { path } = req.query;
    if (!path || typeof path !== 'string') {
        return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Validate path to prevent SSRF / path traversal
    const isAllowed = ALLOWED_PATHS.some(allowed => path.startsWith(allowed));
    if (!isAllowed) {
        return res.status(403).json({ error: 'Path not allowed' });
    }

    const token = process.env.VITE_DELHIVERY_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'Delhivery token not configured' });
    }

    const url = `https://track.delhivery.com/${path}`;

    try {
        const fetchOptions: RequestInit = {
            method: req.method || 'GET',
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': req.headers['content-type'] as string || 'application/json',
            },
        };

        if (req.method !== 'GET' && req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const response = await fetch(url, fetchOptions);
        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (err: any) {
        console.error('[Delhivery Proxy] Error:', err.message);
        return res.status(500).json({ error: 'Proxy request failed' });
    }
}
