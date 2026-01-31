const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User'); // Make sure this path is correct

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { plan, amount, billingInfo } = req.body;
    
    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    // Create or get Stripe customer
    let customerId;
    const user = await User.findByEmail(billingInfo.email);
    
    if (user && user.stripe_customer_id) {
      customerId = user.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: billingInfo.email,
        name: billingInfo.name,
        metadata: {
          userId: user ? user.id : 'new-customer'
        }
      });
      customerId = customer.id;
      
     if (user && user.stripe_customer_id !== customerId) {
  await User.update(user.id, {
    stripe_customer_id: customerId
  });
}

    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
     payment_method_types: ['card'],
      customer: customerId,
      metadata: {
        plan: plan,
        customerEmail: billingInfo.email,
        customerName: billingInfo.name
      },
      description: `iLoveConversion ${plan} Plan`,
      // IMPORTANT: Setup future usage for subscriptions
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customerId
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update subscription after successful payment
// Update subscription after successful payment - FIXED VERSION
router.post('/update-subscription', async (req, res) => {
  try {
    const { paymentIntentId, plan, customerEmail } = req.body;
    
    console.log('📝 Update subscription called:', { 
      paymentIntentId, 
      plan, 
      customerEmail 
    });

    // 1. Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('✅ Payment intent status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed'
      });
    }

    // 2. Find user
    let user = await User.findByEmail(customerEmail);
    console.log('👤 User found:', user ? `Yes (ID: ${user.id})` : 'No');

    // 3. FIRST create a product, THEN create price separately
    console.log('🛒 Creating Stripe product...');
    
    const product = await stripe.products.create({
      name: `iLoveConversion ${plan} Plan`,
      description: plan === 'yearly' ? 'Annual Pro Plan' : 'Monthly Pro Plan',
      metadata: {
        userEmail: customerEmail,
        plan: plan
      }
    });
    
    console.log('✅ Product created:', product.id);
    
    // 4. Create price for the product
    console.log('💰 Creating price...');
    const amount = plan === 'yearly' ? 19999 : 1999; // $199.99 or $19.99 in cents
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: 'usd',
      recurring: {
        interval: plan === 'yearly' ? 'year' : 'month',
        interval_count: 1
      },
    });
    
    console.log('✅ Price created:', price.id);

    // 5. Create subscription with the price ID
    console.log('📅 Creating subscription...');
    
    const subscription = await stripe.subscriptions.create({
      customer: paymentIntent.customer,
      items: [{
        price: price.id, // Use the price ID, not price_data
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userEmail: customerEmail,
        plan: plan
      }
    });

    console.log('✅ Subscription created:', {
      id: subscription.id,
      current_period_end: subscription.current_period_end,
      status: subscription.status
    });

    // 6. Convert Unix timestamp to Date
    const currentPeriodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000)
      : calculateFallbackExpiry(plan);
    
    console.log('📅 Converted expiry date:', currentPeriodEnd);

    // 7. Update or create user
    const isPro = true;
    const subscriptionPlan = plan === 'yearly' ? 'yearly' : 'monthly';
    
    if (user) {
      console.log('🔄 Updating existing user...');
      
      await User.update(user.id, {
        is_pro: isPro,
        subscription_plan: subscriptionPlan,
        stripe_customer_id: paymentIntent.customer,
        subscription_id: subscription.id,
        current_period_end: currentPeriodEnd
      });
      
      console.log('✅ User updated in database');
      
    } else {
      console.log('👤 Creating new user...');
      
      user = await User.create({
        name: paymentIntent.metadata.customerName || customerEmail.split('@')[0],
        email: customerEmail,
        password: Math.random().toString(36).slice(-8),
        country: 'US',
        is_pro: isPro,
        subscription_plan: subscriptionPlan,
        stripe_customer_id: paymentIntent.customer,
        subscription_id: subscription.id,
        current_period_end: currentPeriodEnd
      });
      
      console.log('✅ New user created with ID:', user.id);
    }

    res.json({
      success: true,
      message: 'Subscription created and user upgraded successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: currentPeriodEnd
      },
      user: {
        id: user.id,
        email: user.email,
        isPro: isPro,
        plan: subscriptionPlan,
        expires: currentPeriodEnd
      }
    });

  } catch (error) {
    console.error('❌ UPDATE SUBSCRIPTION ERROR:', error);
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

module.exports = router;