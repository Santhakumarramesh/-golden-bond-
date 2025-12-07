/**
 * Golden Bond - Payment Routes
 * Payment gateway integration endpoints
 */

import { Router, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import {
  createStripeCheckoutSession,
  retrieveStripeSession,
  handleStripeWebhook,
  createCustomerPortalSession,
  cancelStripeSubscription
} from '../services/payments/stripeService';
import {
  createRazorpayOrder,
  handleRazorpayPaymentSuccess,
  handleRazorpayPaymentFailure,
  handleRazorpayWebhook,
  getRazorpayPaymentMethods
} from '../services/payments/razorpayService';

const router = Router();

/**
 * POST /api/payments/stripe/checkout
 * Create Stripe checkout session
 */
router.post('/stripe/checkout', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      res.status(400).json({ error: 'Plan ID is required' });
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const successUrl = `${baseUrl}/payment/success?provider=stripe`;
    const cancelUrl = `${baseUrl}/membership.html?cancelled=true`;

    const session = await createStripeCheckoutSession({
      userId: req.userId!,
      planId: parseInt(planId, 10),
      successUrl,
      cancelUrl
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create checkout session'
    });
  }
});

/**
 * GET /api/payments/stripe/session/:sessionId
 * Retrieve Stripe checkout session status
 */
router.get('/stripe/session/:sessionId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await retrieveStripeSession(sessionId);

    // Verify session belongs to user
    const userId = parseInt(session.metadata?.userId || '0', 10);
    if (userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      sessionId: session.id,
      status: session.payment_status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email
    });

  } catch (error) {
    console.error('Retrieve Stripe session error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

/**
 * POST /api/payments/stripe/webhook
 * Handle Stripe webhook events
 */
router.post('/stripe/webhook', async (req, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    // Note: In production, you should get raw body for signature verification
    // For Express, you might need body-parser with raw body option
    const result = await handleStripeWebhook(req.body, signature);

    if (result.success) {
      res.json({ received: true });
    } else {
      res.status(400).json({ error: result.message });
    }

  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/payments/stripe/portal
 * Create customer portal session
 */
router.post('/stripe/portal', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const returnUrl = `${baseUrl}/membership.html`;

    const session = await createCustomerPortalSession(req.userId!, returnUrl);

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create portal session'
    });
  }
});

/**
 * POST /api/payments/razorpay/order
 * Create Razorpay order
 */
router.post('/razorpay/order', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      res.status(400).json({ error: 'Plan ID is required' });
      return;
    }

    const order = await createRazorpayOrder({
      userId: req.userId!,
      planId: parseInt(planId, 10)
    });

    res.json({
      success: true,
      ...order
    });

  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create order'
    });
  }
});

/**
 * POST /api/payments/razorpay/verify
 * Verify Razorpay payment
 */
router.post('/razorpay/verify', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      res.status(400).json({ error: 'Missing payment details' });
      return;
    }

    const result = await handleRazorpayPaymentSuccess(orderId, paymentId, signature);

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment verified successfully',
        orderId,
        paymentId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Payment verification failed'
    });
  }
});

/**
 * POST /api/payments/razorpay/webhook
 * Handle Razorpay webhook events
 */
router.post('/razorpay/webhook', async (req, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    const result = await handleRazorpayWebhook(req.body, signature);

    if (result.success) {
      res.json({ received: true });
    } else {
      res.status(400).json({ error: result.message });
    }

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/payments/razorpay/methods
 * Get available Razorpay payment methods
 */
router.get('/razorpay/methods', async (req, res: Response) => {
  try {
    const { amount, currency } = req.query;
    
    const amountNum = amount ? parseInt(amount as string, 10) : 0;
    const currencyStr = (currency as string) || 'INR';

    const methods = getRazorpayPaymentMethods(amountNum, currencyStr);

    res.json({
      methods,
      currency: currencyStr
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

/**
 * POST /api/payments/cancel
 * Cancel active subscription
 */
router.post('/cancel', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { provider } = req.body;

    if (provider === 'stripe') {
      await cancelStripeSubscription(req.userId!);
      res.json({ success: true, message: 'Subscription cancelled' });
    } else {
      res.status(400).json({ error: 'Invalid provider or subscription not found' });
    }

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    });
  }
});

export default router;

