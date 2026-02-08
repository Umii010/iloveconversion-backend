const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const emailService = require('../services/emailService');


// Get user subscription details - FIXED VERSION
router.get('/subscription', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await User.getById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Start with database values
    let subscriptionData = {
      isPro: user.is_pro === 1,
      plan: user.subscription_plan || 'free',
      status: 'active',
      currentPeriodEnd: user.current_period_end,
      cancelAtPeriodEnd: user.cancel_at_period_end || false,
      cancelAt: user.cancel_at || null,
      subscriptionId: user.subscription_id,
      customerId: user.stripe_customer_id,
      amount: user.subscription_plan === 'monthly' ? '$19.99' : 
              user.subscription_plan === 'yearly' ? '$199.99' : '$0',
      period: user.subscription_plan === 'yearly' ? 'year' : 'month'
    };

    console.log('📊 Initial database values:', {
      plan: subscriptionData.plan,
      is_pro: user.is_pro,
      current_period_end: user.current_period_end
    });

    // If user has Stripe subscription, get latest info
    if (user.stripe_customer_id && user.subscription_id) {
      try {
        // IMPORTANT: Don't expand 'latest_invoice' as it might not contain period info
        const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
        
        console.log('✅ Stripe subscription details:', {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end,
          current_period_start: subscription.current_period_start,
          cancel_at: subscription.cancel_at
        });

        // Determine subscription status
        let subscriptionStatus = subscription.status;
        let cancelAtPeriodEnd = subscription.cancel_at_period_end;
        
        // Special handling for cancel_at
        if (subscription.cancel_at && !subscription.cancel_at_period_end) {
          subscriptionStatus = 'canceling';
          cancelAtPeriodEnd = true;
        }

        // Calculate dates - FIX HERE: Handle undefined values properly
        let currentPeriodEnd = user.current_period_end; // Default to database value
        
        // Check if Stripe returns current_period_end (it should be in seconds)
        if (subscription.current_period_end) {
          console.log('📅 Stripe current_period_end exists:', subscription.current_period_end);
          currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        } else if (user.current_period_end) {
          // Use database value if Stripe doesn't have it
          console.log('⚠️ Using database current_period_end');
          currentPeriodEnd = user.current_period_end;
        } else {
          // Calculate fallback expiry if neither exists
          console.log('⚠️ Calculating fallback expiry');
          currentPeriodEnd = calculateFallbackExpiry(subscriptionData.plan);
        }
        
        let cancelAt = user.cancel_at; // Keep existing
        if (subscription.cancel_at) {
          cancelAt = new Date(subscription.cancel_at * 1000);
        }

        // Use database plan
        const dbPlan = user.subscription_plan || 'monthly';
        
        subscriptionData = {
          ...subscriptionData,
          status: subscriptionStatus,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: cancelAtPeriodEnd,
          cancelAt: cancelAt,
          amount: dbPlan === 'monthly' ? '$19.99' : 
                  dbPlan === 'yearly' ? '$199.99' : '$0',
          period: dbPlan === 'yearly' ? 'year' : 'month'
        };

        console.log('📊 Updated subscriptionData:', {
          status: subscriptionData.status,
          plan: subscriptionData.plan,
          cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          currentPeriodEndType: typeof subscriptionData.currentPeriodEnd,
          currentPeriodEndValue: subscriptionData.currentPeriodEnd
        });

        // Update database with status and dates
        const dbUpdates = {
          subscription_status: subscriptionStatus,
          cancel_at_period_end: cancelAtPeriodEnd,
          current_period_end: currentPeriodEnd
        };
        
        if (cancelAt) {
          dbUpdates.cancel_at = cancelAt;
        }
        
        // If canceling at period end, keep Pro access
        if (cancelAtPeriodEnd) {
          dbUpdates.is_pro = 1;
        }

        console.log('💾 Database updates:', dbUpdates);
        
        // Update database
        await User.update(user.id, dbUpdates);

      } catch (stripeError) {
        console.warn('⚠️ Stripe subscription not found:', stripeError.message);
        // Keep database values when Stripe fails
      }
    }

    console.log('📤 Final subscriptionData:', {
      isPro: subscriptionData.isPro,
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      currentPeriodEndDate: subscriptionData.currentPeriodEnd ? subscriptionData.currentPeriodEnd.toISOString() : 'null',
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd
    });

    // Ensure we always return a valid date or null
    const responseData = {
      success: true,
      isPro: subscriptionData.isPro,
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      currentPeriodEnd: subscriptionData.currentPeriodEnd ? subscriptionData.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
      cancelAt: subscriptionData.cancelAt ? subscriptionData.cancelAt.toISOString() : null,
      subscriptionId: subscriptionData.subscriptionId,
      customerId: subscriptionData.customerId,
      amount: subscriptionData.amount,
      period: subscriptionData.period
    };

    console.log('📦 Sending response:', responseData);
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ Get subscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this helper function
function calculateFallbackExpiry(plan) {
  const expiry = new Date();
  if (plan === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else if (plan === 'monthly') {
    expiry.setMonth(expiry.getMonth() + 1);
  } else {
    // Free plan - no expiry
    return null;
  }
  return expiry;
}
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
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }
  console.log('✅ Auth middleware passed - User ID:', req.session.userId);
  next();
};
router.post('/change-plan', requireAuth, async (req, res) => {
  try {
    const { newPlan } = req.body;
    const userId = req.session.userId;
    
    console.log('🔄 Change plan request received:', { newPlan, userId });

    // Validate new plan
    if (!['monthly', 'yearly'].includes(newPlan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan. Must be "monthly" or "yearly"'
      });
    }

    // Get user
    const user = await User.getById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already on this plan
    if (user.subscription_plan === newPlan) {
      return res.status(400).json({
        success: false,
        error: `You are already on the ${getPlanName(newPlan)} plan`
      });
    }

    const oldPlan = user.subscription_plan;
    
    // Calculate new expiry date
    const currentPeriodEnd = calculateFallbackExpiry(newPlan);
    
    // **Also update in Stripe if subscription exists**
    let stripeUpdate = {};
    if (user.subscription_id) {
      try {
        // Get the correct price ID for the new plan
        const priceId = newPlan === 'yearly' 
          ? process.env.STRIPE_YEARLY_PRICE_ID 
          : process.env.STRIPE_MONTHLY_PRICE_ID;
        
        if (priceId) {
          // Update subscription in Stripe
          const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
          
          // Update subscription with new price
          const updatedSubscription = await stripe.subscriptions.update(
            user.subscription_id,
            {
              items: [{
                id: subscription.items.data[0].id,
                price: priceId,
              }],
              proration_behavior: 'create_prorations', // Or 'none' to avoid charges
              metadata: {
                plan: newPlan,
                changed_at: Date.now(),
                old_plan: oldPlan
              }
            }
          );
          
          stripeUpdate = {
            updatedInStripe: true,
            stripeCurrentPeriodEnd: updatedSubscription.current_period_end 
              ? new Date(updatedSubscription.current_period_end * 1000)
              : currentPeriodEnd
          };
          
          console.log('✅ Stripe subscription updated:', updatedSubscription.id);
        }
      } catch (stripeError) {
        console.warn('⚠️ Could not update Stripe subscription:', stripeError.message);
        // Continue with database update even if Stripe fails
      }
    }

    // Update user in database
    const updateData = {
      subscription_plan: newPlan,
      current_period_end: stripeUpdate.stripeCurrentPeriodEnd || currentPeriodEnd
    };
    
    await User.update(userId, updateData);
    
    console.log('✅ Database updated:', {
      userId: userId,
      from: oldPlan,
      to: newPlan,
      expiry: updateData.current_period_end,
      updatedInStripe: !!stripeUpdate.updatedInStripe
    });



    // Send email
    if (emailService && emailService.sendSubscriptionEmails) {
      try {
        await emailService.sendSubscriptionEmails('subscription_updated', {
          id: user.id,
          name: user.name,
          email: user.email
        }, {
          oldPlanName: getPlanName(oldPlan),
          newPlanName: getPlanName(newPlan),
          name: getPlanName(newPlan),
          amount: newPlan === 'yearly' ? '$199.99/year' : '$19.99/month',
          currentPeriodEnd: updateData.current_period_end,
          period: newPlan === 'yearly' ? 'year' : 'month'
        });
      } catch (emailError) {
        console.warn('⚠️ Email not sent:', emailError.message);
      }
    }

    res.json({
      success: true,
      message: `Plan changed to ${getPlanName(newPlan)}`,
      plan: newPlan,
      currentPeriodEnd: updateData.current_period_end,
      isPro: true,
      updatedInStripe: !!stripeUpdate.updatedInStripe
    });

  } catch (error) {
    console.error('❌ Change plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to change plan'
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

     emailService.sendSubscriptionEmails('subscription_canceled', user, {
      planName: getPlanName(user.subscription_plan),
      name: getPlanName(user.subscription_plan),
      amount: user.subscription_plan === 'yearly' ? '$199.99/year' : '$19.99/month',
      cancelAtPeriodEnd: cancelAtPeriodEnd,
      cancelAt: cancelledSubscription.cancel_at 
        ? new Date(cancelledSubscription.cancel_at * 1000)
        : null
    }, {
      reason: req.body.reason,
      otherReason: req.body.otherReason,
      keepFeatures: req.body.keepFeatures
    });
  
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

function getPlanName(planType) {
  const planNames = {
    'monthly': 'Pro Monthly',
    'yearly': 'Pro Yearly',
    'free': 'Free'
  };
  return planNames[planType] || planType;
}

function calculateFallbackExpiry(plan) {
  const expiry = new Date();
  if (plan === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry;
}
router.post('/reactivate-subscription', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await User.getById(req.session.userId);
    
    if (!user || !user.subscription_id) {
      return res.status(404).json({ success: false, error: 'No subscription found' });
    }

    const reactivatedSubscription = await stripe.subscriptions.update(
      user.subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    await User.update(user.id, {
      subscription_status: 'active',
      is_pro: 1,
      subscription_cancelled_at: null
    });

     emailService.sendSubscriptionEmails('subscription_reactivated', user, {
      planName: getPlanName(user.subscription_plan),
      name: getPlanName(user.subscription_plan),
      amount: user.subscription_plan === 'yearly' ? '$199.99/year' : '$19.99/month',
      currentPeriodEnd: new Date(reactivatedSubscription.current_period_end * 1000)
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