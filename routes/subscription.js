const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Get user subscription details
router.get('/subscription', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await User.getById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Initialize with database values FIRST
    let subscriptionData = {
      isPro: user.is_pro === 1,
      plan: user.subscription_plan || 'free',
      status: 'active', // Default status
      currentPeriodEnd: user.current_period_end, // ← This is from DB (2026-03-01T14:27:11.000Z)
      cancelAtPeriodEnd: false,
      cancelAt: null,
      subscriptionId: user.subscription_id,
      customerId: user.stripe_customer_id,
      // Add amount and period based on subscription_plan
      amount: user.subscription_plan === 'monthly' ? '$19.99' : 
              user.subscription_plan === 'yearly' ? '$199.99' : '$0',
      period: user.subscription_plan === 'yearly' ? 'year' : 'month'
    };

    console.log('📊 Database current_period_end:', user.current_period_end); // Add this log

    // If user has Stripe subscription, try to get latest info
    if (user.stripe_customer_id && user.subscription_id) {
      try {
        console.log('🔄 Fetching subscription from Stripe:', user.subscription_id);
        const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
        
        console.log('✅ Stripe subscription found:', {
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end
        });
        
        // Update with Stripe data if successful
        subscriptionData = {
      ...subscriptionData,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000)
        : user.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,  // ← This is critical!
      cancelAt: subscription.cancel_at 
        ? new Date(subscription.cancel_at * 1000)
        : null,
      // Update amount and period from Stripe
      amount: subscription.items.data[0]?.price.unit_amount 
        ? `$${(subscription.items.data[0]?.price.unit_amount / 100).toFixed(2)}`
        : subscriptionData.amount,
      period: subscription.items.data[0]?.price.recurring?.interval || subscriptionData.period
    };
      } catch (stripeError) {
        console.warn('❌ Stripe subscription not found, using database values:', stripeError.message);
        // Keep database values when Stripe fails
      }
    }

    console.log('📤 Final subscriptionData:', subscriptionData); // Add this log

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
router.post('/change-plan', async (req, res) => {
  try {
    console.log('🔄 Change plan request received:', req.body);
    
    if (!req.session.userId) {
      console.log('❌ Not authenticated');
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { newPlan } = req.body;
    console.log('📋 New plan requested:', newPlan);
    
    const user = await User.getById(req.session.userId);
    console.log('👤 User found:', user?.email);
    console.log('📝 User subscription_id:', user?.subscription_id);
    
    if (!user || !user.subscription_id) {
      console.log('❌ No active subscription found');
      return res.status(404).json({ success: false, error: 'No active subscription' });
    }

    // Get current subscription
    console.log('📡 Retrieving subscription from Stripe:', user.subscription_id);
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
    console.log('✅ Current subscription:', {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      items: subscription.items.data.map(item => ({
        id: item.id,
        price: item.price.id,
        amount: item.price.unit_amount
      }))
    });
    
    // Get price ID for new plan
    const priceId = newPlan === 'yearly' 
      ? process.env.STRIPE_YEARLY_PRICE_ID 
      : process.env.STRIPE_MONTHLY_PRICE_ID;
    
    console.log('💰 Price ID for new plan:', priceId);
    console.log('📊 Current subscription item ID:', subscription.items.data[0]?.id);
    
    if (!priceId) {
      console.log('❌ Price not configured in environment variables');
      return res.status(400).json({ success: false, error: 'Price not configured' });
    }

    // Update subscription with new price
    console.log('⚙️ Updating subscription with new price...');
   // In your change-plan endpoint, update this section:
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

console.log('✅ Subscription updated:', {
  id: updatedSubscription.id,
  status: updatedSubscription.status,
  current_period_end: updatedSubscription.current_period_end,
  new_price: updatedSubscription.items.data[0]?.price.id
});

// FIX: Handle undefined current_period_end
let newExpiryDate;
if (updatedSubscription.current_period_end) {
  // Use Stripe's current_period_end if available
  newExpiryDate = new Date(updatedSubscription.current_period_end * 1000);
} else if (user.current_period_end) {
  // If user already has a date, calculate based on plan change
  newExpiryDate = new Date(user.current_period_end);
  
  // Update expiry based on plan change direction
  if (newPlan === 'yearly' && user.subscription_plan === 'monthly') {
    // Monthly → Yearly: Add 11 months (keeping 1 month already used)
    newExpiryDate.setMonth(newExpiryDate.getMonth() + 11);
  } else if (newPlan === 'monthly' && user.subscription_plan === 'yearly') {
    // Yearly → Monthly: Calculate prorated expiry
    const daysUsed = Math.floor((new Date() - new Date(user.current_period_end)) / (1000 * 60 * 60 * 24));
    const daysRemaining = 365 - daysUsed;
    const monthsRemaining = Math.floor(daysRemaining / 30);
    newExpiryDate = new Date();
    newExpiryDate.setMonth(newExpiryDate.getMonth() + Math.max(1, monthsRemaining));
  }
} else {
  // No existing date, set default
  newExpiryDate = new Date();
  if (newPlan === 'yearly') {
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
  } else {
    newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
  }
}

console.log('📅 Calculated expiry date:', newExpiryDate);

// Update user in database
console.log('💾 Updating user in database...');
await User.update(user.id, {
  subscription_plan: newPlan,
  current_period_end: newExpiryDate
});

    // console.log('✅ Subscription updated:', {
    //   id: updatedSubscription.id,
    //   status: updatedSubscription.status,
    //   current_period_end: updatedSubscription.current_period_end,
    //   new_price: updatedSubscription.items.data[0]?.price.id
    // });

    // Update user in database
    // console.log('💾 Updating user in database...');
    // await User.update(user.id, {
    //   subscription_plan: newPlan,
    //   current_period_end: new Date(updatedSubscription.current_period_end * 1000)
    // });

    console.log('✅ Plan change completed successfully');
    
    res.json({
      success: true,
      message: 'Plan changed successfully',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
      }
    });

  } catch (error) {
    console.error('❌ Change plan error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.type ? {
        type: error.type,
        code: error.code,
        param: error.param
      } : null
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