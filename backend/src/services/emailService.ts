import nodemailer from 'nodemailer';

// Helper to create and return the reusable Nodemailer transporter
export function createEmailTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass || pass === 'your_gmail_app_password' || pass === 'YOUR_GMAIL_APP_PASSWORD') {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

// Function to verify transporter during startup or testing
export async function verifyEmailTransporter(): Promise<{ success: boolean; message: string }> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass || pass === 'your_gmail_app_password' || pass === 'YOUR_GMAIL_APP_PASSWORD') {
    const msg = 'Gmail SMTP credentials (SMTP_USER / SMTP_PASS) not fully configured in backend/.env';
    return { success: false, message: msg };
  }

  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      return { success: false, message: 'Could not create email transporter.' };
    }

    await transporter.verify();
    return { success: true, message: `Connected to Gmail SMTP as ${user}` };
  } catch (err: any) {
    const safeError = err.message || 'Unknown SMTP error';
    console.error(`[EmailService] Transporter verification failed: ${safeError}`);
    return { success: false, message: safeError };
  }
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Core helper to send email safely without throwing
export async function sendEmailSafe({ to, subject, html, text }: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass || pass === 'your_gmail_app_password' || pass === 'YOUR_GMAIL_APP_PASSWORD') {
    console.warn(`[EmailService] Email skipped to <${to}>: Gmail SMTP credentials (SMTP_USER / SMTP_PASS) not configured in .env.`);
    return { success: false, error: 'SMTP credentials not configured.' };
  }

  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      return { success: false, error: 'Failed to initialize transporter.' };
    }

    const fromAddress = `"CivicPulse" <${user}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html,
    });

    console.log(`[EmailService] Email sent to ${to} ("${subject}") - MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    const safeMsg = err.message || 'Unknown error occurred during email sending.';
    console.error(`[EmailService] Email sending failed to ${to} ("${subject}"): ${safeMsg}`);
    return { success: false, error: safeMsg };
  }
}

// =====================================================================
// 0. 🎉 CITIZEN WELCOME / REGISTRATION EMAIL
// =====================================================================
export interface WelcomeEmailParams {
  citizenName: string;
  citizenEmail: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const { citizenName, citizenEmail } = params;

  const subject = `Welcome to CivicPulse 🎉 – Registration Successful`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 700; }
        .content { padding: 28px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
        .welcome-card { background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
        .feature-item { margin-bottom: 10px; font-size: 14px; }
        .feature-item:last-child { margin-bottom: 0; }
        .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to CivicPulse</h1>
          <p>Your Voice for a Better Community</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${citizenName || 'Citizen'},</div>
          <p>Welcome to <strong>CivicPulse</strong>! Your citizen account has been successfully created.</p>
          
          <div class="welcome-card">
            <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #1d4ed8;">What you can do with CivicPulse:</h3>
            <div class="feature-item">📸 <strong>Report Issues:</strong> Snap a photo and pin the location of roads, drainage, garbage, or streetlights.</div>
            <div class="feature-item">🔄 <strong>Real-time Tracking:</strong> Receive live email and dashboard updates from municipal officers.</div>
            <div class="feature-item">👍 <strong>Upvote Complaints:</strong> Support neighborhood issues to boost their priority score.</div>
            <div class="feature-item">✅ <strong>Verify Solutions:</strong> Confirm resolution quality once repairs are completed.</div>
          </div>

          <p>You can now log in anytime to start reporting and tracking civic issues in your neighborhood.</p>
          <p style="margin-top: 24px;">Thank you for joining our mission to build a cleaner, safer community!</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
          <p style="margin: 4px 0 0 0;">CivicPulse Municipal Services • Support: supportcivicpulse@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailSafe({ to: citizenEmail, subject, html });
}

// =====================================================================
// 1. 📧 ISSUE REPORTED SUCCESSFULLY (Sent to Citizen)
// =====================================================================
export interface IssueReportedEmailParams {
  citizenName: string;
  citizenEmail: string;
  issueTitle: string;
  issueDescription?: string;
  issueLocation: string;
  issueId: string;
  currentStatus?: string;
}

export async function sendIssueReportedEmail(params: IssueReportedEmailParams) {
  const { citizenName, citizenEmail, issueTitle, issueDescription, issueLocation, issueId, currentStatus = 'Reported' } = params;

  const subject = `Welcome to CivicPulse 🎉 – Issue Reported Successfully`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 28px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
        .card { background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
        .field { margin-bottom: 10px; font-size: 14px; }
        .field:last-child { margin-bottom: 0; }
        .field-label { font-weight: 600; color: #475569; width: 110px; display: inline-block; }
        .field-value { color: #0f172a; font-weight: 500; }
        .badge { display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase; }
        .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CivicPulse</h1>
          <p>Community Issue Reporting System</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${citizenName || 'Citizen'},</div>
          <p>Your issue has been successfully reported on <strong>CivicPulse</strong>. Our municipal team and field officers have received your submission and will review it shortly.</p>
          
          <div class="card">
            <div class="field"><span class="field-label">Issue ID:</span> <span class="field-value" style="font-family: monospace; font-size: 15px; color: #2563eb;"><strong>${issueId}</strong></span></div>
            <div class="field"><span class="field-label">Title:</span> <span class="field-value">${issueTitle}</span></div>
            <div class="field"><span class="field-label">Location:</span> <span class="field-value">${issueLocation}</span></div>
            <div class="field"><span class="field-label">Status:</span> <span class="badge">${currentStatus}</span></div>
            ${issueDescription ? `<div class="field" style="margin-top: 10px;"><span class="field-label">Description:</span><br/><span class="field-value" style="color: #334155; font-style: italic;">${issueDescription}</span></div>` : ''}
          </div>

          <p>You can track updates and progress in real-time through the CivicPulse portal.</p>
          <p style="margin-top: 24px;">Thank you for helping make our community cleaner, safer, and better!</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
          <p style="margin: 4px 0 0 0;">This is an automated notification from CivicPulse Municipal Services.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailSafe({ to: citizenEmail, subject, html });
}

// =====================================================================
// 2. 🔄 ISSUE STATUS CHANGED (Sent to Citizen)
// =====================================================================
export interface IssueStatusChangedEmailParams {
  citizenName: string;
  citizenEmail: string;
  issueTitle: string;
  issueLocation?: string;
  issueId: string;
  previousStatus?: string;
  newStatus: string;
}

export async function sendIssueStatusChangedEmail(params: IssueStatusChangedEmailParams) {
  const { citizenName, citizenEmail, issueTitle, issueLocation, issueId, previousStatus, newStatus } = params;

  const subject = `CivicPulse – Issue Status Updated`;

  const prevFormatted = previousStatus ? previousStatus.replace('_', ' ').toUpperCase() : 'PENDING';
  const newFormatted = newStatus.replace('_', ' ').toUpperCase();
  const updateDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
        .content { padding: 28px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
        .status-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 20px 0; }
        .status-flow { display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: #15803d; text-align: center; }
        .field { margin-bottom: 10px; font-size: 14px; }
        .field-label { font-weight: 600; color: #475569; width: 120px; display: inline-block; }
        .field-value { color: #0f172a; font-weight: 500; }
        .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CivicPulse</h1>
          <p>Issue Status Update Notification</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${citizenName || 'Citizen'},</div>
          <p>The status of your reported complaint <strong>${issueId}</strong> has been updated by the municipal team.</p>
          
          <div class="status-box">
            <div class="status-flow">
              <span style="color: #64748b; text-decoration: line-through;">${prevFormatted}</span>
              <span style="margin: 0 10px; color: #0284c7; font-size: 18px;">➔</span>
              <span style="color: #0284c7; font-size: 17px; background: #e0f2fe; padding: 4px 10px; border-radius: 6px;">${newFormatted}</span>
            </div>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
            <div class="field"><span class="field-label">Issue ID:</span> <span class="field-value" style="font-family: monospace; color: #0284c7;"><strong>${issueId}</strong></span></div>
            <div class="field"><span class="field-label">Title:</span> <span class="field-value">${issueTitle}</span></div>
            ${issueLocation ? `<div class="field"><span class="field-label">Location:</span> <span class="field-value">${issueLocation}</span></div>` : ''}
            <div class="field"><span class="field-label">Updated On:</span> <span class="field-value">${updateDate}</span></div>
          </div>

          <p>Log in to your CivicPulse dashboard anytime to view full timeline details.</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailSafe({ to: citizenEmail, subject, html });
}

// =====================================================================
// 3A. 👨‍💼 OFFICER ASSIGNED (Sent to Citizen)
// =====================================================================
export interface OfficerAssignedEmailParams {
  citizenName: string;
  citizenEmail: string;
  issueTitle: string;
  issueLocation?: string;
  issueId: string;
  officerName?: string;
  officerDepartment?: string;
  currentStatus?: string;
}

export async function sendOfficerAssignedEmail(params: OfficerAssignedEmailParams) {
  const { citizenName, citizenEmail, issueTitle, issueLocation, issueId, officerName = 'Field Officer', officerDepartment, currentStatus = 'Assigned' } = params;

  const subject = `CivicPulse – Officer Assigned to Your Issue`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
        .content { padding: 28px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
        .officer-card { background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .field { margin-bottom: 10px; font-size: 14px; }
        .field:last-child { margin-bottom: 0; }
        .field-label { font-weight: 600; color: #4338ca; width: 120px; display: inline-block; }
        .field-value { color: #0f172a; font-weight: 500; }
        .badge { display: inline-block; background-color: #c7d2fe; color: #3730a3; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase; }
        .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CivicPulse</h1>
          <p>Officer Assignment Notice</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${citizenName || 'Citizen'},</div>
          <p>A dedicated municipal officer has been assigned to inspect and resolve your complaint <strong>${issueId}</strong>.</p>
          
          <div class="officer-card">
            <div class="field"><span class="field-label">Assigned Officer:</span> <span class="field-value" style="font-size: 15px; font-weight: 700; color: #312e81;">${officerName}</span></div>
            ${officerDepartment ? `<div class="field"><span class="field-label">Department:</span> <span class="field-value">${officerDepartment}</span></div>` : ''}
            <div class="field"><span class="field-label">Status:</span> <span class="badge">${currentStatus}</span></div>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
            <div class="field"><span class="field-label" style="color: #475569;">Issue ID:</span> <span class="field-value" style="font-family: monospace; color: #4f46e5;"><strong>${issueId}</strong></span></div>
            <div class="field"><span class="field-label" style="color: #475569;">Title:</span> <span class="field-value">${issueTitle}</span></div>
            ${issueLocation ? `<div class="field"><span class="field-label" style="color: #475569;">Location:</span> <span class="field-value">${issueLocation}</span></div>` : ''}
          </div>

          <p>The assigned officer will visit the location and initiate resolution work as scheduled.</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailSafe({ to: citizenEmail, subject, html });
}

// =====================================================================
// 3B. 👨‍💼 NEW TASK ASSIGNED TO OFFICER (Sent to Officer's Email)
// =====================================================================
export interface OfficerTaskAssignedEmailParams {
  officerName: string;
  officerEmail: string;
  issueTitle: string;
  issueDescription?: string;
  issueLocation: string;
  issueId: string;
  priority?: string;
  slaDeadline?: Date | string;
  remarks?: string;
}

export async function sendOfficerTaskAssignedEmail(params: OfficerTaskAssignedEmailParams) {
  const { officerName, officerEmail, issueTitle, issueDescription, issueLocation, issueId, priority = 'Medium', slaDeadline, remarks } = params;

  const subject = `CivicPulse – New Task Assigned: ${issueId} (${priority.toUpperCase()})`;
  const deadlineFormatted = slaDeadline ? new Date(slaDeadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Standard SLA';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4338ca, #3730a3); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
        .content { padding: 28px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
        .task-card { background-color: #f8fafc; border-left: 4px solid #4338ca; padding: 18px 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .field { margin-bottom: 10px; font-size: 14px; }
        .field:last-child { margin-bottom: 0; }
        .field-label { font-weight: 600; color: #475569; width: 120px; display: inline-block; }
        .field-value { color: #0f172a; font-weight: 500; }
        .badge-priority { display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase; }
        .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CivicPulse Field Operations</h1>
          <p>New Complaint Assignment</p>
        </div>
        <div class="content">
          <div class="greeting">Hello Officer ${officerName},</div>
          <p>You have been assigned a new civic issue to inspect and resolve on-site.</p>
          
          <div class="task-card">
            <div class="field"><span class="field-label">Issue ID:</span> <span class="field-value" style="font-family: monospace; font-size: 15px; color: #4338ca;"><strong>${issueId}</strong></span></div>
            <div class="field"><span class="field-label">Title:</span> <span class="field-value">${issueTitle}</span></div>
            <div class="field"><span class="field-label">Location:</span> <span class="field-value">${issueLocation}</span></div>
            <div class="field"><span class="field-label">Priority:</span> <span class="badge-priority">${priority}</span></div>
            <div class="field"><span class="field-label">SLA Deadline:</span> <span class="field-value" style="color: #b91c1c; font-weight: 600;">${deadlineFormatted}</span></div>
            ${issueDescription ? `<div class="field" style="margin-top: 10px;"><span class="field-label">Details:</span><br/><span class="field-value" style="color: #334155;">${issueDescription}</span></div>` : ''}
            ${remarks ? `<div class="field" style="margin-top: 10px;"><span class="field-label">Admin Instructions:</span><br/><span class="field-value" style="color: #1e3a8a; font-style: italic;">${remarks}</span></div>` : ''}
          </div>

          <p>Please log in to your CivicPulse Officer Portal to review the full details, update the status to <strong>IN PROGRESS</strong>, and upload resolution photos once work is completed.</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} CivicPulse Municipal Operations.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailSafe({ to: officerEmail, subject, html });
}

// =====================================================================
// 4. ✅ ISSUE RESOLVED (Sent to Citizen)
// =====================================================================
export interface IssueResolvedEmailParams {
  citizenName: string;
  citizenEmail: string;
  issueTitle: string;
  issueLocation?: string;
  issueId: string;
  officerName?: string;
  resolutionRemarks?: string;
}

export async function sendIssueResolvedEmail(params: IssueResolvedEmailParams) {
  const { citizenName, citizenEmail, issueTitle, issueLocation, issueId, officerName, resolutionRemarks } = params;

  const subject = `CivicPulse – Your Issue Has Been Resolved ✅`;
  const resolutionDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
        .content { padding: 28px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
        .resolved-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 18px 20px; margin: 20px 0; text-align: center; }
        .field { margin-bottom: 10px; font-size: 14px; text-align: left; }
        .field:last-child { margin-bottom: 0; }
        .field-label { font-weight: 600; color: #047857; width: 130px; display: inline-block; }
        .field-value { color: #0f172a; font-weight: 500; }
        .badge { display: inline-block; background-color: #10b981; color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; }
        .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CivicPulse</h1>
          <p>Issue Resolution Confirmation</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${citizenName || 'Citizen'},</div>
          <p>Great news! Your reported issue <strong>${issueId}</strong> has been marked as <strong>RESOLVED</strong>.</p>
          
          <div class="resolved-box">
            <span class="badge">STATUS: RESOLVED</span>
            <div style="margin-top: 14px;">
              <div class="field"><span class="field-label">Issue ID:</span> <span class="field-value" style="font-family: monospace; font-size: 15px; color: #059669;"><strong>${issueId}</strong></span></div>
              <div class="field"><span class="field-label">Title:</span> <span class="field-value">${issueTitle}</span></div>
              ${issueLocation ? `<div class="field"><span class="field-label">Location:</span> <span class="field-value">${issueLocation}</span></div>` : ''}
              ${officerName ? `<div class="field"><span class="field-label">Resolved By:</span> <span class="field-value">${officerName}</span></div>` : ''}
              <div class="field"><span class="field-label">Resolution Date:</span> <span class="field-value">${resolutionDate}</span></div>
              ${resolutionRemarks ? `<div class="field" style="margin-top: 8px;"><span class="field-label">Officer Remarks:</span><br/><span class="field-value" style="font-style: italic; color: #334155;">${resolutionRemarks}</span></div>` : ''}
            </div>
          </div>

          <p>Please log in to your CivicPulse account to review the uploaded resolution proof photos and confirm or reopen the complaint if further action is needed.</p>
          <p style="margin-top: 20px;">Thank you for active civic participation in improving our locality!</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailSafe({ to: citizenEmail, subject, html });
}
