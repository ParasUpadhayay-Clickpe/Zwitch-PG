import { useEffect, useState } from 'react';

export default function Home() {
    const [env, setEnv] = useState('sandbox');
    const [accessKey, setAccessKey] = useState('ak_test_your_access_key_here');
    const [successUrl, setSuccessUrl] = useState('https://example.com/success');
    const [failureUrl, setFailureUrl] = useState('https://example.com/failure');
    const [callbackUrl, setCallbackUrl] = useState('https://example.com/webhook');

    const [contactNumber, setContactNumber] = useState('8630853056');
    const [emailId, setEmailId] = useState('vivekupadhayay18@gmail.com');
    const [currency, setCurrency] = useState('INR');
    const [amount, setAmount] = useState('10');
    const [mtx, setMtx] = useState('');
    const [udf, setUdf] = useState('');

    const [resp, setResp] = useState('—');
    const [respStatus, setRespStatus] = useState('');
    const [debugInfo, setDebugInfo] = useState('—');
    const [loading, setLoading] = useState(false);

    function generateRandomMtx() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `mtx_${timestamp}_${random}`;
    }

    useEffect(() => {
        setMtx(generateRandomMtx());
    }, []);

    function updateResponseStatus(status, message) {
        setRespStatus(`<div class="status-indicator status-${status}">${message}</div>`);
    }

    function buildRequestBody() {
        const id = mtx.trim() || generateRandomMtx();
        let udfObj = {};
        if (udf.trim()) {
            try {
                udfObj = JSON.parse(udf.trim());
            } catch (e) {
                throw new Error('Invalid UDF JSON: ' + e.message);
            }
        }

        return {
            contact_number: contactNumber.trim(),
            email_id: emailId.trim(),
            currency: currency,
            amount: amount.trim(),
            mtx: id,
            udf: udfObj
        };
    }

    async function onCreateToken() {
        setLoading(true);
        setResp('Working...');
        setDebugInfo('');
        updateResponseStatus('pending', 'Creating payment token...');

        try {
            const bodyObj = buildRequestBody();
            bodyObj.redirect_url = successUrl;
            bodyObj.udf = bodyObj.udf || {};
            bodyObj.udf.callback_url = callbackUrl;

            const payload = { mode: env, body: bodyObj, access_key: accessKey };
            setDebugInfo('Request to server (proxy):\n' + JSON.stringify(payload, null, 2));

            const r = await fetch('/api/create-payment-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await r.json().catch(() => null);
            setResp(JSON.stringify({ status: r.status, data: json }, null, 2));

            if (r.status >= 200 && r.status < 300 && json && json.data && json.data.id) {
                const paymentTokenId = json.data.id;
                updateResponseStatus('success', 'Payment token created successfully');
                setDebugInfo(prev => (prev ? prev + '\n\n' : '') + 'Payment token id: ' + paymentTokenId);

                const layerScript = env === 'production' ?
                    'https://payments.open.money/layer' :
                    'https://sandbox-payments.open.money/layer';

                // Load script and call Layer.checkout
                await new Promise((resolve, reject) => {
                    const old = document.getElementById('layer-script');
                    if (old) old.remove();
                    const s = document.createElement('script');
                    s.src = layerScript;
                    s.id = 'layer-script';
                    s.onload = resolve;
                    s.onerror = () => reject(new Error('Failed to load Layer script'));
                    document.body.appendChild(s);
                });

                try {
                    // eslint-disable-next-line no-undef
                    Layer.checkout({
                        token: paymentTokenId,
                        accesskey: accessKey,
                        theme: {
                            logo: 'https://zwitch-logo.png',
                            color: '#3d9080',
                            error_color: '#ff2b2b'
                        },
                        redirect_url: successUrl
                    }, function (response) {
                        if (response.status === 'captured') {
                            window.location.href = successUrl;
                        } else {
                            window.location.href = failureUrl;
                        }
                    }, function (err) {
                        console.error('Layer integration error', err);
                        alert('Checkout integration error — see console');
                    });
                } catch (e) {
                    console.error('Layer invocation failed', e);
                    alert('Layer invocation failed — check console');
                }

            } else {
                updateResponseStatus('error', 'Failed to create payment token');
                alert('Failed to create payment token. Check server response.');
            }

        } catch (err) {
            console.error('Request error', err);
            setResp('Request failed: ' + err.message);
            updateResponseStatus('error', 'Request failed');
            alert('Request to server failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <style jsx>{`
        body { font-family: system-ui, Segoe UI, Roboto, Arial; }
        .container { max-width: 1000px; margin: 18px auto; padding: 18px; background: #f8fafc; }
        .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { color: #1e293b; margin-bottom: 8px; }
        .subtitle { color: #64748b; margin-bottom: 24px; }
        label { display: block; margin-top: 16px; font-weight: 600; color: #374151; }
        input, textarea, select { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; box-sizing: border-box; font-size: 14px; }
        .row { display: flex; gap: 16px; }
        .col { flex: 1; }
        .col2 { flex: 2; }
        button { margin-top: 16px; padding: 12px 20px; border-radius: 8px; border: 0; background: #3d9080; color: #fff; cursor: pointer; font-weight: 600; font-size: 14px; }
        button.secondary { background: #6b7280; margin-left: 8px; }
        pre { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-size: 13px; }
        .section { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
        .section:last-child { border-bottom: none; margin-bottom: 0; }
        .status-indicator { display:inline-block; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600; text-transform:uppercase; }
        .status-success{ background:#dcfce7; color:#166534; }
        .status-error{ background:#fef2f2; color:#dc2626; }
        .status-pending{ background:#fef3c7; color:#d97706; }
        .token-display { background:#f8fafc; border:2px solid #e2e8f0; border-radius:8px; padding:12px; margin:8px 0; font-family: monospace; font-size: 14px; word-break: break-all; }
      `}</style>

            <div className="container">
                <div className="card">
                    <h1>Zwitch Payment Flow</h1>
                    <p className="subtitle">Create payment token and process checkout with Layer</p>

                    <div className="section">
                        <div className="section-title">Configuration</div>
                        <div className="row">
                            <div className="col">
                                <label>Environment</label>
                                <select value={env} onChange={e => setEnv(e.target.value)}>
                                    <option value="sandbox">Sandbox</option>
                                    <option value="production">Production</option>
                                </select>
                            </div>
                            <div className="col2">
                                <label>Access Key (Public)</label>
                                <input value={accessKey} onChange={e => setAccessKey(e.target.value)} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <label>Success Redirect URL</label>
                                <input value={successUrl} onChange={e => setSuccessUrl(e.target.value)} />
                            </div>
                            <div className="col">
                                <label>Failure Redirect URL</label>
                                <input value={failureUrl} onChange={e => setFailureUrl(e.target.value)} />
                            </div>
                        </div>
                        <label>Callback URL (Webhook)</label>
                        <input value={callbackUrl} onChange={e => setCallbackUrl(e.target.value)} />
                    </div>

                    <div className="section">
                        <div className="section-title">Payment Details</div>
                        <div className="row">
                            <div className="col">
                                <label>Contact Number</label>
                                <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                            </div>
                            <div className="col">
                                <label>Email ID</label>
                                <input value={emailId} onChange={e => setEmailId(e.target.value)} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <label>Currency</label>
                                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                                    <option value="INR">INR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                            <div className="col">
                                <label>Amount</label>
                                <input value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                        </div>
                        <label>Merchant Transaction ID (MTX)</label>
                        <div className="row">
                            <div className="col2">
                                <input value={mtx} onChange={e => setMtx(e.target.value)} placeholder="Auto-generated random ID" />
                            </div>
                            <div>
                                <button type="button" className="secondary" onClick={() => setMtx(generateRandomMtx())}>Generate Random</button>
                            </div>
                        </div>
                        <div className="small">Leave empty for auto-generation or enter custom value</div>

                        <label>User Defined Fields (UDF) - JSON</label>
                        <textarea rows={4} value={udf} onChange={e => setUdf(e.target.value)} placeholder='{"key1": "value1", "key2": "value2"}' />
                        <div className="small">Optional: Enter JSON object for custom data</div>
                    </div>

                    <div className="section">
                        <div className="section-title">Actions</div>
                        <button onClick={onCreateToken} disabled={loading}>Create Payment Token & Checkout</button>
                        <a href="/status" target="_blank"><button type="button" className="secondary">Check Payment Status</button></a>
                    </div>

                    <div className="section">
                        <div className="section-title">Response</div>
                        <div dangerouslySetInnerHTML={{ __html: respStatus }} />
                        <pre>{resp}</pre>
                    </div>

                    <div className="section">
                        <div className="section-title">Debug Information</div>
                        <pre>{debugInfo}</pre>
                    </div>
                </div>
            </div>
        </>
    );
} 