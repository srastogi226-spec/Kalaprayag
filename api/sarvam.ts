import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    let endpoint = req.query.endpoint;
    if (Array.isArray(endpoint)) endpoint = endpoint[0];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api-subscription-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const apiKey = process.env.VITE_SARVAM_API_KEY || process.env.SARVAM_API_KEY || '';

        if (!endpoint) {
            return res.status(400).json({ message: 'Missing endpoint parameter in proxy' });
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

        // Return exact Sarvam error if it fails
        if (!response.ok) {
            return res.status(response.status).json({
                message: data.message || data.error || `Sarvam API responded with ${response.status}`,
                sarvamResponse: data,
                status: response.status
            });
        }

        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({ message: 'Internal Proxy Error', details: error.message });
    }
}
