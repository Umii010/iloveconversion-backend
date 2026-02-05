// webhooks.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Stripe webhook endpoint
router.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🎯 Webhook received:', event.type);

  // Handle subscription events
  switch (event.type) {
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('📅 Subscription updated via webhook:', {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at,
        current_period_end: subscription.current_period_end
      });

      // Find user by subscription ID
      const user = await User.findBySubscriptionId(subscription.id);
      
      if (user) {
        console.log('👤 Found user for subscription:', user.email);
        
        // Determine status
        let subscriptionStatus = subscription.status;
        let cancelAtPeriodEnd = subscription.cancel_at_period_end;
        
        // If cancel_at exists but cancel_at_period_end is false, treat as canceling
        if (subscription.cancel_at && !subscription.cancel_at_period_end) {
          subscriptionStatus = 'canceling';
          cancelAtPeriodEnd = true;
          console.log('✅ Detected cancellation via webhook');
        }
        
        // Update user
        const updates = {
          subscription_status: subscriptionStatus,
          cancel_at_period_end: cancelAtPeriodEnd,
          current_period_end: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000)
            : null
        };
        
        if (subscription.cancel_at) {
          updates.cancel_at = new Date(subscription.cancel_at * 1000);
        }
        
        // Keep Pro access if canceling at period end
        if (cancelAtPeriodEnd) {
          updates.is_pro = 1;
        }
        
        await User.update(user.id, updates);
        console.log('✅ User updated via webhook');
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('🗑️ Subscription deleted via webhook:', deletedSubscription.id);
      
      const deletedUser = await User.findBySubscriptionId(deletedSubscription.id);
      if (deletedUser) {
        await User.update(deletedUser.id, {
          is_pro: 0,
          subscription_status: 'canceled',
          current_period_end: null,
          cancel_at_period_end: false,
          cancel_at: null
        });
        console.log('✅ User downgraded after subscription deletion');
      }
      break;
  }

  res.json({ received: true });
});

module.exports = router;