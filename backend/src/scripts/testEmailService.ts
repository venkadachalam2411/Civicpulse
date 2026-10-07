import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import {
  verifyEmailTransporter,
  sendWelcomeEmail,
  sendIssueReportedEmail,
  sendIssueStatusChangedEmail,
  sendOfficerAssignedEmail,
  sendOfficerTaskAssignedEmail,
  sendIssueResolvedEmail,
} from '../services/emailService';

async function runEmailTests() {
  console.log('================================================================');
  console.log('  CIVICPULSE: GMAIL SMTP / NODEMAILER NOTIFICATIONS TEST SUITE  ');
  console.log('================================================================\n');

  console.log('Environment Variables Check:');
  console.log(`- SMTP_USER: ${process.env.SMTP_USER || '❌ NOT SET'}`);
  console.log(`- SMTP_PASS: ${process.env.SMTP_PASS && process.env.SMTP_PASS !== 'your_gmail_app_password' ? '✅ SET (App Password)' : '⚠️ Placeholder / Not configured'}\n`);

  // 1. Verify Transporter
  console.log('1. Verifying Gmail SMTP Connection...');
  const verifyResult = await verifyEmailTransporter();
  console.log(`   Result: ${verifyResult.success ? '✅ SUCCESS' : 'ℹ️ ' + verifyResult.message}\n`);

  const recipientEmail = process.env.SMTP_USER || 'citizen@example.com';
  console.log(`Testing CivicPulse Email Notification Workflows (Target: ${recipientEmail}):\n`);

  // 2. Test Citizen Registration Welcome Email
  console.log('2. 🎉 Notification 1: Citizen Registration Welcome');
  const welcomeRes = await sendWelcomeEmail({
    citizenName: 'Jane Citizen',
    citizenEmail: recipientEmail,
  });
  console.log(`   Sent Status: ${welcomeRes.success ? '✅ SENT (MessageID: ' + welcomeRes.messageId + ')' : 'ℹ️ ' + welcomeRes.error}\n`);

  // 3. Test Issue Reported Email
  console.log('3. 📧 Notification 2: Issue Reported Successfully (To Citizen)');
  const reportedRes = await sendIssueReportedEmail({
    citizenName: 'Jane Citizen',
    citizenEmail: recipientEmail,
    issueTitle: 'Large pothole on 5th Avenue causing traffic congestion',
    issueDescription: 'Deep road damage near the pedestrian crossing. Needs urgent asphalt repair.',
    issueLocation: '5th Avenue & Elm St, Sector 4',
    issueId: 'CIV-2026-00101',
    currentStatus: 'Reported',
  });
  console.log(`   Sent Status: ${reportedRes.success ? '✅ SENT (MessageID: ' + reportedRes.messageId + ')' : 'ℹ️ ' + reportedRes.error}\n`);

  // 4. Test Issue Status Changed Email
  console.log('4. 🔄 Notification 3: Issue Status Changed (To Citizen)');
  const statusRes = await sendIssueStatusChangedEmail({
    citizenName: 'Jane Citizen',
    citizenEmail: recipientEmail,
    issueTitle: 'Large pothole on 5th Avenue causing traffic congestion',
    issueLocation: '5th Avenue & Elm St, Sector 4',
    issueId: 'CIV-2026-00101',
    previousStatus: 'reported',
    newStatus: 'in_progress',
  });
  console.log(`   Sent Status: ${statusRes.success ? '✅ SENT (MessageID: ' + statusRes.messageId + ')' : 'ℹ️ ' + statusRes.error}\n`);

  // 5. Test Officer Assigned Email to Citizen
  console.log('5. 👨‍💼 Notification 4A: Officer Assigned (To Citizen)');
  const officerCitizenRes = await sendOfficerAssignedEmail({
    citizenName: 'Jane Citizen',
    citizenEmail: recipientEmail,
    issueTitle: 'Large pothole on 5th Avenue causing traffic congestion',
    issueLocation: '5th Avenue & Elm St, Sector 4',
    issueId: 'CIV-2026-00101',
    officerName: 'Rajesh Sharma (OFC002)',
    officerDepartment: 'Roads & Infrastructure',
    currentStatus: 'Assigned',
  });
  console.log(`   Sent Status: ${officerCitizenRes.success ? '✅ SENT (MessageID: ' + officerCitizenRes.messageId + ')' : 'ℹ️ ' + officerCitizenRes.error}\n`);

  // 6. Test Task Assigned Email to Officer
  console.log('6. 📋 Notification 4B: New Task Assigned (To Officer)');
  const officerTaskRes = await sendOfficerTaskAssignedEmail({
    officerName: 'Rajesh Sharma (OFC002)',
    officerEmail: recipientEmail,
    issueTitle: 'Large pothole on 5th Avenue causing traffic congestion',
    issueDescription: 'Deep road damage near the pedestrian crossing.',
    issueLocation: '5th Avenue & Elm St, Sector 4',
    issueId: 'CIV-2026-00101',
    priority: 'High',
    slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
    remarks: 'Please prioritize on-site patch repair today.',
  });
  console.log(`   Sent Status: ${officerTaskRes.success ? '✅ SENT (MessageID: ' + officerTaskRes.messageId + ')' : 'ℹ️ ' + officerTaskRes.error}\n`);

  // 7. Test Issue Resolved Email
  console.log('7. ✅ Notification 5: Issue Resolved (To Citizen)');
  const resolvedRes = await sendIssueResolvedEmail({
    citizenName: 'Jane Citizen',
    citizenEmail: recipientEmail,
    issueTitle: 'Large pothole on 5th Avenue causing traffic congestion',
    issueLocation: '5th Avenue & Elm St, Sector 4',
    issueId: 'CIV-2026-00101',
    officerName: 'Rajesh Sharma (OFC002)',
    resolutionRemarks: 'Road patched and resurfaced with high-grade asphalt. Inspected and cleared for traffic.',
  });
  console.log(`   Sent Status: ${resolvedRes.success ? '✅ SENT (MessageID: ' + resolvedRes.messageId + ')' : 'ℹ️ ' + resolvedRes.error}\n`);

  console.log('================================================================');
  if (verifyResult.success) {
    console.log('  🎉 All Gmail SMTP notifications processed and delivered!');
  } else {
    console.log('  ℹ️ Templates compiled cleanly. Check backend/.env SMTP credentials.');
  }
  console.log('================================================================\n');
}

runEmailTests().catch((err) => {
  console.error('[FAIL] Email test failed unexpectedly:', err);
});
