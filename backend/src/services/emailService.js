const { EmailClient } = require('@azure/communication-email');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const azureConnectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const senderAddress = process.env.AZURE_EMAIL_SENDER || 'DoNotReply@booknest-store.azurecomm.net';

let azureEmailClient = null;
if (azureConnectionString) {
  try {
    azureEmailClient = new EmailClient(azureConnectionString);
  } catch (err) {
    console.warn('⚠️ Azure Communication Email client init error:', err.message);
  }
}

// Fallback SMTP transporter for local testing
const fallbackTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const sendHtmlEmail = async ({ to, subject, htmlContent, plainTextContent }) => {
  console.log(`📧 [Email Dispatch] Preparing email to: ${to} | Subject: "${subject}"`);

  if (azureEmailClient && azureConnectionString) {
    try {
      const emailMessage = {
        senderAddress: senderAddress,
        content: {
          subject: subject,
          plainText: plainTextContent || subject,
          html: htmlContent
        },
        recipients: {
          to: [{ address: to }]
        }
      };

      const poller = await azureEmailClient.beginSend(emailMessage);
      const response = await poller.pollUntilDone();
      console.log('✅ Email sent via Azure Email Communication Service! MessageId:', response.id);
      return { success: true, provider: 'Azure Communication Services', id: response.id };
    } catch (azureErr) {
      console.warn('⚠️ Azure Email dispatch failed, trying fallback transporter:', azureErr.message);
    }
  }

  // Fallback SMTP or Mock console logger
  try {
    if (process.env.SMTP_USER) {
      const info = await fallbackTransporter.sendMail({
        from: `"BookNest Platform" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: plainTextContent,
        html: htmlContent
      });
      console.log('✅ Email sent via SMTP fallback! MessageId:', info.messageId);
      return { success: true, provider: 'SMTP', id: info.messageId };
    } else {
      console.log(`✉️ [Mock Email System] Simulating email delivery to: ${to}`);
      return { success: true, provider: 'Mock Console Logger', simulated: true };
    }
  } catch (fallbackErr) {
    console.error('❌ Failed to dispatch email:', fallbackErr.message);
    return { success: false, error: fallbackErr.message };
  }
};

/**
 * Send Order Confirmation Email
 */
const sendOrderConfirmation = async (order, items, userOrGuestEmail) => {
  const recipient = userOrGuestEmail || order.guestEmail;
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${item.book?.title || 'Book'}</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.totalPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">BookNest</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9;">Order Confirmation #${order.orderID}</p>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <h2>Thank you for your purchase!</h2>
        <p>Your order has been received and is currently being processed by our team.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal:</span>
            <strong>$${Number(order.subtotal).toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Shipping:</span>
            <strong>$${Number(order.shippingFee).toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; border-top: 2px solid #e2e8f0; padding-top: 8px;">
            <span>Total Paid:</span>
            <strong style="color: #4f46e5;">$${Number(order.total).toFixed(2)}</strong>
          </div>
        </div>

        <p><strong>Delivery Address:</strong><br/>${order.deliveryAddress}</p>
        <p style="margin-top: 24px;">You can track your parcel anytime with Order ID: <strong>${order.orderID}</strong>.</p>
      </div>
    </div>
  `;

  return sendHtmlEmail({
    to: recipient,
    subject: `Order Confirmation #${order.orderID} - BookNest`,
    htmlContent: html
  });
};

/**
 * Send Order Status Update Notification
 */
const sendOrderStatusUpdate = async (order, newStatus, recipientEmail) => {
  const recipient = recipientEmail || order.guestEmail;
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: #1e293b; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">Order Status Update</h2>
      </div>
      <div style="padding: 24px;">
        <p>Your order <strong>#${order.orderID}</strong> has been updated to:</p>
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0; color: #065f46; font-size: 18px;">Status: ${newStatus}</h3>
        </div>
        <p>You can track the progress of your order in real time on our website.</p>
      </div>
    </div>
  `;

  return sendHtmlEmail({
    to: recipient,
    subject: `Status Update for Order #${order.orderID}: ${newStatus}`,
    htmlContent: html
  });
};

/**
 * Send Lending Approval / Rejection Notification
 */
const sendLendingStatusNotification = async (lending, userEmail, bookTitle, status) => {
  const isApproved = status === 'Approved' || status === 'Active';
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: ${isApproved ? '#059669' : '#dc2626'}; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">Book Lending Request ${status}</h2>
      </div>
      <div style="padding: 24px;">
        <p>Hello,</p>
        <p>Your borrowing request for <strong>${bookTitle}</strong> has been <strong>${status.toUpperCase()}</strong> by the BookNest library team.</p>
        ${isApproved ? `
          <div style="background: #f0fdf4; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Rental Period:</strong> ${lending.durationDays} Days</p>
            <p style="margin: 0;"><strong>Due Date:</strong> ${new Date(lending.dueDate).toLocaleDateString()}</p>
          </div>
          <p>Please ensure you return the book by the specified due date to avoid overdue notices.</p>
        ` : `
          <p>Reason/Notes from admin: ${lending.adminNotes || 'Stock currently reserved.'}</p>
        `}
      </div>
    </div>
  `;

  return sendHtmlEmail({
    to: userEmail,
    subject: `Lending Request ${status}: ${bookTitle}`,
    htmlContent: html
  });
};

/**
 * Send Overdue Notification
 */
const sendOverdueReminder = async (lending, userEmail, bookTitle) => {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 8px; overflow: hidden;">
      <div style="background: #ef4444; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">⚠️ Overdue Book Reminder</h2>
      </div>
      <div style="padding: 24px;">
        <p>Dear Customer,</p>
        <p>This is a notification that your borrowed book <strong>"${bookTitle}"</strong> was due on <strong>${new Date(lending.dueDate).toLocaleDateString()}</strong> and is now overdue.</p>
        <p>Please initiate your return via the BookNest profile portal as soon as possible.</p>
      </div>
    </div>
  `;

  return sendHtmlEmail({
    to: userEmail,
    subject: `OVERDUE NOTICE: Please return "${bookTitle}"`,
    htmlContent: html
  });
};

module.exports = {
  sendHtmlEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendLendingStatusNotification,
  sendOverdueReminder
};
