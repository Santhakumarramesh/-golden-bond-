# Payment Gateway Integration Guide

Complete guide for setting up Stripe and Razorpay payment gateways for Golden Bond.

## 🔧 Setup Instructions

### 1. Stripe Setup (International)

#### Get API Keys:
1. Sign up at https://stripe.com
2. Go to **Developers → API keys**
3. Copy **Publishable key** and **Secret key**

#### Environment Variables:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Webhook Configuration:
1. Go to **Developers → Webhooks**
2. Add endpoint: `https://yourdomain.com/api/payments/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret

### 2. Razorpay Setup (India)

#### Get API Keys:
1. Sign up at https://razorpay.com
2. Go to **Settings → API Keys**
3. Generate **Key ID** and **Key Secret**

#### Environment Variables:
```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

#### Webhook Configuration:
1. Go to **Settings → Webhooks**
2. Add URL: `https://yourdomain.com/api/payments/razorpay/webhook`
3. Select events:
   - `payment.captured`
   - `payment.authorized`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
4. Copy webhook secret

## 📦 Installation

```bash
cd backend
npm install stripe razorpay
```

## 🔐 Environment Variables

Add to `.env`:

```env
# Stripe (International)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Razorpay (India)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## 🚀 Usage

### Frontend (JavaScript)

```javascript
// Auto-select provider based on currency
await handlePayment(planId, planName, amount, 'INR', 'auto');

// Or specify provider
await handlePayment(planId, planName, amount, 'INR', 'razorpay');
await handlePayment(planId, planName, amount, 'USD', 'stripe');
```

### Backend Routes

**Stripe:**
- `POST /api/payments/stripe/checkout` - Create checkout session
- `GET /api/payments/stripe/session/:id` - Get session status
- `POST /api/payments/stripe/webhook` - Handle webhooks
- `POST /api/payments/stripe/portal` - Customer portal

**Razorpay:**
- `POST /api/payments/razorpay/order` - Create order
- `POST /api/payments/razorpay/verify` - Verify payment
- `POST /api/payments/razorpay/webhook` - Handle webhooks
- `GET /api/payments/razorpay/methods` - Get payment methods

## 🧪 Testing

### Stripe Test Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Razorpay Test Cards:
- Success: `4111 1111 1111 1111`
- Failure: `5104 0600 0000 0008`
- Any CVV, any expiry in future

## 📋 Payment Flow

1. **User selects plan** → Frontend calls `/api/payments/{provider}/checkout`
2. **Backend creates session/order** → Returns checkout URL
3. **User completes payment** → Redirected to payment gateway
4. **Payment success** → Webhook received → Membership activated
5. **User redirected** → `payment-success.html` with verification

## 🔒 Security

- ✅ Webhook signature verification
- ✅ Payment verification on server
- ✅ No sensitive data in frontend
- ✅ HTTPS required in production
- ✅ Rate limiting on payment endpoints

## 🐛 Troubleshooting

**Stripe:**
- Check webhook URL is accessible
- Verify webhook secret matches
- Check API keys are correct
- Use Stripe Dashboard logs

**Razorpay:**
- Verify key ID and secret
- Check webhook URL is correct
- Test with test mode first
- Check Razorpay Dashboard logs

## 📞 Support

- Stripe: https://support.stripe.com
- Razorpay: https://razorpay.com/support

---

**Note:** In production, use live API keys and configure webhooks properly.

