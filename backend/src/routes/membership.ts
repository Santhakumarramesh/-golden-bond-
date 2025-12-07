/**
 * Golden Bond - Membership Routes
 * Plans, subscriptions, and payment handling
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { MEMBERSHIP_FEATURES } from '../config';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/membership/plans
 * Get all available membership plans
 */
router.get('/plans', async (req, res: Response) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    // Add feature descriptions
    const plansWithDetails = plans.map(plan => ({
      ...plan,
      priceFormatted: formatPrice(plan.price, plan.currency),
      pricePerMonth: plan.durationDays >= 365 
        ? Math.round(plan.price / 12) 
        : plan.price,
      durationFormatted: formatDuration(plan.durationDays)
    }));

    res.json({ plans: plansWithDetails });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

/**
 * GET /api/membership/status
 * Get current user's membership status
 */
router.get('/status', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const membership = await prisma.userMembership.findUnique({
      where: { userId: req.userId },
      include: { plan: true }
    });

    if (!membership) {
      res.json({
        plan: 'FREE',
        isPremium: false,
        features: MEMBERSHIP_FEATURES.FREE
      });
      return;
    }

    const now = new Date();
    const isActive = membership.status === 'ACTIVE' && membership.endDate > now;
    const daysRemaining = isActive 
      ? Math.ceil((membership.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const planSlug = membership.plan.slug.toUpperCase() as keyof typeof MEMBERSHIP_FEATURES;

    res.json({
      plan: membership.plan.name,
      planSlug: membership.plan.slug,
      isPremium: isActive,
      status: membership.status,
      startDate: membership.startDate,
      endDate: membership.endDate,
      daysRemaining,
      features: MEMBERSHIP_FEATURES[planSlug] || MEMBERSHIP_FEATURES.FREE
    });

  } catch (error) {
    console.error('Get membership status error:', error);
    res.status(500).json({ error: 'Failed to get membership status' });
  }
});

/**
 * POST /api/membership/checkout
 * Create a checkout session for a plan
 */
router.post('/checkout', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { planId, paymentMethod } = req.body;

    if (!planId) {
      res.status(400).json({ error: 'Plan ID required' });
      return;
    }

    // Get the plan
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    // In production, you would:
    // 1. Create a Stripe/Razorpay checkout session
    // 2. Return the session URL for redirect
    
    // For demo, we'll simulate the checkout
    const checkoutId = `checkout_${Date.now()}_${req.userId}`;

    res.json({
      checkoutId,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        duration: plan.durationDays
      },
      // In production, this would be the actual payment gateway URL
      redirectUrl: `/payment/process?checkout=${checkoutId}`,
      message: 'Checkout session created. In production, this would redirect to payment gateway.'
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

/**
 * POST /api/membership/activate
 * Activate membership after successful payment (webhook simulation)
 */
router.post('/activate', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { planId, paymentId } = req.body;

    if (!planId) {
      res.status(400).json({ error: 'Plan ID required' });
      return;
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Create or update membership
    const membership = await prisma.userMembership.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId!,
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
    await prisma.payment.create({
      data: {
        membershipId: membership.id,
        provider: 'demo',
        providerPaymentId: paymentId || `demo_${Date.now()}`,
        amount: plan.price,
        currency: plan.currency,
        status: 'SUCCESS'
      }
    });

    res.json({
      message: 'Membership activated successfully!',
      membership: {
        plan: plan.name,
        startDate: now,
        endDate,
        daysRemaining: plan.durationDays
      }
    });

  } catch (error) {
    console.error('Activate membership error:', error);
    res.status(500).json({ error: 'Failed to activate membership' });
  }
});

/**
 * POST /api/membership/cancel
 * Cancel membership (will expire at end of period)
 */
router.post('/cancel', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const membership = await prisma.userMembership.findUnique({
      where: { userId: req.userId }
    });

    if (!membership) {
      res.status(404).json({ error: 'No active membership found' });
      return;
    }

    // In production, you would cancel the subscription with the payment provider
    // For now, we'll just mark it as cancelled (will expire at endDate)

    await prisma.userMembership.update({
      where: { userId: req.userId },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Membership cancelled. You will have access until ' + membership.endDate.toLocaleDateString(),
      endDate: membership.endDate
    });

  } catch (error) {
    console.error('Cancel membership error:', error);
    res.status(500).json({ error: 'Failed to cancel membership' });
  }
});

/**
 * GET /api/membership/history
 * Get payment history
 */
router.get('/history', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const membership = await prisma.userMembership.findUnique({
      where: { userId: req.userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        plan: true
      }
    });

    if (!membership) {
      res.json({ payments: [] });
      return;
    }

    const payments = membership.payments.map(payment => ({
      id: payment.id,
      amount: formatPrice(payment.amount, payment.currency),
      provider: payment.provider,
      status: payment.status,
      date: payment.createdAt
    }));

    res.json({ payments });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

/**
 * Helper: Format price
 */
function formatPrice(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const symbol = symbols[currency] || currency;
  
  // Amount is stored in smallest unit (paise/cents)
  const formatted = (amount / 100).toLocaleString();
  
  return `${symbol}${formatted}`;
}

/**
 * Helper: Format duration
 */
function formatDuration(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years === 1 ? '1 Year' : `${years} Years`;
  } else if (days >= 30) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 Month' : `${months} Months`;
  } else {
    return `${days} Days`;
  }
}

export default router;

