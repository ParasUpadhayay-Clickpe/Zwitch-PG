export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const PG_ACCESS = process.env.PG_ACCESS || '';
        const PG_SECRET = process.env.PG_SECRET || '';

        if (!PG_ACCESS || !PG_SECRET) {
            return res.status(500).json({ error: 'Server missing PG_ACCESS/PG_SECRET environment variables' });
        }

        const { mode = 'sandbox', body = {}, access_key } = req.body || {};

        if (!body || typeof body !== 'object') {
            return res.status(400).json({ error: 'body must be a JSON object' });
        }

        const authHeader = `Bearer ${PG_ACCESS}:${PG_SECRET}`;
        const url = mode === 'production'
            ? 'https://api.zwitch.io/v1/pg/payment_token'
            : 'https://api.zwitch.io/v1/pg/sandbox/payment_token';

        const zResp = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const zJson = await zResp.json().catch(() => null);

        const responseData = {
            mode,
            access_key,
            request_body: body,
            response_status: zResp.status,
            response_data: zJson,
            payment_token_id: zJson?.id || null
        };

        return res.status(zResp.status).json({ status: zResp.status, data: zJson, debug: responseData });
    } catch (err) {
        console.error('create-payment-token error', err);
        return res.status(500).json({ error: 'internal server error', details: err.message });
    }
} 