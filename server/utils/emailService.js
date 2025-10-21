const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const templates = {
  checkout_confirmation: {
    subject: 'Checkout Confirmation - Inventory Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Checkout Confirmation</h2>
        <p>Hello {{userName}},</p>
        <p>You have successfully checked out the following item(s):</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Item Details</h3>
          <p><strong>Item:</strong> {{itemName}}</p>
          <p><strong>Quantity:</strong> {{quantity}}</p>
          <p><strong>Expected Return Date:</strong> {{expectedReturnDate}}</p>
          <p><strong>Purpose:</strong> {{purpose}}</p>
        </div>
        <p>Please ensure you return the item(s) by the expected return date.</p>
        <p>If you need to extend the return date, please contact your manager or use the system to request an extension.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from the Inventory Tracker system.</p>
      </div>
    `
  },
  return_confirmation: {
    subject: 'Return Confirmation - Inventory Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Return Confirmation</h2>
        <p>Hello {{userName}},</p>
        <p>You have successfully returned the following item(s):</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Item Details</h3>
          <p><strong>Item:</strong> {{itemName}}</p>
          <p><strong>Quantity:</strong> {{quantity}}</p>
          <p><strong>Return Date:</strong> {{returnDate}}</p>
          <p><strong>Condition:</strong> {{condition}}</p>
        </div>
        <p>Thank you for returning the item(s) on time!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from the Inventory Tracker system.</p>
      </div>
    `
  },
  return_reminder: {
    subject: 'Return Reminder - Inventory Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Return Reminder</h2>
        <p>Hello {{userName}},</p>
        <p>This is a friendly reminder that you have item(s) due for return:</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0;">Item Details</h3>
          <p><strong>Item:</strong> {{itemName}}</p>
          <p><strong>Quantity:</strong> {{quantity}}</p>
          <p><strong>Expected Return Date:</strong> {{expectedReturnDate}}</p>
          <p><strong>Days Overdue:</strong> {{daysOverdue}}</p>
        </div>
        <p>Please return the item(s) as soon as possible to avoid any penalties.</p>
        <p>If you need to extend the return date, please contact your manager or use the system to request an extension.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from the Inventory Tracker system.</p>
      </div>
    `
  },
  overdue_alert: {
    subject: 'URGENT: Overdue Items - Inventory Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Overdue Items Alert</h2>
        <p>Hello {{userName}},</p>
        <p><strong>URGENT:</strong> You have overdue item(s) that need to be returned immediately:</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0;">Overdue Item Details</h3>
          <p><strong>Item:</strong> {{itemName}}</p>
          <p><strong>Quantity:</strong> {{quantity}}</p>
          <p><strong>Expected Return Date:</strong> {{expectedReturnDate}}</p>
          <p><strong>Days Overdue:</strong> {{daysOverdue}}</p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">Please return the item(s) immediately to avoid penalties and account restrictions.</p>
        <p>If you have any questions or need assistance, please contact your manager immediately.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from the Inventory Tracker system.</p>
      </div>
    `
  },
  approval_request: {
    subject: 'Approval Required - Inventory Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Approval Required</h2>
        <p>Hello {{managerName}},</p>
        <p>{{userName}} has requested checkout of item(s) that require your approval:</p>
        <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
          <h3 style="margin-top: 0;">Request Details</h3>
          <p><strong>Item:</strong> {{itemName}}</p>
          <p><strong>Quantity:</strong> {{quantity}}</p>
          <p><strong>Expected Return Date:</strong> {{expectedReturnDate}}</p>
          <p><strong>Purpose:</strong> {{purpose}}</p>
          <p><strong>Requested By:</strong> {{userName}} ({{userEmail}})</p>
        </div>
        <p>Please log into the system to approve or reject this request.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from the Inventory Tracker system.</p>
      </div>
    `
  },
  approval_decision: {
    subject: 'Checkout Request {{status}} - Inventory Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: {{color}};">Checkout Request {{status}}</h2>
        <p>Hello {{userName}},</p>
        <p>Your checkout request has been <strong>{{status}}</strong>:</p>
        <div style="background-color: {{bgColor}}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {{borderColor}};">
          <h3 style="margin-top: 0;">Request Details</h3>
          <p><strong>Item:</strong> {{itemName}}</p>
          <p><strong>Quantity:</strong> {{quantity}}</p>
          <p><strong>Expected Return Date:</strong> {{expectedReturnDate}}</p>
          <p><strong>Purpose:</strong> {{purpose}}</p>
          {{#if notes}}<p><strong>Notes:</strong> {{notes}}</p>{{/if}}
        </div>
        {{#if isApproved}}
        <p>You can now collect the item(s) from the designated location.</p>
        {{else}}
        <p>If you have any questions about this decision, please contact your manager.</p>
        {{/if}}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from the Inventory Tracker system.</p>
      </div>
    `
  }
};

// Replace template variables
const replaceVariables = (template, data) => {
  let html = template;
  
  // Replace simple variables
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, data[key] || '');
  });

  // Handle conditional blocks
  html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    return data[condition] ? content : '';
  });

  return html;
};

// Send email function
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    const transporter = createTransporter();

    let emailContent = {};

    if (template && templates[template]) {
      const templateData = templates[template];
      emailContent = {
        subject: subject || templateData.subject,
        html: replaceVariables(templateData.html, data)
      };
    } else if (html) {
      emailContent = {
        subject,
        html
      };
    } else if (text) {
      emailContent = {
        subject,
        text
      };
    } else {
      throw new Error('No valid email content provided');
    }

    const mailOptions = {
      from: `"Inventory Tracker" <${process.env.EMAIL_USER}>`,
      to,
      ...emailContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send bulk emails
const sendBulkEmails = async (emailList) => {
  const results = [];
  
  for (const emailData of emailList) {
    try {
      const result = await sendEmail(emailData);
      results.push({ success: true, to: emailData.to, messageId: result.messageId });
    } catch (error) {
      results.push({ success: false, to: emailData.to, error: error.message });
    }
  }
  
  return results;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  testEmailConfig,
  templates
};
