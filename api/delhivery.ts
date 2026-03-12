import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { path } = req.query;
    if (!path || typeof path !== 'string') {
        return res.status(400).json({ error: 'Missing path parameter' });
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
        return res.status(500).json({ error: 'Proxy request failed', details: err.message });
    }
}
