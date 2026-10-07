import { Response } from 'express';
import Issue, { SeverityType } from '../models/Issue';
import IssueTimeline from '../models/IssueTimeline';
import Upvote from '../models/Upvote';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { calculatePriorityScore, calculateSlaDeadline } from '../services/priorityService';
import { detectDuplicates } from '../services/duplicateDetectionService';
import { suggestCategory } from '../services/categorySuggestionService';
import { uploadToS3OrLocal } from '../services/storageService';
import { sendIssueReportedEmail } from '../services/emailService';

// Helper to generate unique Issue ID CIV-2026-XXXXX
async function generateUniqueIssueId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await Issue.countDocuments();
  const nextNum = (count + 1).toString().padStart(5, '0');
  return `CIV-${currentYear}-${nextNum}`;
}

export async function suggestCategoryEndpoint(req: AuthRequest, res: Response) {
  try {
    const { title = '', description = '' } = req.body;
    const result = suggestCategory(description, title);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function checkDuplicateEndpoint(req: AuthRequest, res: Response) {
  try {
    const { title = '', description = '', category = 'Roads', latitude = 0, longitude = 0 } = req.body;
    const result = await detectDuplicates(title, description, category, Number(latitude), Number(longitude));
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createIssue(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      title,
      description,
      category,
      severity = 'medium',
      location,
      latitude,
      longitude,
    } = req.body;

    if (!title || !description || !category || !location || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, location, latitude, and longitude are required.',
      });
    }

    // Process uploaded files
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadToS3OrLocal(file as Express.Multer.File);
        imageUrls.push(url);
      }
    }

    const issueId = await generateUniqueIssueId();
    const { score: priorityScore, priority } = calculatePriorityScore(severity as SeverityType, 0);
    const slaDeadline = calculateSlaDeadline(priority);

    const newIssue = await Issue.create({
      issueId,
      title,
      description,
      category,
      severity,
      priorityScore,
      priority,
      location,
      latitude: Number(latitude),
      longitude: Number(longitude),
      imageUrls,
      status: 'reported',
      reportedBy: req.user.id,
      slaDeadline,
    });

    // Create Timeline entry
    await IssueTimeline.create({
      issue: newIssue._id,
      status: 'reported',
      message: `Issue reported by ${req.user.name}`,
      changedBy: req.user.id,
      remarks: 'Initial complaint filed.',
    });

    // Notify user in-app
    await Notification.create({
      user: req.user.id,
      title: 'Complaint Registered',
      message: `Your complaint (${issueId}) has been registered successfully.`,
      type: 'info',
      link: `/issues/${newIssue._id}`,
    });

    // 📧 1. Dispatch Issue Reported Email to Citizen via Gmail SMTP (non-blocking)
    if (req.user.email) {
      sendIssueReportedEmail({
        citizenName: req.user.name,
        citizenEmail: req.user.email,
        issueTitle: newIssue.title,
        issueDescription: newIssue.description,
        issueLocation: newIssue.location,
        issueId: newIssue.issueId,
        currentStatus: 'Reported',
      }).catch((err) => {
        console.error('[IssueController] Error sending issue reported email:', err);
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Issue reported successfully.',
      issue: newIssue,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error creating issue.' });
  }
}

export async function getIssues(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, category, status, priority, sortBy = 'newest' } = req.query;

    const filter: any = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { issueId: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    let sortOptions: any = { createdAt: -1 };
    if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
    if (sortBy === 'priority') sortOptions = { priorityScore: -1, createdAt: -1 };
    if (sortBy === 'upvotes') sortOptions = { upvoteCount: -1, createdAt: -1 };

    const total = await Issue.countDocuments(filter);
    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email profileImage')
      .populate('assignedTo', 'name email phone department')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      issues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error fetching issues.' });
  }
}

export async function getMyIssues(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const issues = await Issue.find({ reportedBy: req.user.id })
      .populate('assignedTo', 'name email phone department')
      .sort({ createdAt: -1 });

    return res.json({ success: true, issues });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getIssueById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const issue = await Issue.findById(id)
      .populate('reportedBy', 'name email phone profileImage')
      .populate('assignedTo', 'name email phone department profileImage');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const timeline = await IssueTimeline.find({ issue: issue._id })
      .populate('changedBy', 'name role')
      .sort({ createdAt: 1 });

    let hasUpvoted = false;
    if (req.user) {
      const upvote = await Upvote.findOne({ issue: issue._id, user: req.user.id });
      hasUpvoted = !!upvote;
    }

    return res.json({
      success: true,
      issue,
      timeline,
      hasUpvoted,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function toggleUpvote(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const existingUpvote = await Upvote.findOne({ issue: issue._id, user: req.user.id });

    if (existingUpvote) {
      // Remove upvote
      await Upvote.deleteOne({ _id: existingUpvote._id });
      issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
    } else {
      // Add upvote
      await Upvote.create({ issue: issue._id, user: req.user.id });
      issue.upvoteCount += 1;
    }

    // Recalculate smart priority score
    const { score: newScore, priority: newPriority } = calculatePriorityScore(
      issue.severity,
      issue.upvoteCount,
      issue.createdAt
    );

    issue.priorityScore = newScore;
    issue.priority = newPriority;
    issue.slaDeadline = calculateSlaDeadline(newPriority, issue.createdAt);

    await issue.save();

    return res.json({
      success: true,
      hasUpvoted: !existingUpvote,
      upvoteCount: issue.upvoteCount,
      priorityScore: issue.priorityScore,
      priority: issue.priority,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function confirmOrReopenIssue(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'confirm' | 'reopen'

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    if (issue.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the reporter or admin can confirm/reopen.' });
    }

    if (action === 'confirm') {
      issue.status = 'closed';
      await issue.save();

      await IssueTimeline.create({
        issue: issue._id,
        status: 'closed',
        message: 'Citizen confirmed resolution. Issue closed.',
        changedBy: req.user.id,
        remarks: remarks || 'Confirmed work complete.',
      });

      return res.json({ success: true, message: 'Issue officially closed.', issue });
    } else if (action === 'reopen') {
      issue.status = 'in_progress';
      await issue.save();

      await IssueTimeline.create({
        issue: issue._id,
        status: 'in_progress',
        message: 'Citizen reported resolution unsatisfactory. Issue reopened.',
        changedBy: req.user.id,
        remarks: remarks || 'Reopened by citizen.',
      });

      // Notify assigned officer or admin
      if (issue.assignedTo) {
        await Notification.create({
          user: issue.assignedTo,
          title: 'Issue Reopened',
          message: `Citizen reopened complaint ${issue.issueId}. Please review remarks.`,
          type: 'warning',
          link: `/issues/${issue._id}`,
        });
      }

      return res.json({ success: true, message: 'Issue reopened for further resolution.', issue });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be confirm or reopen.' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
