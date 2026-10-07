import { Response } from 'express';
import bcrypt from 'bcryptjs';
import Issue from '../models/Issue';
import User from '../models/User';
import IssueTimeline from '../models/IssueTimeline';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { calculateSlaDeadline } from '../services/priorityService';
import {
  sendOfficerAssignedEmail,
  sendOfficerTaskAssignedEmail,
  sendIssueStatusChangedEmail,
} from '../services/emailService';

import {
  generateNextEmployeeId,
  generateOfficialEmail,
  generateTempPassword,
} from '../services/officerService';

export async function getAllAdminIssues(req: AuthRequest, res: Response) {
  try {
    const { status, priority, category, delayed } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    if (delayed === 'true') {
      filter.slaDeadline = { $lt: new Date() };
      filter.status = { $nin: ['resolved', 'closed', 'rejected'] };
    }

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo', 'name email phone department employeeId active')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: issues.length, issues });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const users = await User.find({ role: 'citizen' }).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getOfficers(req: AuthRequest, res: Response) {
  try {
    const officers = await User.find({ role: 'officer' }).select('-password').sort({ createdAt: -1 }).lean();

    // Aggregate workload count for each officer
    const officerWorkloads = await Promise.all(
      officers.map(async (officer) => {
        const activeTasks = await Issue.countDocuments({
          assignedTo: officer._id,
          status: { $in: ['assigned', 'in_progress'] },
        });
        const resolvedTasks = await Issue.countDocuments({
          assignedTo: officer._id,
          status: { $in: ['resolved', 'closed'] },
        });
        const totalTasks = await Issue.countDocuments({
          assignedTo: officer._id,
        });

        return {
          ...officer,
          active: officer.active !== false,
          activeTasks,
          resolvedTasks,
          totalTasks,
        };
      })
    );

    return res.json({ success: true, officers: officerWorkloads });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getNextOfficerDetails(req: AuthRequest, res: Response) {
  try {
    const { name } = req.query;
    const nextEmployeeId = await generateNextEmployeeId();
    const suggestedEmail = name ? await generateOfficialEmail(name as string) : '';
    const suggestedPassword = generateTempPassword();

    return res.json({
      success: true,
      nextEmployeeId,
      suggestedEmail,
      suggestedPassword,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createOfficer(req: AuthRequest, res: Response) {
  try {
    const { name, email, password, phone, department, employeeId } = req.body;

    if (!name || !department) {
      return res.status(400).json({ success: false, message: 'Officer name and department are required.' });
    }

    // 1. Assign or generate Employee ID
    let finalEmployeeId = employeeId ? employeeId.trim().toUpperCase() : await generateNextEmployeeId();
    const existingId = await User.findOne({ employeeId: finalEmployeeId });
    if (existingId) {
      // If manually specified ID already exists, regenerate automatically
      finalEmployeeId = await generateNextEmployeeId();
    }

    // 2. Assign or generate official CivicPulse email
    let finalEmail = email ? email.toLowerCase().trim() : await generateOfficialEmail(name);
    const existingEmail = await User.findOne({ email: finalEmail });
    if (existingEmail) {
      finalEmail = await generateOfficialEmail(name);
    }

    // 3. Generate secure temporary password if not explicitly given
    const initialPassword = password && password.trim().length >= 6 ? password.trim() : generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(initialPassword, salt);

    const officer = await User.create({
      name: name.trim(),
      email: finalEmail,
      password: hashedPassword,
      phone: phone || '',
      role: 'officer',
      department: department.trim(),
      employeeId: finalEmployeeId,
      active: true,
      mustChangePassword: true,
    });

    return res.status(201).json({
      success: true,
      message: `Officer ${officer.name} (${officer.employeeId}) created successfully.`,
      officer: {
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        phone: officer.phone,
        department: officer.department,
        employeeId: officer.employeeId,
        role: officer.role,
        active: officer.active,
        mustChangePassword: officer.mustChangePassword,
        activeTasks: 0,
        resolvedTasks: 0,
        totalTasks: 0,
      },
      tempPassword: initialPassword,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error creating officer.' });
  }
}

export async function updateOfficer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, department, phone, email, active } = req.body;

    const officer = await User.findById(id);
    if (!officer || officer.role !== 'officer') {
      return res.status(404).json({ success: false, message: 'Field Officer not found.' });
    }

    if (name) officer.name = name.trim();
    if (department) officer.department = department.trim();
    if (phone !== undefined) officer.phone = phone.trim();
    if (active !== undefined) officer.active = Boolean(active);

    if (email && email.toLowerCase().trim() !== officer.email) {
      const emailInUse = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: officer._id },
      });
      if (emailInUse) {
        return res.status(400).json({ success: false, message: 'This email is already registered to another user.' });
      }
      officer.email = email.toLowerCase().trim();
    }

    await officer.save();

    return res.json({
      success: true,
      message: 'Officer profile updated successfully.',
      officer: {
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        phone: officer.phone,
        department: officer.department,
        employeeId: officer.employeeId,
        role: officer.role,
        active: officer.active,
        mustChangePassword: officer.mustChangePassword,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error updating officer.' });
  }
}

export async function toggleOfficerStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const officer = await User.findById(id);
    if (!officer || officer.role !== 'officer') {
      return res.status(404).json({ success: false, message: 'Field Officer not found.' });
    }

    officer.active = active !== undefined ? Boolean(active) : !officer.active;
    await officer.save();

    return res.json({
      success: true,
      message: `Officer ${officer.name} (${officer.employeeId}) is now ${officer.active ? 'ACTIVE' : 'DEACTIVATED'}.`,
      officer: {
        _id: officer._id,
        name: officer.name,
        employeeId: officer.employeeId,
        active: officer.active,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error updating officer status.' });
  }
}

export async function assignOfficer(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const { officerId, remarks } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const officer = await User.findById(officerId);
    if (!officer || officer.role !== 'officer') {
      return res.status(400).json({ success: false, message: 'Invalid officer selected.' });
    }

    if (officer.active === false) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign issue: Officer ${officer.name} (${officer.employeeId}) is currently deactivated.`,
      });
    }

    const previousAssignedTo = issue.assignedTo ? issue.assignedTo.toString() : null;
    const isNewAssignment = previousAssignedTo !== officer._id.toString();

    issue.assignedTo = officer._id;
    issue.status = 'assigned';
    if (remarks) issue.remarks = remarks;
    await issue.save();

    const officerIdentifier = officer.employeeId ? `(${officer.employeeId})` : '';

    await IssueTimeline.create({
      issue: issue._id,
      status: 'assigned',
      message: `Assigned to ${officer.name} ${officerIdentifier} - Department: ${officer.department || 'General Services'}`,
      changedBy: req.user.id,
      remarks: remarks || '',
    });

    // Notify officer
    await Notification.create({
      user: officer._id,
      title: 'New Complaint Assigned',
      message: `You have been assigned complaint ${issue.issueId} (${issue.title}). Priority: ${issue.priority.toUpperCase()}`,
      type: 'alert',
      link: `/issues/${issue._id}`,
    });

    // Notify citizen in-app
    await Notification.create({
      user: issue.reportedBy,
      title: 'Officer Assigned',
      message: `Officer ${officer.name} ${officerIdentifier} has been assigned to your complaint ${issue.issueId}.`,
      type: 'info',
      link: `/issues/${issue._id}`,
    });

    // 👨‍💼 3A. Dispatch Email directly to Assigned Officer via Gmail SMTP (non-blocking)
    if (officer && officer.email) {
      sendOfficerTaskAssignedEmail({
        officerName: officer.name,
        officerEmail: officer.email,
        issueTitle: issue.title,
        issueDescription: issue.description,
        issueLocation: issue.location,
        issueId: issue.issueId,
        priority: issue.priority,
        slaDeadline: issue.slaDeadline,
        remarks: remarks || '',
      }).catch((err) => {
        console.error('[AdminController] Error sending task assignment email to officer:', err);
      });
    }

    // 👨‍💼 3B. Dispatch Officer Assignment Email to Citizen via Gmail SMTP (non-blocking)
    User.findById(issue.reportedBy)
      .select('name email')
      .then((citizen) => {
        if (citizen && citizen.email) {
          sendOfficerAssignedEmail({
            citizenName: citizen.name,
            citizenEmail: citizen.email,
            issueTitle: issue.title,
            issueLocation: issue.location,
            issueId: issue.issueId,
            officerName: officer.name,
            officerDepartment: officer.department,
            currentStatus: 'Assigned',
          }).catch((err) => {
            console.error('[AdminController] Error sending officer assigned email to citizen:', err);
          });
        }
      })
      .catch((err) => {
        console.error('[AdminController] Error fetching citizen for officer assignment email:', err);
      });

    return res.json({ success: true, message: 'Officer assigned successfully.', issue });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}


export async function updatePriorityOverride(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const { priority, priorityScore, remarks } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    if (priority) issue.priority = priority;
    if (priorityScore !== undefined) issue.priorityScore = priorityScore;

    // Recalculate SLA deadline based on manual override
    issue.slaDeadline = calculateSlaDeadline(issue.priority, issue.createdAt);
    await issue.save();

    await IssueTimeline.create({
      issue: issue._id,
      status: issue.status,
      message: `Priority manually set to ${issue.priority.toUpperCase()} (Score: ${issue.priorityScore}/100) by Admin ${req.user.name}`,
      changedBy: req.user.id,
      remarks: remarks || 'Admin priority override',
    });

    return res.json({ success: true, message: 'Priority updated successfully.', issue });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyIssue(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'verify' | 'reject'

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const previousStatus = issue.status;
    const newStatus = action === 'verify' ? 'verified' : 'rejected';
    issue.status = newStatus;
    await issue.save();

    await IssueTimeline.create({
      issue: issue._id,
      status: newStatus,
      message: `Complaint ${action === 'verify' ? 'VERIFIED' : 'REJECTED'} by Admin ${req.user.name}`,
      changedBy: req.user.id,
      remarks: remarks || '',
    });

    await Notification.create({
      user: issue.reportedBy,
      title: `Complaint ${action === 'verify' ? 'Verified' : 'Rejected'}`,
      message: `Your complaint (${issue.issueId}) has been ${newStatus}.`,
      type: action === 'verify' ? 'info' : 'warning',
      link: `/issues/${issue._id}`,
    });
    // 🔄 2. Dispatch Status Change Email if status changed (non-blocking)
    if (previousStatus !== newStatus) {
      User.findById(issue.reportedBy)
        .select('name email')
        .then((citizen) => {
          if (citizen && citizen.email) {
            sendIssueStatusChangedEmail({
              citizenName: citizen.name,
              citizenEmail: citizen.email,
              issueTitle: issue.title,
              issueLocation: issue.location,
              issueId: issue.issueId,
              previousStatus,
              newStatus,
            }).catch((err) => {
              console.error('[AdminController] Error sending issue status changed email:', err);
            });
          }
        })
        .catch((err) => {
          console.error('[AdminController] Error fetching citizen for status email:', err);
        });
    }

    return res.json({ success: true, message: `Issue ${newStatus} successfully.`, issue });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAnalytics(req: AuthRequest, res: Response) {
  try {
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: { $in: ['reported', 'under_review'] } });
    const verifiedIssues = await Issue.countDocuments({ status: 'verified' });
    const inProgressIssues = await Issue.countDocuments({ status: { $in: ['assigned', 'in_progress'] } });
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    const closedIssues = await Issue.countDocuments({ status: 'closed' });
    const rejectedIssues = await Issue.countDocuments({ status: 'rejected' });

    // SLA Breached (unresolved and past SLA deadline)
    const slaBreached = await Issue.countDocuments({
      slaDeadline: { $lt: new Date() },
      status: { $nin: ['resolved', 'closed', 'rejected'] },
    });

    // Category breakdown
    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Status breakdown
    const statusStats = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Priority breakdown
    const priorityStats = await Issue.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Officer Performance / Workload
    const officers = await User.find({ role: 'officer' }).select('name department');
    const officerWorkload = await Promise.all(
      officers.map(async (off) => {
        const assigned = await Issue.countDocuments({ assignedTo: off._id, status: { $in: ['assigned', 'in_progress'] } });
        const resolved = await Issue.countDocuments({ assignedTo: off._id, status: { $in: ['resolved', 'closed'] } });
        return {
          name: off.name,
          department: off.department || 'General',
          assigned,
          resolved,
        };
      })
    );

    // Monthly issue trends
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends: { month: string; total: number; resolved: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const total = await Issue.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
      const resolved = await Issue.countDocuments({
        resolvedAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $in: ['resolved', 'closed'] },
      });

      monthlyTrends.push({
        month: monthNames[d.getMonth()],
        total,
        resolved,
      });
    }

    const resolutionRate = totalIssues > 0 ? Math.round(((resolvedIssues + closedIssues) / totalIssues) * 100) : 0;
    const slaCompliance = totalIssues > 0 ? Math.round(((totalIssues - slaBreached) / totalIssues) * 100) : 100;

    const issuesByCategory = categoryStats.map((c) => ({ category: c._id || 'Uncategorized', count: c.count }));
    const issuesByStatus = statusStats.map((s) => ({ status: s._id, count: s.count }));
    const issuesByPriority = priorityStats.map((p) => ({ priority: p._id, count: p.count }));

    return res.json({
      success: true,
      totalIssues,
      pendingIssues,
      verifiedIssues,
      inProgressIssues,
      resolvedIssues,
      closedIssues,
      rejectedIssues,
      slaBreachedIssues: slaBreached,
      resolutionRate,
      slaCompliance,
      metrics: {
        totalIssues,
        pendingIssues,
        verifiedIssues,
        inProgressIssues,
        resolvedIssues,
        closedIssues,
        rejectedIssues,
        slaBreached,
        slaBreachedIssues: slaBreached,
        resolutionRate,
        slaCompliance,
      },
      issuesByCategory,
      categoryStats: issuesByCategory,
      issuesByStatus,
      statusStats: issuesByStatus,
      issuesByPriority,
      priorityStats: issuesByPriority,
      officerWorkload,
      monthlyTrends,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
