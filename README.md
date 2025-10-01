# Zwitch Payment Flow System

A complete payment integration system for Zwitch payment gateway with Layer checkout, featuring a modern web interface and comprehensive payment management tools.

## 🚀 Features

- **Payment Token Creation**: Generate secure payment tokens via Zwitch API
- **Layer Checkout Integration**: Seamless payment processing with Layer
- **Payment Status Tracking**: Real-time payment status monitoring
- **Response Logging**: Automatic saving of all payment responses
- **Modern UI**: Clean, responsive interface with real-time status indicators
- **Environment Support**: Both sandbox and production environments
- **Auto-refresh**: Real-time payment status updates
- **Payment History**: Complete transaction history with timestamps

## 📋 Prerequisites

- Node.js (v14 or higher)
- Valid Zwitch API credentials (Access Key & Secret Key)
- Modern web browser

## 🛠️ Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd zwitch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   export PG_ACCESS="your_access_key_here"
   export PG_SECRET="your_secret_key_here"
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

The server will start on `http://localhost:3000` (or PORT environment variable).

## 🏗️ Architecture

### Server Components

- **Express.js Server**: Handles API requests and serves static files
- **Proxy Endpoints**: Secure server-side API calls to Zwitch
- **Response Logging**: Automatic saving of payment responses to JSON
- **CORS Support**: Cross-origin request handling

### Client Components

- **Payment Flow Page** (`index.html`): Main payment creation interface
- **Status Checker** (`status.html`): Payment status monitoring
- **Payment History** (`/payment-tokens`): View all transaction history

## 📊 API Endpoints

### Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create-payment-token` | POST | Create payment token via Zwitch API |
| `/payment-status/:id` | GET | Check payment status by token ID |
| `/payment-tokens` | GET | View all saved payment responses |
| `/` | GET | Main payment flow interface |
| `/status.html` | GET | Payment status checker interface |

### Request/Response Formats

#### Create Payment Token
```javascript
// Request
POST /create-payment-token
{
  "mode": "sandbox|production",
  "body": {
    "contact_number": "8630853056",
    "email_id": "user@example.com",
    "currency": "INR",
    "amount": "100",
    "mtx": "mtx_1234567890_abc123",
    "udf": {
      "custom_field": "value"
    }
  },
  "access_key": "ak_test_..."
}

// Response
{
  "status": 200,
  "data": {
    "id": "pt_6068cE54357a25F",
    "status": "created",
    "amount": "100",
    "currency": "INR"
  }
}
```

#### Check Payment Status
```javascript
// Request
GET /payment-status/pt_6068cE54357a25F?mode=sandbox

// Response
{
  "status": 200,
  "data": {
    "status": "captured",
    "amount": "100",
    "currency": "INR",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "payment_token_id": "pt_6068cE54357a25F",
  "mode": "sandbox"
}
```

## 💳 Payment Flow

### 1. Payment Creation Flow

```
User fills payment form → Generate/validate MTX → Build request body → 
Send to /create-payment-token → Server calls Zwitch API → 
API Response Success → Load Layer checkout → User completes payment → 
Redirect to success/failure URL
```

### 2. Payment Status Flow

```
User enters payment token ID → Select environment → 
Send to /payment-status/:id → Server calls Zwitch status API → 
Status Response Success → Display payment details → 
Auto-refresh option → Continue monitoring
```

## 🎨 User Interface

### Main Payment Flow (`/`)

**Configuration Section:**
- Environment selection (Sandbox/Production)
- Access Key input
- Success/Failure redirect URLs
- Callback URL for webhooks

**Payment Details Section:**
- Contact number and email
- Currency and amount selection
- MTX generation (auto or custom)
- User Defined Fields (UDF) JSON input

**Actions:**
- Create Payment Token & Checkout
- Check Payment Status (opens status page)

**Response Display:**
- Real-time status indicators
- Server response details
- Debug information

### Payment Status Checker (`/status.html`)

**Payment Lookup:**
- Environment selection
- Payment Token ID input
- Example token IDs for reference

**Status Display:**
- Color-coded status indicators
- Payment details (amount, currency, timestamps)
- MTX information

**Features:**
- Auto-refresh every 5 seconds
- Raw API response display
- Debug information

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PG_ACCESS` | Zwitch Access Key | Yes | `ak_test_...` |
| `PG_SECRET` | Zwitch Secret Key | Yes | `sk_test_...` |
| `PORT` | Server port | No | `3000` (default) |

### MTX Generation

The system automatically generates Merchant Transaction IDs (MTX) in the format:
```
mtx_{timestamp}_{random_string}
```

Example: `mtx_1704067200000_abc123def456`

### UDF (User Defined Fields)

Custom data can be passed as JSON in the UDF field:
```json
{
  "order_id": "ORD-12345",
  "customer_id": "CUST-67890",
  "metadata": {
    "source": "web",
    "campaign": "summer_sale"
  }
}
```

## 📝 Response Logging

All payment token creation responses are automatically saved to `payment_token.json`:

```json
[
  {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "mode": "sandbox",
    "access_key": "ak_test_...",
    "request_body": { ... },
    "response_status": 200,
    "response_data": { ... },
    "payment_token_id": "pt_6068cE54357a25F"
  }
]
```

## 🔒 Security Features

- **Server-side API calls**: Secret keys never exposed to client
- **CORS protection**: Controlled cross-origin access
- **Input validation**: Comprehensive request validation
- **Error handling**: Secure error responses without sensitive data

## 🚨 Error Handling

### Common Error Scenarios

1. **Missing Credentials**
   - Error: "Server missing PG_ACCESS/PG_SECRET environment variables"
   - Solution: Set environment variables before starting server

2. **Invalid Payment Token**
   - Error: "payment_token_id is required"
   - Solution: Provide valid payment token ID

3. **API Errors**
   - Error: Zwitch API returns error status
   - Solution: Check API credentials and request format

4. **Network Errors**
   - Error: "Request failed"
   - Solution: Check network connectivity and server status

### Debug Information

Each request includes debug information showing:
- Request URL and method
- Request payload
- Response status and data
- Error details (if any)

## 🔄 Auto-refresh Feature

The status checker includes an auto-refresh feature that:
- Checks payment status every 5 seconds
- Visual indicator when active
- Can be toggled on/off
- Useful for monitoring payment completion

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🧪 Testing

### Sandbox Testing

1. Use sandbox environment for testing
2. Test with small amounts
3. Verify all payment statuses (pending, captured, failed)
4. Test error scenarios

### Production Testing

1. Use production environment
2. Test with real payment methods
3. Verify webhook callbacks
4. Monitor payment logs

## 📈 Monitoring

### Payment History

Access payment history at `/payment-tokens` to view:
- All payment attempts
- Request/response details
- Timestamps
- Success/failure rates

### Server Logs

Monitor server console for:
- Payment token creation logs
- API response logs
- Error messages
- File save confirmations

## 🛠️ Troubleshooting

### Server Won't Start
- Check if port 3000 is available
- Verify Node.js installation
- Check environment variables

### Payment Token Creation Fails
- Verify Zwitch API credentials
- Check network connectivity
- Validate request format

### Layer Checkout Not Loading
- Check if Layer script URL is accessible
- Verify payment token is valid
- Check browser console for errors

### Status Check Fails
- Verify payment token ID format
- Check if token exists in Zwitch
- Ensure correct environment selection

## 📞 Support

For issues related to:
- **Zwitch API**: Contact Zwitch support
- **Layer Integration**: Contact Layer support
- **This Application**: Check server logs and debug information

## 📄 License

This project is provided as-is for educational and development purposes.

---

## 🎯 Quick Start Checklist

- [ ] Install Node.js and dependencies
- [ ] Set up Zwitch API credentials
- [ ] Start the server
- [ ] Open `http://localhost:3000`
- [ ] Fill in payment details
- [ ] Test payment creation
- [ ] Check payment status
- [ ] Review payment history

Happy coding! 🚀
