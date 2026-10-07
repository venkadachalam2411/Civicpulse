import { Response } from 'express';
import Issue from '../models/Issue';
import User from '../models/User';
import IssueTimeline from '../models/IssueTimeline';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { uploadToS3OrLocal } from '../services/storageService';
import { sendIssueStatusChangedEmail, sendIssueResolvedEmail } from '../services/emailService';

export async function getOfficerIssues(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { status, priority, category, overdue } = req.query;

    const filter: any = { assignedTo: req.user.id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    if (overdue === 'true') {
      filter.slaDeadline = { $lt: new Date() };
      filter.status = { $nin: ['resolved', 'closed', 'rejected'] };
    }

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email phone profileImage')
      .sort({ priorityScore: -1, createdAt: -1 });

    return res.json({ success: true, issues });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateIssueStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const { status, remarks } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    if (issue.assignedTo?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the assigned officer or admin can update status.' });
    }

    const allowedStatuses = ['assigned', 'in_progress', 'under_review'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const officerTag = req.user.employeeId ? ` (${req.user.employeeId})` : '';
    const previousStatus = issue.status || 'assigned';
    const prevStatusFormatted = previousStatus.replace('_', ' ').toUpperCase();
    const newStatusFormatted = status.replace('_', ' ').toUpperCase();

    issue.status = status;
    if (remarks) issue.remarks = remarks;
    await issue.save();

    await IssueTimeline.create({
      issue: issue._id,
      status,
      message: `Officer ${req.user.name}${officerTag} changed status from ${prevStatusFormatted} to ${newStatusFormatted}`,
      changedBy: req.user.id,
      remarks: remarks || '',
    });

    // Notify citizen in-app
    await Notification.create({
      user: issue.reportedBy,
      title: 'Issue Status Updated',
      message: `Your complaint (${issue.issueId}) status is now ${newStatusFormatted}.`,
      type: 'info',
      link: `/issues/${issue._id}`,
    });

    // 🔄 2. Dispatch Status Change Email via Gmail SMTP (non-blocking)
    if (previousStatus !== status) {
      User.findById(issue.reportedBy)
        .select('name email')
        .then((citizen) => {
          if (citizen && citizen.email) {
            if (status === 'resolved') {
              sendIssueResolvedEmail({
                citizenName: citizen.name,
                citizenEmail: citizen.email,
                issueTitle: issue.title,
                issueLocation: issue.location,
                issueId: issue.issueId,
                officerName: req.user?.name,
              }).catch((err) => {
                console.error('[OfficerController] Error sending issue resolved email:', err);
              });
            } else {
              sendIssueStatusChangedEmail({
                citizenName: citizen.name,
                citizenEmail: citizen.email,
                issueTitle: issue.title,
                issueLocation: issue.location,
                issueId: issue.issueId,
                previousStatus,
                newStatus: status,
              }).catch((err) => {
                console.error('[OfficerController] Error sending issue status changed email:', err);
              });
            }
          }
        })
        .catch((err) => {
          console.error('[OfficerController] Error fetching citizen for email dispatch:', err);
        });
    }

    return res.json({ success: true, message: 'Status updated successfully.', issue });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function resolveIssue(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const { resolutionRemarks } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    if (issue.assignedTo?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only assigned officer or admin can resolve issue.' });
    }

    const resolutionImages: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadToS3OrLocal(file as Express.Multer.File);
        resolutionImages.push(url);
      }
    }

    const previousStatus = issue.status;
    const isNewlyResolved = previousStatus !== 'resolved';

    issue.status = 'resolved';
    issue.resolutionRemarks = resolutionRemarks || 'Work completed and verified on site.';
    issue.resolutionImages = resolutionImages.length > 0 ? resolutionImages : issue.resolutionImages;
    issue.resolvedAt = new Date();
    await issue.save();

    const officerTag = req.user.employeeId ? ` (${req.user.employeeId})` : '';

    await IssueTimeline.create({
      issue: issue._id,
      status: 'resolved',
      message: `Issue marked as RESOLVED by Officer ${req.user.name}${officerTag}`,
      changedBy: req.user.id,
      remarks: resolutionRemarks || 'Resolution proof uploaded.',
    });

    // Notify citizen reporter in-app
    await Notification.create({
      user: issue.reportedBy,
      title: 'Issue Resolved! Please Verify',
      message: `Officer ${req.user.name}${officerTag} marked complaint ${issue.issueId} as resolved. Please review the resolution proof.`,
      type: 'success',
      link: `/issues/${issue._id}`,
    });

    // ✅ 4. Dispatch Issue Resolved Email to Citizen via Gmail SMTP (non-blocking)
    if (isNewlyResolved) {
      User.findById(issue.reportedBy)
        .select('name email')
        .then((citizen) => {
          if (citizen && citizen.email) {
            sendIssueResolvedEmail({
              citizenName: citizen.name,
              citizenEmail: citizen.email,
              issueTitle: issue.title,
              issueLocation: issue.location,
              issueId: issue.issueId,
              officerName: req.user?.name || 'Assigned Officer',
              resolutionRemarks: issue.resolutionRemarks,
            }).catch((err) => {
              console.error('[OfficerController] Error sending issue resolved email:', err);
            });
          }
        })
        .catch((err) => {
          console.error('[OfficerController] Error fetching citizen for resolution email:', err);
        });
    }

    return res.json({ success: true, message: 'Issue resolved with proof.', issue });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
