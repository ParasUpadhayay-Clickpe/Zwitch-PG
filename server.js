// server.js
// Minimal proxy server to create Zwitch payment_token.
// USAGE:
//   PG_ACCESS and PG_SECRET must be provided as env vars (server only).
//   Run: PG_ACCESS="ak_test_..." PG_SECRET="sk_test_..." node server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// config: default port
const PORT = process.env.PORT || 3000;

// Your PG keys (keep these secret)
const PG_ACCESS = process.env.PG_ACCESS || '';
const PG_SECRET = process.env.PG_SECRET || '';

if (!PG_ACCESS || !PG_SECRET) {
    console.warn('WARNING: PG_ACCESS or PG_SECRET not set. Server will still run but requests will fail.');
}

// Helper: choose endpoint based on env param
function paymentTokenUrl(mode) {
    // mode: 'production' or 'sandbox' (default sandbox)
    if (mode === 'production') {
        // production payment_token endpoint
        return 'https://api.zwitch.io/v1/pg/payment_token';
    }
    // sandbox
    return 'https://api.zwitch.io/v1/pg/sandbox/payment_token';
}

// Helper: save payment token response to file
async function savePaymentTokenResponse(responseData) {
    try {
        const filePath = path.join(__dirname, 'payment_token.json');
        const timestamp = new Date().toISOString();

        // Read existing data or create new array
        let existingData = [];
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            existingData = JSON.parse(fileContent);
        } catch (err) {
            // File doesn't exist or is empty, start with empty array
        }

        // Add new response with timestamp
        const newEntry = {
            timestamp,
            ...responseData
        };

        existingData.push(newEntry);

        // Save updated data
        await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
        console.log(`Payment token response saved to ${filePath}`);
    } catch (err) {
        console.error('Error saving payment token response:', err);
    }
}

// POST /create-payment-token
// Body expected: { mode: 'sandbox'|'production', body: {...}, access_key: 'ak_...' }
// `body` should contain contact_number, email_id, currency, amount, mtx, udf etc.
app.post('/create-payment-token', async (req, res) => {
    try {
        const { mode = 'sandbox', body = {}, access_key } = req.body;

        // Basic validation
        if (!body || typeof body !== 'object') {
            return res.status(400).json({ error: 'body must be a JSON object' });
        }

        // Server must use secret key to call Zwitch
        if (!PG_ACCESS || !PG_SECRET) {
            return res.status(500).json({ error: 'Server missing PG_ACCESS/PG_SECRET environment variables' });
        }

        // Build Authorization header using PG_ACCESS:PG_SECRET (server-side secret)
        const authHeader = `Bearer ${PG_ACCESS}:${PG_SECRET}`;

        const url = paymentTokenUrl(mode);

        // Dynamic import for node-fetch v3
        const { default: fetch } = await import('node-fetch');

        const zResp = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(body),
        });

        const zJson = await zResp.json().catch(() => null);

        // Prepare response data for saving
        const responseData = {
            mode,
            access_key,
            request_body: body,
            response_status: zResp.status,
            response_data: zJson,
            payment_token_id: zJson?.id || null
        };

        // Save response to file (async, don't wait)
        savePaymentTokenResponse(responseData);

        // Mirror status and body back to client for debugging
        return res.status(zResp.status).json({ status: zResp.status, data: zJson });

    } catch (err) {
        console.error('create-payment-token error', err);
        return res.status(500).json({ error: 'internal server error', details: err.message });
    }
});

// GET /payment-status/:payment_token_id
// Check payment status using payment token ID
app.get('/payment-status/:payment_token_id', async (req, res) => {
    try {
        const { payment_token_id } = req.params;
        const { mode = 'sandbox' } = req.query;

        // Basic validation
        if (!payment_token_id) {
            return res.status(400).json({ error: 'payment_token_id is required' });
        }

        // Server must use secret key to call Zwitch
        if (!PG_ACCESS || !PG_SECRET) {
            return res.status(500).json({ error: 'Server missing PG_ACCESS/PG_SECRET environment variables' });
        }

        // Build Authorization header using PG_ACCESS:PG_SECRET (server-side secret)
        const authHeader = `Bearer ${PG_ACCESS}:${PG_SECRET}`;

        // Choose endpoint based on mode
        const baseUrl = mode === 'production'
            ? 'https://api.zwitch.io/v1/pg/payment_token'
            : 'https://api.zwitch.io/v1/pg/sandbox/payment_token';

        const url = `${baseUrl}/${payment_token_id}/payment`;

        // Dynamic import for node-fetch v3
        const { default: fetch } = await import('node-fetch');

        const zResp = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        const zJson = await zResp.json().catch(() => null);

        // Mirror status and body back to client
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
});

// GET /payment-tokens - View saved payment token responses
app.get('/payment-tokens', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'payment_token.json');
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        res.json(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.json([]);
        } else {
            res.status(500).json({ error: 'Failed to read payment tokens file' });
        }
    }
});

// Serve static files
app.use(express.static('.'));

app.listen(PORT, () => {
    console.log(`Zwitch proxy server listening on http://localhost:${PORT}`);
    console.log(`Test pages available at:`);
    console.log(`  - Payment flow: http://localhost:${PORT}`);
    console.log(`  - Payment status: http://localhost:${PORT}/status.html`);
    console.log(`  - Payment tokens history: http://localhost:${PORT}/payment-tokens`);
});
