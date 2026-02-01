const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Webhook endpoint - MUST use express.raw() for Stripe
router.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`✅ Webhook received: ${event.type}`);
    
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
    
  } catch (error) {
    console.error(`❌ Webhook handling error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Webhook event handler
async function handleWebhookEvent(event) {
  const data = event.data.object;
  
  console.log(`🔔 Handling event: ${event.type}`);
  console.log('Event data:', JSON.stringify(data, null, 2));

  switch (event.type) {
    
    // ========== SUBSCRIPTION EVENTS ==========
    case 'customer.subscription.created':
      await handleSubscriptionCreated(data);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(data);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(data);
      break;
      
    // ========== PAYMENT EVENTS ==========
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(data);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(data);
      break;
      
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(data);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(data);
      break;
      
    // ========== CUSTOMER EVENTS ==========
    case 'customer.created':
      await handleCustomerCreated(data);
      break;
      
    case 'customer.deleted':
      await handleCustomerDeleted(data);
      break;
      
    // ========== INVOICE EVENTS ==========
    case 'invoice.created':
      await handleInvoiceCreated(data);
      break;
      
    case 'invoice.upcoming':
      await handleInvoiceUpcoming(data);
      break;
      
    case 'customer.subscription.trial_will_end':
      await handleTrialEnding(data);
      break;
      
    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }
}

// ========== SUBSCRIPTION HANDLERS ==========

async function handleSubscriptionCreated(subscription) {
  console.log('🆕 Subscription created:', subscription.id);
  
  // Find user by Stripe customer ID
  const user = await User.findByStripeCustomerId(subscription.customer);
  
  if (user) {
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    await User.update(user.id, {
      is_pro: 1,
      subscription_plan: getPlanFromSubscription(subscription),
      subscription_id: subscription.id,
      current_period_end: currentPeriodEnd,
      subscription_status: subscription.status
    });
    
    console.log(`✅ User ${user.email} upgraded to Pro (subscription created)`);
    
    // Send welcome email
    // await sendEmail(user.email, 'subscription_created', { subscription });
  } else {
    console.log(`❌ User not found for customer: ${subscription.customer}`);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('📝 Subscription updated:', subscription.id);
  
  const user = await User.findByStripeCustomerId(subscription.customer);
  
  if (user) {
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    await User.update(user.id, {
      subscription_plan: getPlanFromSubscription(subscription),
      current_period_end: currentPeriodEnd,
      subscription_status: subscription.status,
      updated_at: new Date()
    });
    
    console.log(`✅ User ${user.email} subscription updated to status: ${subscription.status}`);
    
    if (subscription.status === 'past_due') {
      // Send payment reminder
      // await sendEmail(user.email, 'payment_past_due', { subscription });
    }
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Subscription cancelled/deleted:', subscription.id);
  
  const user = await User.findByStripeCustomerId(subscription.customer);
  
  if (user) {
    // IMPORTANT: Only downgrade if subscription was active
    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      await User.update(user.id, {
        is_pro: 0,
        subscription_plan: 'free',
        subscription_status: subscription.status,
        subscription_cancelled_at: new Date(),
        current_period_end: null // Clear expiry date
      });
      
      console.log(`📉 User ${user.email} downgraded to Free (subscription cancelled)`);
      
      // Send cancellation email
      // await sendEmail(user.email, 'subscription_cancelled', { subscription });
    }
  }
}

// ========== PAYMENT HANDLERS ==========

async function handlePaymentSucceeded(invoice) {
  console.log('💰 Payment succeeded for invoice:', invoice.id);
  
  if (invoice.subscription) {
    const user = await User.findByStripeCustomerId(invoice.customer);
    
    if (user) {
      // Update last payment date
      await User.update(user.id, {
        last_payment_at: new Date(),
        subscription_status: 'active'
      });
      
      console.log(`✅ Payment recorded for ${user.email}`);
      
      // Send payment receipt email
      // await sendEmail(user.email, 'payment_receipt', { invoice });
    }
  }
}

async function handlePaymentFailed(invoice) {
  console.log('❌ Payment failed for invoice:', invoice.id);
  
  const user = await User.findByStripeCustomerId(invoice.customer);
  
  if (user) {
    await User.update(user.id, {
      subscription_status: 'past_due',
      last_payment_failed_at: new Date()
    });
    
    console.log(`⚠️ Payment failed for ${user.email}`);
    
    // Send payment failure email
    // await sendEmail(user.email, 'payment_failed', { invoice });
  }
}

// ========== CUSTOMER HANDLERS ==========

async function handleCustomerCreated(customer) {
  console.log('👤 New customer created:', customer.id);
  
  // Link Stripe customer to existing user if email matches
  if (customer.email) {
    const user = await User.findByEmail(customer.email);
    
    if (user && !user.stripe_customer_id) {
      await User.update(user.id, {
        stripe_customer_id: customer.id
      });
      console.log(`✅ Linked customer ${customer.id} to user ${user.email}`);
    }
  }
}

async function handleCustomerDeleted(customer) {
  console.log('🗑️ Customer deleted:', customer.id);
  
  // Find and update user
  const user = await User.findByStripeCustomerId(customer.id);
  
  if (user) {
    await User.update(user.id, {
      stripe_customer_id: null,
      is_pro: 0,
      subscription_plan: 'free',
      subscription_status: 'cancelled'
    });
    
    console.log(`✅ User ${user.email} downgraded (customer deleted)`);
  }
}

// ========== HELPER FUNCTIONS ==========

function getPlanFromSubscription(subscription) {
  // Extract plan from subscription items
  const item = subscription.items.data[0];
  if (!item) return 'monthly';
  
  const price = item.price;
  if (price.recurring.interval === 'year') return 'yearly';
  return 'monthly';
}


module.exports = router;