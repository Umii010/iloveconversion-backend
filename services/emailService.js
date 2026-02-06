// emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Email templates
const emailTemplates = {
  // Subscription purchased
  subscriptionPurchased: (user, subscription) => ({
    subject: `🎉 Welcome to iLoveConversion Pro!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Pro!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your subscription has been activated</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <h2 style="color: #1e293b; margin-top: 0;">Subscription Details</h2>
            
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Plan:</span>
                <strong style="color: #7c3aed;">${subscription.planName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Amount:</span>
                <strong style="color: #7c3aed;">${subscription.amount}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Billing Cycle:</span>
                <strong style="color: #7c3aed;">${subscription.period === 'year' ? 'Yearly' : 'Monthly'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Next Renewal:</span>
                <strong style="color: #7c3aed;">${new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>
              </div>
            </div>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #166534; margin-top: 0;">🎯 Pro Features Unlocked</h3>
              <ul style="color: #475569; margin: 10px 0; padding-left: 20px;">
                <li>Unlimited file conversions</li>
                <li>Priority support</li>
                <li>No watermarks</li>
                <li>100GB cloud storage</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/subscription" 
                 style="background: #7c3aed; color: white; padding: 12px 30px; 
                        border-radius: 8px; text-decoration: none; font-weight: bold; 
                        display: inline-block;">
                Manage Subscription
              </a>
            </div>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
            <p>Need help? <a href="${process.env.FRONTEND_URL}/support" style="color: #7c3aed;">Contact Support</a></p>
          </div>
        </div>
      </div>
    `
  }),

  // Plan changed
  planChanged: (user, oldPlan, newPlan) => ({
    subject: `🔄 Your iLoveConversion Plan Has Been Updated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Plan Updated</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your subscription plan has been changed</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <h2 style="color: #1e293b; margin-top: 0;">Plan Change Details</h2>
            
            <div style="display: flex; justify-content: space-between; margin: 30px 0;">
              <div style="text-align: center; flex: 1;">
                <div style="color: #ef4444; font-weight: bold; margin-bottom: 5px;">Previous Plan</div>
                <div style="font-size: 24px; color: #475569;">${oldPlan.name}</div>
                <div style="color: #64748b; font-size: 14px;">${oldPlan.amount}</div>
              </div>
              
              <div style="align-self: center;">
                <div style="font-size: 24px; color: #cbd5e0;">→</div>
              </div>
              
              <div style="text-align: center; flex: 1;">
                <div style="color: #10b981; font-weight: bold; margin-bottom: 5px;">New Plan</div>
                <div style="font-size: 24px; color: #7c3aed;">${newPlan.name}</div>
                <div style="color: #7c3aed; font-size: 14px; font-weight: bold;">${newPlan.amount}</div>
              </div>
            </div>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">ℹ️ Important Information</h3>
              <p style="color: #475569; margin: 10px 0;">
                Your billing has been prorated. Any credit from your previous plan has been applied to your account.
              </p>
              <p style="color: #475569; margin: 10px 0;">
                The changes are effective immediately. Your next billing date is: 
                <strong>${new Date(newPlan.currentPeriodEnd).toLocaleDateString()}</strong>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/subscription" 
                 style="background: #3b82f6; color: white; padding: 12px 30px; 
                        border-radius: 8px; text-decoration: none; font-weight: bold; 
                        display: inline-block;">
                View Updated Subscription
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  }),

  // Subscription canceled
  subscriptionCanceled: (user, subscription) => ({
    subject: subscription.cancelAtPeriodEnd 
      ? `⏸️ Your iLoveConversion Subscription Will End Soon` 
      : `❌ Your iLoveConversion Subscription Has Been Canceled`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${subscription.cancelAtPeriodEnd ? '#f59e0b' : '#ef4444'} 0%, ${subscription.cancelAtPeriodEnd ? '#d97706' : '#dc2626'} 100%); 
                padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">
            ${subscription.cancelAtPeriodEnd ? 'Subscription Ending Soon' : 'Subscription Canceled'}
          </h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">
            ${subscription.cancelAtPeriodEnd 
              ? 'Your subscription will cancel at the end of the billing period' 
              : 'Your subscription has been canceled immediately'}
          </p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <h2 style="color: #1e293b; margin-top: 0;">Cancellation Details</h2>
            
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Plan:</span>
                <strong style="color: #475569;">${subscription.planName}</strong>
              </div>
              ${subscription.cancelAtPeriodEnd ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #64748b;">Access Ends:</span>
                  <strong style="color: #f59e0b;">${new Date(subscription.cancelAt).toLocaleDateString()}</strong>
                </div>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p style="color: #92400e; margin: 0;">
                    <strong>⚠️ Important:</strong> You will continue to have access to all Pro features until 
                    <strong>${new Date(subscription.cancelAt).toLocaleDateString()}</strong>.
                  </p>
                </div>
              ` : `
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p style="color: #dc2626; margin: 0;">
                    <strong>ℹ️ Note:</strong> Your Pro access has been removed immediately.
                  </p>
                </div>
              `}
            </div>
            
            ${subscription.cancelAtPeriodEnd ? `
              <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #166534; margin-top: 0;">🔄 Still Want Pro?</h3>
                <p style="color: #475569; margin: 10px 0;">
                  You can reactivate your subscription anytime before 
                  <strong>${new Date(subscription.cancelAt).toLocaleDateString()}</strong> 
                  to continue enjoying Pro features.
                </p>
                <div style="text-align: center; margin-top: 15px;">
                  <a href="${process.env.FRONTEND_URL}/subscription" 
                     style="background: #10b981; color: white; padding: 10px 25px; 
                            border-radius: 8px; text-decoration: none; font-weight: bold; 
                            display: inline-block;">
                    Reactivate Subscription
                  </a>
                </div>
              </div>
            ` : `
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">💡 Want to Come Back?</h3>
                <p style="color: #475569; margin: 10px 0;">
                  We'd love to have you back! You can resubscribe anytime to regain access to Pro features.
                </p>
                <div style="text-align: center; margin-top: 15px;">
                  <a href="${process.env.FRONTEND_URL}/pricing" 
                     style="background: #0ea5e9; color: white; padding: 10px 25px; 
                            border-radius: 8px; text-decoration: none; font-weight: bold; 
                            display: inline-block;">
                    View Pricing Plans
                  </a>
                </div>
              </div>
            `}
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; text-align: center;">
                If you have any questions or feedback, please reply to this email or 
                <a href="${process.env.FRONTEND_URL}/support" style="color: #7c3aed;">contact our support team</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    `
  }),

  // Subscription reactivated
  subscriptionReactivated: (user, subscription) => ({
    subject: `🔄 Your iLoveConversion Subscription Has Been Reactivated!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome Back!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your subscription has been reactivated</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <h2 style="color: #1e293b; margin-top: 0;">Subscription Reactivated</h2>
            
            <div style="text-align: center; margin: 25px 0;">
              <div style="font-size: 48px; color: #10b981; margin-bottom: 15px;">🎉</div>
              <p style="color: #475569; font-size: 18px;">
                Great news! Your <strong>${subscription.planName}</strong> subscription is active again.
              </p>
            </div>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #166534; margin-top: 0;">✅ What's Next?</h3>
              <ul style="color: #475569; margin: 10px 0; padding-left: 20px;">
                <li>Immediate access to all Pro features restored</li>
                <li>Your next billing date: <strong>${new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong></li>
                <li>No interruption in service</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/" 
                 style="background: #10b981; color: white; padding: 12px 30px; 
                        border-radius: 8px; text-decoration: none; font-weight: bold; 
                        display: inline-block; margin: 0 10px;">
                Start Converting
              </a>
              <a href="${process.env.FRONTEND_URL}/subscription" 
                 style="background: #f1f5f9; color: #475569; padding: 12px 30px; 
                        border-radius: 8px; text-decoration: none; font-weight: bold; 
                        display: inline-block; margin: 0 10px;">
                Manage Subscription
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  })
};

// Admin notification template
const adminNotificationTemplate = (event, user, subscription, details = {}) => ({
  subject: `[Admin] ${event} - ${user.email}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e293b; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">📊 Subscription Event</h2>
      </div>
      
      <div style="padding: 25px; background: #f8fafc;">
        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h3 style="color: #1e293b; margin-top: 0;">Event: ${event}</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 120px;">User:</td>
              <td style="padding: 8px 0;"><strong>${user.name}</strong> (${user.email})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">User ID:</td>
              <td style="padding: 8px 0;">${user.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Plan:</td>
              <td style="padding: 8px 0;">${subscription?.planName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Amount:</td>
              <td style="padding: 8px 0;">${subscription?.amount || 'N/A'}</td>
            </tr>
            ${subscription?.currentPeriodEnd ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Renews:</td>
              <td style="padding: 8px 0;">${new Date(subscription.currentPeriodEnd).toLocaleString()}</td>
            </tr>
            ` : ''}
            ${details.reason ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Reason:</td>
              <td style="padding: 8px 0;">${details.reason}</td>
            </tr>
            ` : ''}
            ${details.oldPlan ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Old Plan:</td>
              <td style="padding: 8px 0;">${details.oldPlan}</td>
            </tr>
            ` : ''}
            ${details.newPlan ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;">New Plan:</td>
              <td style="padding: 8px 0;">${details.newPlan}</td>
            </tr>
            ` : ''}
          </table>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Timestamp: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  `
});

// Send email function
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: `"iLoveConversion" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(' Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

async function sendUserEmail(user, template, data) {
  try {
    const emailTemplate = emailTemplates[template](user, data);
    return await sendEmail(user.email, emailTemplate.subject, emailTemplate.html);
  } catch (error) {
    console.error('❌ Failed to send user email:', error);
    return false;
  }
}

// Send admin notification
async function sendAdminNotification(event, user, subscription, details = {}) {
  try {
    const adminEmail = 'noreply@devvault.io'; 
    const template = adminNotificationTemplate(event, user, subscription, details);
    return await sendEmail(adminEmail, template.subject, template.html);
  } catch (error) {
    console.error('Failed to send admin email:', error);
    return false;
  }
}

// Send both emails (user + admin)
async function sendSubscriptionEmails(event, user, subscription, details = {}) {
  try {
    // Send user email based on event
    let userTemplate;
    switch (event) {
      case 'subscription_purchased':
        userTemplate = 'subscriptionPurchased';
        break;
      case 'plan_changed':
        userTemplate = 'planChanged';
        break;
      case 'subscription_canceled':
        userTemplate = 'subscriptionCanceled';
        break;
      case 'subscription_reactivated':
        userTemplate = 'subscriptionReactivated';
        break;
      default:
        console.log('⚠️ No email template for event:', event);
        return;
    }

    // Send both emails in parallel
    const [userEmailSent, adminEmailSent] = await Promise.all([
      sendUserEmail(user, userTemplate, subscription),
      sendAdminNotification(event, user, subscription, details)
    ]);

    console.log('📧 Email results:', {
      event,
      user: user.email,
      userEmail: userEmailSent ? '' : '',
      adminEmail: adminEmailSent ? '' : ''
    });

    return { userEmailSent, adminEmailSent };
  } catch (error) {
    console.error('Failed to send subscription emails:', error);
    return { userEmailSent: false, adminEmailSent: false };
  }
}

module.exports = {
  sendEmail,
  sendUserEmail,
  sendAdminNotification,
  sendSubscriptionEmails
};