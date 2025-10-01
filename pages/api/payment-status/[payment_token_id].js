export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const NEXT_PUBLIC_PG_ACCESS = process.env.NEXT_PUBLIC_PG_ACCESS || '';
        const NEXT_PUBLIC_PG_SECRET = process.env.NEXT_PUBLIC_PG_SECRET || '';

        if (!NEXT_PUBLIC_PG_ACCESS || !NEXT_PUBLIC_PG_SECRET) {
            return res.status(500).json({ error: 'Server missing PG_ACCESS/PG_SECRET environment variables' });
        }

        const { payment_token_id } = req.query;
        const { mode = 'sandbox' } = req.query;

        if (!payment_token_id) {
            return res.status(400).json({ error: 'payment_token_id is required' });
        }

        const authHeader = `Bearer ${PG_ACCESS}:${PG_SECRET}`;

        const baseUrl = mode === 'production'
            ? 'https://api.zwitch.io/v1/pg/payment_token'
            : 'https://api.zwitch.io/v1/pg/sandbox/payment_token';

        const url = `${baseUrl}/${payment_token_id}/payment`;

        const zResp = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        const zJson = await zResp.json().catch(() => null);

        return res.status(zResp.status).json({
            status: zResp.status,
            data: zJson,
            payment_token_id,
            mode
        });

    } catch (err) {
        console.error('payment-status error', err);
        return res.status(500).json({ error: 'internal server error', details: err.message });
    }
} 