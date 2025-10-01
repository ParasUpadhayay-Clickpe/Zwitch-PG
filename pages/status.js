import { useState } from 'react';

export default function StatusPage() {
    const [env, setEnv] = useState('sandbox');
    const [paymentTokenId, setPaymentTokenId] = useState('');
    const [statusDisplay, setStatusDisplay] = useState('<p class="muted">Enter a payment token ID and click "Check Payment Status"</p>');
    const [rawResponse, setRawResponse] = useState('—');
    const [debugInfo, setDebugInfo] = useState('—');
    const [loading, setLoading] = useState(false);
    const [autoRefreshing, setAutoRefreshing] = useState(false);
    const [intervalId, setIntervalId] = useState(null);

    function getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'captured':
            case 'success':
            case 'completed':
                return 'status-success';
            case 'failed':
            case 'error':
                return 'status-failed';
            case 'pending':
            case 'processing':
            case 'initiated':
                return 'status-pending';
            default:
                return '';
        }
    }

    function formatStatus(status) {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    async function checkPaymentStatus() {
        if (!paymentTokenId.trim()) {
            alert('Please enter a payment token ID');
            return;
        }

        setLoading(true);
        setStatusDisplay('<p class="muted">Checking payment status...</p>');
        setRawResponse('—');
        setDebugInfo('—');

        try {
            const url = `/api/payment-status/${encodeURIComponent(paymentTokenId)}?mode=${env}`;
            setDebugInfo(`Request URL: ${url}\nMethod: GET`);

            const response = await fetch(url);
            const data = await response.json();
            setRawResponse(JSON.stringify(data, null, 2));

            if (response.ok && data.data) {
                const paymentData = data.data;
                const status = paymentData.status || paymentData.payment_status;
                const statusClass = getStatusClass(status);

                setStatusDisplay(`
          <div class="payment-info">
            <h4>Payment Status: <span class="status-indicator ${statusClass}">${formatStatus(status)}</span></h4>
            <p><strong>Payment Token ID:</strong> ${paymentTokenId}</p>
            <p><strong>Environment:</strong> ${env}</p>
            ${paymentData.amount ? `<p><strong>Amount:</strong> ${paymentData.amount} ${paymentData.currency || ''}</p>` : ''}
            ${paymentData.created_at ? `<p><strong>Created:</strong> ${new Date(paymentData.created_at).toLocaleString()}</p>` : ''}
            ${paymentData.updated_at ? `<p><strong>Updated:</strong> ${new Date(paymentData.updated_at).toLocaleString()}</p>` : ''}
            ${paymentData.mtx ? `<p><strong>MTX:</strong> ${paymentData.mtx}</p>` : ''}
          </div>
        `);
            } else {
                setStatusDisplay(`
          <div class="payment-info">
            <h4 class="status-failed">Error checking payment status</h4>
            <p><strong>Status:</strong> ${response.status}</p>
            <p><strong>Error:</strong> ${data.error || 'Unknown error'}</p>
          </div>
        `);
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            setStatusDisplay(`
        <div class="payment-info">
          <h4 class="status-failed">Request failed</h4>
          <p><strong>Error:</strong> ${error.message}</p>
        </div>
      `);
            setDebugInfo(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    function toggleAutoRefresh() {
        if (autoRefreshing) {
            clearInterval(intervalId);
            setIntervalId(null);
            setAutoRefreshing(false);
        } else {
            const id = setInterval(checkPaymentStatus, 5000);
            setIntervalId(id);
            setAutoRefreshing(true);
        }
    }

    return (
        <>
            <style jsx>{`
        .container { max-width: 1000px; margin: 18px auto; padding: 18px; background: #f8fafc; }
        .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { color: #1e293b; margin-bottom: 8px; }
        .subtitle { color: #64748b; margin-bottom: 24px; }
        label { display: block; margin-top: 16px; font-weight: 600; color: #374151; }
        input, select { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; box-sizing: border-box; font-size: 14px; }
        .row { display: flex; gap: 16px; }
        .col { flex: 1; }
        .col2 { flex: 2; }
        button { margin-top: 16px; padding: 12px 20px; border-radius: 8px; border: 0; background: #3d9080; color: #fff; cursor: pointer; font-weight: 600; font-size: 14px; }
        button.secondary { background: #6b7280; margin-left: 8px; }
        button.danger { background: #ef4444; }
        pre { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-size: 13px; }
        .section { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
        .section:last-child { border-bottom: none; margin-bottom: 0; }
        .status-indicator { display:inline-block; padding:8px 16px; border-radius:6px; font-size:14px; font-weight:600; text-transform:uppercase; }
        .status-success{ background:#dcfce7; color:#166534; }
        .status-failed{ background:#fef2f2; color:#dc2626; }
        .status-pending{ background:#fef3c7; color:#d97706; }
        .payment-info { background:#f8fafc; border:2px solid #e2e8f0; border-radius:8px; padding:16px; margin:16px 0; }
        .nav { margin-bottom: 24px; }
        .nav a { color:#3d9080; text-decoration:none; margin-right:16px; font-weight:500; }
        .nav a:hover { text-decoration: underline; }
      `}</style>

            <div className="container">
                <div className="nav">
                    <a href="/">← Back to Payment Flow</a>
                    <a href="/api/payment-tokens" target="_blank">View Payment History</a>
                </div>
                <div className="card">
                    <h1>Payment Status Checker</h1>
                    <p className="subtitle">Check the status of any payment using the payment token ID</p>

                    <div className="section">
                        <div className="section-title">Payment Lookup</div>
                        <div className="row">
                            <div className="col">
                                <label>Environment</label>
                                <select value={env} onChange={e => setEnv(e.target.value)}>
                                    <option value="sandbox">Sandbox</option>
                                    <option value="production">Production</option>
                                </select>
                            </div>
                            <div className="col2">
                                <label>Payment Token ID</label>
                                <input value={paymentTokenId} onChange={e => setPaymentTokenId(e.target.value)} placeholder="pt_6068cE54357a25F" />
                            </div>
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <button onClick={checkPaymentStatus} disabled={loading}>Check Payment Status</button>
                            <button className={`secondary ${autoRefreshing ? 'danger' : ''}`} onClick={toggleAutoRefresh}>
                                {autoRefreshing ? 'Stop Auto Refresh' : 'Auto Refresh (5s)'}
                            </button>
                        </div>
                    </div>

                    <div className="section">
                        <div className="section-title">Payment Status</div>
                        <div dangerouslySetInnerHTML={{ __html: statusDisplay }} />
                    </div>

                    <div className="section">
                        <div className="section-title">Raw Response</div>
                        <pre>{rawResponse}</pre>
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