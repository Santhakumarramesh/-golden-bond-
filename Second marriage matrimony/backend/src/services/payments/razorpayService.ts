/**
 * Golden Bond - Razorpay Payment Service
 * Handles Razorpay payment gateway integration for Indian market
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export interface CreateRazorpayOrderParams {
  userId: number;
  planId: number;
}

export interface CreateRazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  description: string;
  prefill: {
    email: string;
    name?: string;
  };
  notes: Record<string, string>;
}

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams
): Promise<CreateRazorpayOrderResponse> {
  try {
    // Get user and plan
    const [user, plan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: params.userId },
        include: { profile: true }
      }),
      prisma.membershipPlan.findUnique({
        where: { id: params.planId }
      })
    ]);

    if (!user || !plan || !plan.isActive) {
      throw new Error('User or plan not found');
    }

    // Convert price to rupees (Razorpay expects amount in smallest currency unit)
    const amount = plan.price; // Already in paise
    const currency = plan.currency.toUpperCase();

    // Create order
    const options = {
      amount: amount, // Amount in paise
      currency: currency,
      receipt: `GB_${user.id}_${plan.id}_${Date.now()}`,
      notes: {
        userId: String(user.id),
        planId: String(plan.id),
        planName: plan.name,
        durationDays: String(plan.durationDays)
      }
    };

    const order = await razorpay.orders.create(options);

    const userName = user.profile 
      ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
      : 'User';

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || '',
      name: 'Golden Bond',
      description: `${plan.name} Membership - ${plan.durationDays} days`,
      prefill: {
        email: user.email,
        name: userName
      },
      notes: {
        userId: String(user.id),
        planId: String(plan.id),
        planName: plan.name,
        durationDays: String(plan.durationDays)
      }
    };

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw error;
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error('Razorpay key secret not configured');
    }

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
}

/**
 * Handle Razorpay payment success
 */
export async function handleRazorpayPaymentSuccess(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify signature
    if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
      return { success: false, message: 'Invalid payment signature' };
    }

    // Fetch order details from Razorpay
    const order = await razorpay.orders.fetch(orderId);
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return { success: false, message: 'Payment not successful' };
    }

    // Extract metadata
    const userId = parseInt(order.notes.userId || '0', 10);
    const planId = parseInt(order.notes.planId || '0', 10);

    if (!userId || !planId) {
      return { success: false, message: 'Missing order metadata' };
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return { success: false, message: 'Plan not found' };
    }

    // Calculate membership dates
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Create or update membership
    await prisma.userMembership.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        startDate: now,
        endDate,
        status: 'ACTIVE'
      },
      update: {
        planId: plan.id,
        startDate: now,
        endDate,
        status: 'ACTIVE'
      }
    });

    // Create payment record
    const membership = await prisma.userMembership.findUnique({
      where: { userId }
    });

    if (membership) {
      await prisma.payment.create({
        data: {
          membershipId: membership.id,
          provider: 'razorpay',
          providerPaymentId: paymentId,
          amount: plan.price,
          currency: plan.currency,
          status: 'SUCCESS',
          metadata: {
            orderId,
            paymentId,
            razorpayOrderId: order.id,
            razorpayPaymentId: payment.id
          }
        }
      });
    }

    console.log(`✅ Razorpay payment successful for user ${userId}, plan ${plan.name}`);
    return { success: true, message: 'Payment successful' };

  } catch (error) {
    console.error('Razorpay payment handling error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Payment processing failed' 
    };
  }
}

/**
 * Handle Razorpay payment failure
 */
export async function handleRazorpayPaymentFailure(
  orderId: string,
  paymentId: string,
  errorDescription: string
): Promise<void> {
  try {
    // Fetch order to get userId
    const order = await razorpay.orders.fetch(orderId).catch(() => null);
    
    if (!order) return;

    const userId = parseInt(order.notes?.userId || '0', 10);
    
    if (userId) {
      // Create failed payment record
      await prisma.payment.create({
        data: {
          userId,
          provider: 'razorpay',
          providerPaymentId: paymentId || orderId,
          amount: order.amount,
          currency: order.currency,
          status: 'FAILED',
          metadata: {
            orderId,
            error: errorDescription || 'Payment failed'
          }
        }
      });
    }

    console.log(`❌ Razorpay payment failed: ${paymentId || orderId}`);

  } catch (error) {
    console.error('Razorpay failure handling error:', error);
  }
}

/**
 * Create Razorpay subscription (for recurring payments)
 */
export async function createRazorpaySubscription(
  userId: number,
  planId: number
): Promise<{ subscriptionId: string; shortUrl: string }> {
  try {
    const [user, plan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      }),
      prisma.membershipPlan.findUnique({
        where: { id: planId }
      })
    ]);

    if (!user || !plan) {
      throw new Error('User or plan not found');
    }

    // Create plan in Razorpay if not exists
    const razorpayPlanId = `gb_plan_${plan.id}`;
    
    try {
      await razorpay.plans.fetch(razorpayPlanId);
    } catch {
      // Plan doesn't exist, create it
      await razorpay.plans.create({
        period: plan.durationDays >= 365 ? 'yearly' : 'monthly',
        interval: 1,
        item: {
          name: `${plan.name} Membership`,
          description: `Golden Bond ${plan.name} Plan`,
          amount: plan.price,
          currency: plan.currency
        },
        notes: {
          planId: String(plan.id),
          planName: plan.name
        }
      });
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      notes: {
        userId: String(user.id),
        planId: String(plan.id),
        planName: plan.name
      }
    });

    return {
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url || ''
    };

  } catch (error) {
    console.error('Create Razorpay subscription error:', error);
    throw error;
  }
}

/**
 * Cancel Razorpay subscription
 */
export async function cancelRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    return { success: true, subscription };

  } catch (error) {
    console.error('Cancel Razorpay subscription error:', error);
    throw error;
  }
}

/**
 * Handle Razorpay webhook
 */
export async function handleRazorpayWebhook(
  payload: any,
  signature: string
): Promise<{ success: boolean; message: string }> {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Razorpay webhook secret not configured');
    }

    // Verify webhook signature
    const text = JSON.stringify(payload);
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== signature) {
      return { success: false, message: 'Invalid webhook signature' };
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    switch (event) {
      case 'payment.captured':
      case 'payment.authorized':
        if (paymentEntity) {
          await handleRazorpayPaymentSuccess(
            paymentEntity.order_id,
            paymentEntity.id,
            paymentEntity.signature || ''
          );
        }
        break;

      case 'payment.failed':
        if (paymentEntity) {
          await handleRazorpayPaymentFailure(
            paymentEntity.order_id,
            paymentEntity.id,
            paymentEntity.error_description || 'Payment failed'
          );
        }
        break;

      case 'subscription.activated':
      case 'subscription.charged':
        // Handle subscription events
        console.log('Subscription event:', event);
        break;

      case 'subscription.cancelled':
      case 'subscription.paused':
        // Handle subscription cancellation
        console.log('Subscription cancelled:', payload.payload?.subscription?.entity?.id);
        break;

      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }

    return { success: true, message: 'Webhook processed' };

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Webhook processing failed' 
    };
  }
}

/**
 * Get payment methods available for Razorpay
 */
export function getRazorpayPaymentMethods(amount: number, currency: string) {
  const methods: string[] = ['card', 'netbanking', 'wallet', 'upi'];
  
  // Add more methods based on amount
  if (amount >= 100000) { // ₹1000+
    methods.push('emi');
  }

  // Razorpay supports these by default in India
  return methods;
}

