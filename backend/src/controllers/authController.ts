import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendWelcomeEmail } from '../services/emailService';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // SECURITY: Public registration must ALWAYS create ONLY citizen accounts
    const userRole = 'citizen';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || '',
      role: userRole,
      active: true,
      mustChangePassword: false,
    });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET || 'civicpulse_secret_key_2026',
      { expiresIn: '7d' }
    );

    // 📧 Dispatch Welcome Email to newly registered Citizen (non-blocking)
    sendWelcomeEmail({
      citizenName: user.name,
      citizenEmail: user.email,
    }).catch((err) => {
      console.error('[AuthController] Error sending welcome email:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        employeeId: user.employeeId,
        active: user.active,
        mustChangePassword: user.mustChangePassword,
        profileImage: user.profileImage,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Server registration error.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, employeeId, identifier, password } = req.body;

    const authIdentifier = (employeeId || identifier || email || '').trim();
    if (!authIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide valid credentials and password.' });
    }

    let user;
    // If identifier starts with 'OFC' or employeeId is provided, query by employeeId
    const isEmployeeIdFormat = /^OFC\d+$/i.test(authIdentifier) || !!employeeId;

    if (isEmployeeIdFormat) {
      user = await User.findOne({ employeeId: authIdentifier.toUpperCase() });
    } else {
      user = await User.findOne({ email: authIdentifier.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: isEmployeeIdFormat
          ? 'Invalid credentials. Officer with this Employee ID was not found.'
          : 'Invalid credentials. User not found.',
      });
    }

    // Check active status (e.g. deactivated officers cannot login)
    if (user.active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the municipal administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        employeeId: user.employeeId,
        department: user.department,
      },
      process.env.JWT_SECRET || 'civicpulse_secret_key_2026',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        employeeId: user.employeeId,
        active: user.active,
        mustChangePassword: user.mustChangePassword,
        profileImage: user.profileImage,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Server login error.' });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If currentPassword is provided, verify it
    if (currentPassword && user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        employeeId: user.employeeId,
        department: user.department,
      },
      process.env.JWT_SECRET || 'civicpulse_secret_key_2026',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Password changed successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        employeeId: user.employeeId,
        active: user.active,
        mustChangePassword: user.mustChangePassword,
        profileImage: user.profileImage,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error changing password.' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        employeeId: user.employeeId,
        active: user.active,
        mustChangePassword: user.mustChangePassword,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error fetching user profile.' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { name, phone, department, profileImage } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        employeeId: user.employeeId,
        active: user.active,
        mustChangePassword: user.mustChangePassword,
        profileImage: user.profileImage,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error updating profile.' });
  }
}

