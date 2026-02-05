const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Get user subscription details - IMPROVED VERSION
router.get('/subscription', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await User.getById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Initialize with database values
    let subscriptionData = {
      isPro: user.is_pro === 1,
      plan: user.subscription_plan || 'free',
      status: 'active',
      currentPeriodEnd: user.current_period_end,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      subscriptionId: user.subscription_id,
      customerId: user.stripe_customer_id,
      amount: user.subscription_plan === 'monthly' ? '$19.99' : 
              user.subscription_plan === 'yearly' ? '$199.99' : '$0',
      period: user.subscription_plan === 'yearly' ? 'year' : 'month'
    };

    console.log('📊 Database values:', {
      is_pro: user.is_pro,
      subscription_plan: user.subscription_plan,
      current_period_end: user.current_period_end,
      cancel_at_period_end: user.cancel_at_period_end,
      cancel_at: user.cancel_at
    });

    // If user has Stripe subscription, get latest info
    if (user.stripe_customer_id && user.subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.subscription_id, {
          expand: ['latest_invoice']
        });
        
        console.log('✅ Stripe subscription details:', {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          cancel_at: subscription.cancel_at,
          current_period_end: subscription.current_period_end,
          latest_invoice_status: subscription.latest_invoice?.status
        });

        // **FIXED: Better cancellation detection**
        let subscriptionStatus = subscription.status;
        let cancelAtPeriodEnd = subscription.cancel_at_period_end;
        
        // **NEW LOGIC: If cancel_at exists but cancel_at_period_end is false, treat as canceling**
        if (subscription.cancel_at && !subscription.cancel_at_period_end) {
          console.log('⚠️ cancel_at exists but cancel_at_period_end is false - treating as cancelled');
          subscriptionStatus = 'canceling';
          cancelAtPeriodEnd = true;
        }
        
        // **ALSO: Check if subscription is past due or unpaid**
        if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          console.log('⚠️ Subscription has payment issues:', subscription.status);
        }

        // Calculate expiry date
        let currentPeriodEnd = user.current_period_end;
        if (subscription.current_period_end) {
          currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }
        
        // Calculate cancel date
        let cancelAt = null;
        if (subscription.cancel_at) {
          cancelAt = new Date(subscription.cancel_at * 1000);
        }

        subscriptionData = {
          ...subscriptionData,
          status: subscriptionStatus,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: cancelAtPeriodEnd,
          cancelAt: cancelAt,
          amount: subscription.items.data[0]?.price.unit_amount 
            ? `$${(subscription.items.data[0]?.price.unit_amount / 100).toFixed(2)}`
            : subscriptionData.amount,
          period: subscription.items.data[0]?.price.recurring?.interval || subscriptionData.period
        };

        console.log('📊 Updated subscriptionData:', {
          status: subscriptionData.status,
          cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
          cancelAt: subscriptionData.cancelAt
        });

        // **FIXED: Update database with accurate information**
        const dbUpdates = {
          subscription_status: subscriptionStatus,
          cancel_at_period_end: cancelAtPeriodEnd,
          current_period_end: currentPeriodEnd
        };
        
        if (cancelAt) {
          dbUpdates.cancel_at = cancelAt;
        }
        
        // If subscription is truly canceled, update is_pro
        if (subscription.status === 'canceled' || subscriptionStatus === 'canceling') {
          dbUpdates.is_pro = 1; // Keep Pro until period end
          console.log('✅ Subscription marked as canceling - keeping Pro access');
        }

        if (subscription.items && subscription.items.data[0]?.price) {
  const price = subscription.items.data[0].price;
  if (price.recurring?.interval === 'year') {
    dbUpdates.subscription_plan = 'yearly';
  } else if (price.recurring?.interval === 'month') {
    dbUpdates.subscription_plan = 'monthly';
  }
}

        console.log('💾 Database updates:', dbUpdates);
        await User.update(user.id, dbUpdates);

      } catch (stripeError) {
        console.warn('⚠️ Stripe subscription not found:', stripeError.message);
        // Keep database values when Stripe fails
      }
    }

    console.log('📤 Final subscriptionData:', subscriptionData);

    res.json({
      success: true,
      ...subscriptionData
    });

  } catch (error) {
    console.error('❌ Get subscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Stripe Customer Portal session
router.post('/create-portal-session', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await User.getById(req.session.userId);
    
    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({ success: false, error: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: req.body.returnUrl || `${process.env.FRONTEND_URL}/subscription`,
    });

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Change subscription plan
// Change subscription plan - FIXED VERSION
router.post('/change-plan', async (req, res) => {
  try {
    console.log('🔄 Change plan request received:', req.body);
    
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { newPlan } = req.body;
    const user = await User.getById(req.session.userId);
    
    if (!user || !user.subscription_id) {
      return res.status(404).json({ success: false, error: 'No active subscription' });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
    
    // Get price ID for new plan
    const priceId = newPlan === 'yearly' 
      ? process.env.STRIPE_YEARLY_PRICE_ID 
      : process.env.STRIPE_MONTHLY_PRICE_ID;
    
    if (!priceId) {
      return res.status(400).json({ success: false, error: 'Price not configured' });
    }

    // **FIXED: Calculate proper expiry date BEFORE changing plan**
    let newExpiryDate;
    
    // If we have current period end from Stripe, use it
    if (subscription.current_period_end) {
      newExpiryDate = new Date(subscription.current_period_end * 1000);
    } 
    // If we have it from database, use it
    else if (user.current_period_end) {
      newExpiryDate = new Date(user.current_period_end);
    }
    // Otherwise calculate from now
    else {
      newExpiryDate = new Date();
    }

    console.log('📅 Current expiry:', newExpiryDate);
    console.log('🔄 Changing from', user.subscription_plan, 'to', newPlan);

    // **CRITICAL FIX: Calculate new expiry based on plan change**
    const now = new Date();
    
    // Case 1: Yearly to Monthly - should extend by 1 month from current period end
    if (user.subscription_plan === 'yearly' && newPlan === 'monthly') {
      console.log('📊 Yearly → Monthly conversion');
      
      if (subscription.current_period_end) {
        // Use Stripe's current period end as base
        newExpiryDate = new Date(subscription.current_period_end * 1000);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      } else {
        // Fallback: Add 1 month from now
        newExpiryDate = new Date(now);
        newExpiryDate.setMonth(now.getMonth() + 1);
      }
    }
    // Case 2: Monthly to Yearly - should extend by 1 year from current period end
    else if (user.subscription_plan === 'monthly' && newPlan === 'yearly') {
      console.log('📊 Monthly → Yearly conversion');
      
      if (subscription.current_period_end) {
        newExpiryDate = new Date(subscription.current_period_end * 1000);
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      } else {
        newExpiryDate = new Date(now);
        newExpiryDate.setFullYear(now.getFullYear() + 1);
      }
    }
    // Case 3: Same plan type (shouldn't happen but handle it)
    else {
      console.log('📊 Same plan type, keeping existing expiry');
    }

    console.log('📅 New calculated expiry:', newExpiryDate);

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(
      user.subscription_id,
      {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations',
      }
    );

    // **FIXED: Always get the ACTUAL expiry from Stripe after update**
    let finalExpiryDate;
    
    // First try to get from updated subscription
    if (updatedSubscription.current_period_end) {
      finalExpiryDate = new Date(updatedSubscription.current_period_end * 1000);
      console.log('✅ Using Stripe current_period_end:', finalExpiryDate);
    } 
    // If Stripe doesn't provide it, use our calculated date
    else {
      finalExpiryDate = newExpiryDate;
      console.log('⚠️ Stripe didn\'t provide expiry, using calculated:', finalExpiryDate);
    }

    // Update user in database
    await User.update(user.id, {
      subscription_plan: newPlan,
      current_period_end: finalExpiryDate
    });

    console.log('✅ Plan change completed successfully');
    
    res.json({
      success: true,
      message: 'Plan changed successfully',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: finalExpiryDate,
        plan: newPlan
      }
    });

  } catch (error) {
    console.error('❌ Change plan error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { reason, otherReason, keepFeatures } = req.body;
    const user = await User.getById(req.session.userId);
    
    if (!user || !user.subscription_id) {
      return res.status(404).json({ success: false, error: 'No active subscription' });
    }

    // Cancel at period end (recommended) or immediately
    const cancelAtPeriodEnd = keepFeatures !== false;
    
    const cancelledSubscription = await stripe.subscriptions.update(
      user.subscription_id,
      {
        cancel_at_period_end: cancelAtPeriodEnd,
        metadata: {
          cancellation_reason: reason,
          cancellation_note: otherReason || '',
          cancelled_by_user: 'true'
        }
      }
    );

    // Update user in database
    await User.update(user.id, {
      subscription_status: 'canceled',
      subscription_cancelled_at: new Date()
    });

    // Log cancellation reason (store in separate table)
    // await saveCancellationReason(user.id, reason, otherReason);

    res.json({
      success: true,
      message: cancelAtPeriodEnd 
        ? 'Subscription will cancel at the end of billing period' 
        : 'Subscription cancelled immediately',
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
        cancelAt: cancelledSubscription.cancel_at 
          ? new Date(cancelledSubscription.cancel_at * 1000)
          : null
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await User.getById(req.session.userId);
    
    if (!user || !user.subscription_id) {
      return res.status(404).json({ success: false, error: 'No subscription found' });
    }

    // Reactivate subscription
    const reactivatedSubscription = await stripe.subscriptions.update(
      user.subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    // Update user in database
    await User.update(user.id, {
      subscription_status: 'active',
      is_pro: 1,
      subscription_cancelled_at: null
    });

    res.json({
      success: true,
      message: 'Subscription reactivated',
      subscription: {
        id: reactivatedSubscription.id,
        status: reactivatedSubscription.status,
        currentPeriodEnd: new Date(reactivatedSubscription.current_period_end * 1000)
      }
    });

  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payment history
router.get('/payment-history', async (req, res) => {
  try {
    console.log('📊 GET /api/payment-history called');
    console.log('👤 User ID from session:', req.session.userId);
    
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await User.getById(req.session.userId);
    
    console.log('👤 User from database (full):', user);
    
    if (!user) {
      console.log('❌ User not found');
      return res.json({ success: true, payments: [] });
    }

    if (!user.stripe_customer_id) {
      console.log('⚠️ No stripe_customer_id for user:', user.id);
      return res.json({ success: true, payments: [] });
    }

    console.log('🔍 Fetching invoices for customer:', user.stripe_customer_id);
    
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 10,
    });

    console.log('✅ Invoices found:', invoices.data.length);
    
    const payments = invoices.data.map(invoice => ({
      id: invoice.id,
      created: new Date(invoice.created * 1000),
      amount: invoice.amount_paid,
      status: invoice.status,
      invoice_pdf: invoice.invoice_pdf,
      receipt_url: invoice.hosted_invoice_url
    }));

    // Prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      payments,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Payment history error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Get usage statistics
router.get('/usage-stats', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Mock data - replace with actual usage tracking
    const stats = {
      conversions: Math.floor(Math.random() * 100),
      storageUsed: Math.floor(Math.random() * 50 * 1024 * 1024 * 1024), // Up to 50GB
      filesProcessed: Math.floor(Math.random() * 500)
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;