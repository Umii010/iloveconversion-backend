const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User'); 


router.post('/fix-incomplete-subscription', async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.getById(userId);
    if (!user || !user.subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
    if (subscription.status === 'incomplete' && subscription.latest_invoice) {
      const invoice = await stripe.invoices.pay(subscription.latest_invoice.id);
      const updatedSubscription = await stripe.subscriptions.retrieve(user.subscription_id);
      
      await User.update(userId, {
        is_pro: 1,
        subscription_plan: user.subscription_plan,
        current_period_end: updatedSubscription.current_period_end 
          ? new Date(updatedSubscription.current_period_end * 1000)
          : calculateFallbackExpiry(user.subscription_plan)
      });

      return res.json({
        success: true,
        message: 'Subscription fixed and activated',
        status: updatedSubscription.status
      });
    }

    res.json({
      success: true,
      message: 'Subscription is already active',
      status: subscription.status
    });

  } catch (error) {
    console.error('Fix subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create subscription setup intent - FIXED VERSION
router.post('/create-subscription-setup', async (req, res) => {
  try {
    const { plan, billingInfo } = req.body;
    
    console.log('🔄 Creating subscription setup for:', {
      plan,
      email: billingInfo.email
    });

    // Validate plan
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan'
      });
    }

    // Get price ID based on plan
    const priceId = plan === 'yearly' 
      ? process.env.STRIPE_YEARLY_PRICE_ID 
      : process.env.STRIPE_MONTHLY_PRICE_ID;
    
    console.log('💰 Price ID:', priceId);
    
    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Price not configured'
      });
    }

    // Create or get Stripe customer
    let customerId;
    const user = await User.findByEmail(billingInfo.email);
    
    if (user && user.stripe_customer_id) {
      customerId = user.stripe_customer_id;
      console.log('👤 Using existing Stripe customer:', customerId);
    } else {
      console.log('👤 Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: billingInfo.email,
        name: billingInfo.name,
        metadata: {
          userId: user ? user.id : 'new-customer'
        }
      });
      customerId = customer.id;
      
      if (user) {
        await User.update(user.id, {
          stripe_customer_id: customerId
        });
        console.log('✅ Updated user with Stripe customer ID');
      }
    }

    console.log('📅 Creating subscription...');
    
    // Create subscription with setup intent
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card']
      },
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      metadata: {
        plan: plan,
        userEmail: billingInfo.email
      }
    });

    console.log('✅ Subscription created:', {
      id: subscription.id,
      status: subscription.status,
      latest_invoice: subscription.latest_invoice?.id,
      pending_setup_intent: subscription.pending_setup_intent?.id
    });

    // Get the client secret - check multiple sources
    let clientSecret;
    
    if (subscription.latest_invoice?.payment_intent?.client_secret) {
      // If there's an invoice with payment intent
      clientSecret = subscription.latest_invoice.payment_intent.client_secret;
      console.log('🔑 Using payment intent client secret');
    } else if (subscription.pending_setup_intent?.client_secret) {
      // If there's a setup intent
      clientSecret = subscription.pending_setup_intent.client_secret;
      console.log('🔑 Using setup intent client secret');
    } else {
      // Create a setup intent manually
      console.log('🔄 Creating setup intent...');
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          subscription_id: subscription.id,
          plan: plan
        }
      });
      
      clientSecret = setupIntent.client_secret;
      console.log('🔑 Created new setup intent client secret');
    }

    if (!clientSecret) {
      throw new Error('Failed to create client secret');
    }

    console.log('✅ Success! Client secret created');
    
    res.json({
      success: true,
      clientSecret: clientSecret,
      subscriptionId: subscription.id,
      customerId: customerId,
      subscriptionStatus: subscription.status
    });

  } catch (error) {
    console.error('❌ Subscription setup error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription setup'
    });
  }
});
// Retrieve checkout session
router.get('/retrieve-checkout-session', async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'subscription.latest_invoice']
    });

    console.log('✅ Checkout session retrieved:', {
      id: session.id,
      status: session.status,
      subscription: session.subscription?.id,
      customer: session.customer
    });

    // Prepare response data
    const sessionData = {
      id: session.id,
      status: session.status,
      subscriptionId: session.subscription?.id,
      paymentIntentId: session.payment_intent,
      customerId: session.customer,
      customerEmail: session.customer_details?.email,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      plan: session.metadata?.plan || 'monthly',
      subscriptionStatus: session.subscription?.status,
      currentPeriodEnd: session.subscription?.current_period_end 
        ? new Date(session.subscription.current_period_end * 1000)
        : null
    };

    res.json({
      success: true,
      session: sessionData
    });

  } catch (error) {
    console.error('❌ Retrieve checkout session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update subscription from checkout session
router.post('/update-subscription-from-session', async (req, res) => {
  try {
    const { sessionId, subscriptionId, customerEmail, plan, amount } = req.body;
    
    console.log('🔄 Updating subscription from session:', {
      sessionId,
      subscriptionId,
      customerEmail,
      plan
    });

    // 1. Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'latest_invoice.payment_intent']
    });

    console.log('📊 Stripe subscription:', {
      status: subscription.status,
      customer: subscription.customer.id,
      current_period_end: subscription.current_period_end
    });

    // 2. Find or create user
    let user = await User.findByEmail(customerEmail);
    
    if (!user) {
      // Try to find by Stripe customer ID
      user = await User.findByStripeCustomerId(subscription.customer);
    }

    const isPro = subscription.status === 'active' ? 1 : 0;
    const subscriptionPlan = plan === 'yearly' ? 'yearly' : 'monthly';
    
    if (user) {
      console.log('👤 Updating existing user:', user.email);
        const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

      await User.update(user.id, {
    is_pro: isPro,
    subscription_plan: subscriptionPlan,
    subscription_status: subscription.status,
    stripe_customer_id: customerId, // ← Store only ID, not object
    subscription_id: subscriptionId,
    current_period_end: subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000)
      : calculateFallbackExpiry(plan)
  });

      
      console.log('✅ User updated successfully');
      
    } else {
      console.log('👤 Creating new user...');
      
      // Get customer details
      const customer = typeof subscription.customer === 'string' 
        ? await stripe.customers.retrieve(subscription.customer)
        : subscription.customer;
      
      user = await User.create({
        name: customer.name || customerEmail.split('@')[0],
        email: customerEmail,
        password: Math.random().toString(36).slice(-8),
        country: 'US',
        is_pro: isPro,
        subscription_plan: subscriptionPlan,
        stripe_customer_id: subscription.customer,
        subscription_id: subscriptionId,
        current_period_end: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : calculateFallbackExpiry(plan)
      });
      
      console.log('✅ New user created:', user.id);
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: {
        id: subscriptionId,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : null
      },
      user: {
        id: user.id,
        email: user.email,
        isPro: isPro,
        plan: subscriptionPlan
      }
    });

  } catch (error) {
    console.error('❌ Update subscription from session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Webhook endpoint for Stripe events (RECOMMENDED)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
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

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ Checkout session completed:', session.id);
      
      // Update user subscription
      await handleCheckoutSession(session);
      break;
      
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('📅 Subscription updated:', subscription.id, subscription.status);
      
      if (subscription.status === 'active') {
        await updateUserFromSubscription(subscription);
      }
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('💰 Invoice paid:', invoice.id);
      break;
  }

  res.json({ received: true });
});

async function handleCheckoutSession(session) {
  try {
    const userEmail = session.customer_details?.email || session.metadata?.userEmail;
    
    if (!userEmail) {
      console.warn('⚠️ No email found in session');
      return;
    }

    // Find or create user
    let user = await User.findByEmail(userEmail);
    
    if (!user && session.customer) {
      user = await User.findByStripeCustomerId(session.customer);
    }

    if (user) {
      await User.update(user.id, {
        is_pro: 1,
        subscription_plan: session.metadata?.plan || 'monthly',
        stripe_customer_id: session.customer,
        current_period_end: session.subscription 
          ? new Date(session.subscription.current_period_end * 1000)
          : null
      });
      console.log('✅ User updated via webhook:', user.email);
    }
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
  }
}

async function updateUserFromSubscription(subscription) {
  try {
    const user = await User.findByStripeCustomerId(subscription.customer);
    
    if (user) {
      await User.update(user.id, {
        is_pro: subscription.status === 'active' ? 1 : 0,
        subscription_id: subscription.id,
        current_period_end: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : null
      });
      console.log('✅ User subscription updated via webhook:', user.email);
    }
  } catch (error) {
    console.error('❌ Update user from subscription error:', error);
  }
}
// Fix broken customer IDs endpoint
router.post('/fix-customer-ids', async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.getById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('🔧 Current stripe_customer_id:', user.stripe_customer_id);
    
    let customerId = user.stripe_customer_id;
    
    // If it's a JSON string, extract the ID
    if (customerId && customerId.includes('{"id":"')) {
      try {
        const customerObj = JSON.parse(customerId);
        customerId = customerObj.id;
        console.log('📝 Extracted customer ID:', customerId);
      } catch (e) {
        console.warn('⚠️ Could not parse as JSON:', e.message);
      }
    }
    
    // If it's still broken, get from Stripe
    if (!customerId || customerId.length > 50) {
      console.log('🔄 Getting customer ID from Stripe subscription...');
      
      if (user.subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
        customerId = subscription.customer;
        console.log('✅ Got customer ID from Stripe:', customerId);
      }
    }
    
    // Update user with clean customer ID
    if (customerId && customerId.startsWith('cus_')) {
      await User.update(user.id, {
        stripe_customer_id: customerId
      });
      
      console.log('✅ Fixed customer ID in database');
      
      res.json({
        success: true,
        message: 'Customer ID fixed',
        customerId: customerId
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid customer ID format'
      });
    }
    
  } catch (error) {
    console.error('Fix customer IDs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { plan, billingInfo } = req.body;
    
    // Get price ID
    const priceId = plan === 'yearly' 
      ? process.env.STRIPE_YEARLY_PRICE_ID 
      : process.env.STRIPE_MONTHLY_PRICE_ID;

    // Create or get customer
    let customerId;
    const user = await User.findByEmail(billingInfo.email);
    
    if (user && user.stripe_customer_id) {
      customerId = user.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: billingInfo.email,
        name: billingInfo.name
      });
      customerId = customer.id;
      
      if (user) {
        await User.update(user.id, { stripe_customer_id: customerId });
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment?plan=${plan}`,
      metadata: {
        plan: plan,
        userEmail: billingInfo.email
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Webhook endpoint
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription events
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('💰 Invoice paid:', invoice.id);
      
      // Update user subscription
      const user = await User.findByStripeCustomerId(invoice.customer);
      if (user) {
        await User.update(user.id, {
          is_pro: 1,
          current_period_end: new Date(invoice.period_end * 1000)
        });
        console.log('✅ User upgraded:', user.email);
      }
      break;
      
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('📅 Subscription updated:', subscription.id, subscription.status);
      
      if (subscription.status === 'active') {
        const user = await User.findByStripeCustomerId(subscription.customer);
        if (user) {
          await User.update(user.id, {
            is_pro: 1,
            subscription_id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000)
          });
        }
      }
      break;
  }

  res.json({ received: true });
});
// Update subscription status after payment - FIXED VERSION
router.post('/update-subscription-status', async (req, res) => {
  try {
    const { subscriptionId, plan, customerEmail, setupIntentId, paymentMethodId } = req.body;
    
    console.log('📝 Update subscription status called:', { 
      subscriptionId, 
      plan, 
      customerEmail 
    });

    // 1. Update the subscription with the payment method
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentMethodId,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    console.log('✅ Subscription updated with payment method');
    
    // 2. Try to pay the invoice if it exists
    if (subscription.latest_invoice?.payment_intent) {
      console.log('💰 Paying invoice...');
      try {
        const paymentIntent = await stripe.paymentIntents.confirm(
          subscription.latest_invoice.payment_intent.id
        );
        console.log('✅ Payment intent confirmed:', paymentIntent.status);
      } catch (paymentError) {
        console.warn('⚠️ Could not confirm payment intent:', paymentError.message);
      }
    }

    // 3. Retrieve the updated subscription
    const updatedSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice.payment_intent']
    });

    console.log('✅ Updated subscription status:', updatedSubscription.status);

    // 4. Convert expiry date
    const currentPeriodEnd = updatedSubscription.current_period_end 
      ? new Date(updatedSubscription.current_period_end * 1000)
      : calculateFallbackExpiry(plan);
    
    console.log('📅 Subscription expiry date:', currentPeriodEnd);

    // 5. Find or create user
    let user = await User.findByEmail(customerEmail);
    const isPro = updatedSubscription.status === 'active' ? 1 : 0;
    const subscriptionPlan = plan === 'yearly' ? 'yearly' : 'monthly';
    
    if (user) {
      console.log('🔄 Updating existing user...');
       const customerId = typeof updatedSubscription.customer === 'string'
    ? updatedSubscription.customer
    : updatedSubscription.customer.id;
      await User.update(user.id, {
    is_pro: isPro,
    subscription_plan: subscriptionPlan,
    stripe_customer_id: customerId, // ← Only ID
    subscription_id: updatedSubscription.id,
    current_period_end: currentPeriodEnd
  });
      
      console.log('✅ User updated in database');
      
    } else {
      console.log('👤 Creating new user...');
      
      // Get customer details from Stripe
      const customer = await stripe.customers.retrieve(updatedSubscription.customer);
      
      user = await User.create({
        name: customer.name || customerEmail.split('@')[0],
        email: customerEmail,
        password: Math.random().toString(36).slice(-8),
        country: 'US',
        is_pro: isPro,
        subscription_plan: subscriptionPlan,
        stripe_customer_id: updatedSubscription.customer,
        subscription_id: updatedSubscription.id,
        current_period_end: currentPeriodEnd
      });
      
      console.log('✅ New user created with ID:', user.id);
    }

    res.json({
      success: true,
      message: `Subscription ${updatedSubscription.status === 'active' ? 'activated' : 'setup completed'} successfully`,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: currentPeriodEnd
      },
      user: {
        id: user.id,
        email: user.email,
        isPro: isPro,
        plan: subscriptionPlan
      }
    });

  } catch (error) {
    console.error('❌ Update subscription status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function calculateFallbackExpiry(plan) {
  const expiry = new Date();
  if (plan === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry;
}

// Confirm subscription
router.post('/confirm-subscription', async (req, res) => {
  try {
    const { transactionId, plan, customerEmail } = req.body;
    
    // Update user in database
    const user = await User.findByEmail(customerEmail);
    if (user) {
      await User.update(user.id, {
        is_pro: 1,
        subscription_plan: plan
      });
    }

    res.json({
      success: true,
      message: 'Subscription confirmed',
      isPro: true,
      plan: plan,
      expiryDate: new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
    });

  } catch (error) {
    console.error('Confirm subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm subscription'
    });
  }
});

// Get user's subscription status
router.get('/subscription-status/:email', async (req, res) => {
  try {
    const user = await User.findByEmail(req.params.email);
    
    if (!user) {
      return res.json({
        isPro: false,
        plan: 'free'
      });
    }

    res.json({
      isPro: user.is_pro === 1,
      plan: user.subscription_plan || 'free',
      currentPeriodEnd: user.current_period_end
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status'
    });
  }
});

// Add webhook endpoint for subscription updates
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

  // Handle subscription cancellation events
  switch (event.type) {
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('📅 Subscription updated via webhook:', {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at
      });

      // Find user by subscription ID
      const user = await User.findBySubscriptionId(subscription.id);
      
      if (user) {
        console.log('👤 Found user for subscription:', user.email);
        
        // Update user based on subscription status
        const updates = {
          subscription_status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null
        };
        
        // If cancelled at period end, keep is_pro as 1 until expiry
        if (subscription.cancel_at_period_end) {
          updates.is_pro = 1;
          console.log('✅ Subscription will cancel at period end, keeping Pro access');
        } 
        // If fully cancelled, mark as not pro
        else if (subscription.status === 'canceled') {
          updates.is_pro = 0;
          updates.current_period_end = null;
          console.log('❌ Subscription fully cancelled, removing Pro access');
        }
        
        await User.update(user.id, updates);
        console.log('✅ User updated via webhook');
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('🗑️ Subscription deleted:', deletedSubscription.id);
      
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