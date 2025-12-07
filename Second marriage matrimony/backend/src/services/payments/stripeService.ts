/**
 * Golden Bond - Stripe Payment Service
 * Handles Stripe payment gateway integration
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Stripe (only if key is configured)
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
}

function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return stripe;
}

export interface CreateCheckoutSessionParams {
  userId: number;
  planId: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create Stripe checkout session
 */
export async function createStripeCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResponse> {
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

    // Convert price from paise/cents to smallest currency unit
    const amount = plan.price; // Already in smallest unit
    const currency = plan.currency.toLowerCase();

    const stripeInstance = getStripe();

    // Create Stripe customer (or get existing)
    let customerId: string;
    const existingCustomer = await stripeInstance.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomer.data.length > 0) {
      customerId = existingCustomer.data[0].id;
    } else {
      const customer = await stripeInstance.customers.create({
        email: user.email,
        name: user.profile ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() : undefined,
        metadata: {
          goldenbondUserId: String(user.id)
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripeInstance.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `${plan.name} Membership - Golden Bond`,
              description: `Premium membership for ${plan.durationDays} days`,
              images: ['https://goldenbond.com/logo.png'], // Your logo URL
            },
            unit_amount: amount,
            recurring: plan.durationDays >= 365 ? {
              interval: 'year',
              interval_count: 1
            } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: plan.durationDays >= 365 ? 'subscription' : 'payment',
      success_url: params.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: params.cancelUrl,
      metadata: {
        userId: String(user.id),
        planId: String(plan.id),
        planName: plan.name,
        durationDays: String(plan.durationDays)
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return {
      sessionId: session.id,
      url: session.url || ''
    };

  } catch (error) {
    console.error('Stripe checkout session error:', error);
    throw error;
  }
}

/**
 * Verify and retrieve checkout session
 */
export async function retrieveStripeSession(sessionId: string) {
  try {
    const stripeInstance = getStripe();
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent']
    });

    return session;
  } catch (error) {
    console.error('Retrieve Stripe session error:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook event
 */
export async function handleStripeWebhook(
  event: Stripe.Event,
  signature: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const stripeInstance = getStripe();

    // Verify the event came from Stripe
    const verifiedEvent = stripeInstance.webhooks.constructEvent(
      JSON.stringify(event),
      signature,
      webhookSecret
    );

    // Handle the event
    switch (verifiedEvent.type) {
      case 'checkout.session.completed': {
        const session = verifiedEvent.data.object as Stripe.Checkout.Session;
        await handlePaymentSuccess(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = verifiedEvent.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = verifiedEvent.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = verifiedEvent.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = verifiedEvent.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${verifiedEvent.type}`);
    }

    return { success: true, message: 'Webhook processed' };

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Webhook processing failed' };
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  const userId = parseInt(session.metadata?.userId || '0', 10);
  const planId = parseInt(session.metadata?.planId || '0', 10);

  if (!userId || !planId) {
    console.error('Missing metadata in Stripe session');
    return;
  }

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    console.error('Plan not found:', planId);
    return;
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
        provider: 'stripe',
        providerPaymentId: session.payment_intent as string || session.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'SUCCESS',
        metadata: {
          sessionId: session.id,
          customerId: session.customer as string,
          subscriptionId: session.subscription as string || null
        }
      }
    });
  }

  console.log(`✅ Membership activated for user ${userId}, plan ${plan.name}`);
}

/**
 * Handle payment failure
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  
  if (userId) {
    // Create failed payment record
    await prisma.payment.create({
      data: {
        userId: parseInt(userId, 10),
        provider: 'stripe',
        providerPaymentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'FAILED',
        metadata: {
          error: paymentIntent.last_payment_error?.message || 'Payment failed'
        }
      }
    });
  }

  console.log(`❌ Payment failed: ${paymentIntent.id}`);
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const stripeInstance = getStripe();
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const customer = await stripeInstance.customers.retrieve(customerId);
  
  if (customer.deleted) return;

  const user = await prisma.user.findUnique({
    where: { email: (customer as Stripe.Customer).email || '' }
  });

  if (!user) return;

  // Update membership end date
  if (subscription.current_period_end) {
    const endDate = new Date(subscription.current_period_end * 1000);
    
    await prisma.userMembership.updateMany({
      where: { userId: user.id },
      data: { 
        endDate,
        status: subscription.status === 'active' ? 'ACTIVE' : 'EXPIRED'
      }
    });
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const stripeInstance = getStripe();
  const customerId = subscription.customer as string;
  
  const customer = await stripeInstance.customers.retrieve(customerId);
  if (customer.deleted) return;

  const user = await prisma.user.findUnique({
    where: { email: (customer as Stripe.Customer).email || '' }
  });

  if (!user) return;

  // Mark membership as expired
  await prisma.userMembership.updateMany({
    where: { userId: user.id },
    data: { 
      status: 'EXPIRED',
      endDate: new Date() // Expire immediately
    }
  });

  console.log(`Subscription cancelled for user ${user.id}`);
}

/**
 * Create customer portal session (for managing subscription)
 */
export async function createCustomerPortalSession(
  userId: number,
  returnUrl: string
): Promise<{ url: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const stripeInstance = getStripe();

    // Find Stripe customer
    const customers = await stripeInstance.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      throw new Error('Stripe customer not found');
    }

    const customerId = customers.data[0].id;

    // Create portal session
    const session = await stripeInstance.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };

  } catch (error) {
    console.error('Create portal session error:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelStripeSubscription(userId: number) {
  try {
    const membership = await prisma.userMembership.findUnique({
      where: { userId },
      include: { payments: true }
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    // Find subscription ID from payment metadata
    const payment = membership.payments.find(p => 
      p.metadata && typeof p.metadata === 'object' && 
      'subscriptionId' in p.metadata
    );

    if (!payment || !payment.metadata || typeof payment.metadata !== 'object') {
      throw new Error('Subscription not found');
    }

    const subscriptionId = (payment.metadata as any).subscriptionId;

    if (subscriptionId) {
      const stripeInstance = getStripe();
      await stripeInstance.subscriptions.cancel(subscriptionId);
    }

    // Update membership status
    await prisma.userMembership.update({
      where: { userId },
      data: { status: 'CANCELLED' }
    });

    return { success: true };

  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
}

