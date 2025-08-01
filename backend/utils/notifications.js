const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize email transporter
const emailTransporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send SMS using Twilio
const sendSMS = async (to, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('Twilio credentials not configured, SMS not sent');
      return;
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log('SMS sent successfully:', result.sid);
    return result;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

// Send email using Nodemailer
const sendEmail = async (to, subject, html, text = '') => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured, email not sent');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send request reminder
const sendRequestReminder = async (user, request, reminderType = '3days_before') => {
  try {
    const daysLeft = Math.ceil((new Date(request.repaymentDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    let message = '';
    let subject = '';
    
    if (reminderType === 'daily') {
      message = `Hi ${user.name}, you have a pending request for ₹${request.totalAmount} due in ${daysLeft} days. Please check your PayUS app.`;
      subject = 'Daily Reminder - Pending Request';
    } else if (reminderType === 'weekly') {
      message = `Hi ${user.name}, you have a pending request for ₹${request.totalAmount} due in ${daysLeft} days. Please check your PayUS app.`;
      subject = 'Weekly Reminder - Pending Request';
    } else if (reminderType === '3days_before') {
      message = `Hi ${user.name}, your request for ₹${request.totalAmount} is due in ${daysLeft} days. Please check your PayUS app.`;
      subject = 'Reminder - Request Due Soon';
    }

    // Send SMS if enabled
    if (user.notificationSettings.sms) {
      try {
        await sendSMS(user.phone, message);
      } catch (error) {
        console.error('Failed to send SMS reminder:', error);
      }
    }

    // Send email if enabled
    if (user.notificationSettings.email) {
      try {
        const htmlMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p>${message}</p>
            <p>Request Details:</p>
            <ul>
              <li><strong>Title:</strong> ${request.title}</li>
              <li><strong>Amount:</strong> ₹${request.totalAmount}</li>
              <li><strong>Due Date:</strong> ${new Date(request.repaymentDate).toLocaleDateString()}</li>
            </ul>
            <p>Please log into your PayUS app to view details.</p>
            <p>Best regards,<br>PayUS Team</p>
          </div>
        `;
        
        await sendEmail(user.email, subject, htmlMessage);
      } catch (error) {
        console.error('Failed to send email reminder:', error);
      }
    }
  } catch (error) {
    console.error('Failed to send reminder:', error);
  }
};

// Send request notification
const sendRequestNotification = async (recipient, request, type = 'new_request') => {
  try {
    let message = '';
    let subject = '';
    
    if (type === 'new_request') {
      message = `Hi ${recipient.name}, you have received a new request for ₹${request.totalAmount} from ${request.creator.name}. Please check your PayUS app.`;
      subject = 'New Request Received';
    } else if (type === 'request_accepted') {
      message = `Hi ${request.creator.name}, your request for ₹${request.totalAmount} has been accepted by ${recipient.name}.`;
      subject = 'Request Accepted';
    } else if (type === 'request_rejected') {
      message = `Hi ${request.creator.name}, your request for ₹${request.totalAmount} has been rejected by ${recipient.name}.`;
      subject = 'Request Rejected';
    } else if (type === 'payment_received') {
      message = `Hi ${request.creator.name}, you have received a payment of ₹${request.paidAmount} for your request.`;
      subject = 'Payment Received';
    }

    // Send SMS if enabled
    if (recipient.notificationSettings.sms) {
      try {
        await sendSMS(recipient.phone, message);
      } catch (error) {
        console.error('Failed to send SMS notification:', error);
      }
    }

    // Send email if enabled
    if (recipient.notificationSettings.email) {
      try {
        const htmlMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p>${message}</p>
            <p>Please log into your PayUS app to view details.</p>
            <p>Best regards,<br>PayUS Team</p>
          </div>
        `;
        
        await sendEmail(recipient.email, subject, htmlMessage);
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

// Send welcome message
const sendWelcomeMessage = async (user) => {
  try {
    const message = `Welcome to PayUS, ${user.name}! Your account has been created successfully. Start managing your informal money requests with friends and family.`;
    const subject = 'Welcome to PayUS';

    // Send SMS
    try {
      await sendSMS(user.phone, message);
    } catch (error) {
      console.error('Failed to send welcome SMS:', error);
    }

    // Send email
    try {
      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to PayUS!</h2>
          <p>Hi ${user.name},</p>
          <p>Welcome to PayUS! Your account has been created successfully.</p>
          <p>Start managing your informal money requests with friends and family in a simple, secure, and friendly way.</p>
          <h3>What you can do:</h3>
          <ul>
            <li>Create and send money requests to your contacts</li>
            <li>Track repayments and manage reminders</li>
            <li>Keep all your informal lending organized</li>
            <li>Maintain privacy and discretion</li>
          </ul>
          <p>Download the PayUS app and start using it today!</p>
          <p>Best regards,<br>PayUS Team</p>
        </div>
      `;
      
      await sendEmail(user.email, subject, htmlMessage);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  } catch (error) {
    console.error('Failed to send welcome message:', error);
  }
};

module.exports = {
  sendSMS,
  sendEmail,
  sendRequestReminder,
  sendRequestNotification,
  sendWelcomeMessage
};