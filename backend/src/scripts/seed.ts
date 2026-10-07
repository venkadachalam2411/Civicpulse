import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User';
import Category from '../models/Category';
import Issue from '../models/Issue';
import Upvote from '../models/Upvote';
import Notification from '../models/Notification';
import IssueTimeline from '../models/IssueTimeline';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicpulse';

async function seedDatabase() {
  try {
    console.log(`Connecting to database at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected! Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Issue.deleteMany({}),
      Upvote.deleteMany({}),
      Notification.deleteMany({}),
      IssueTimeline.deleteMany({}),
    ]);

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Seed Categories
    console.log('Seeding Categories...');
    const categoryData = [
      { name: 'Roads', description: 'Potholes, asphalt damage, broken dividers, road cracks', icon: 'Construction' },
      { name: 'Garbage', description: 'Uncollected trash, garbage heaps, overflowing bins', icon: 'Trash2' },
      { name: 'Drainage', description: 'Clogged drains, open manholes, sewage overflow', icon: 'Waves' },
      { name: 'Water', description: 'Water pipeline leaks, low pressure, contamination', icon: 'Droplets' },
      { name: 'Electricity', description: 'Power outages, loose high-voltage wires, transformer issues', icon: 'Zap' },
      { name: 'Street Lights', description: 'Non-functioning street lamps, flickering lights, dark streets', icon: 'Lightbulb' },
      { name: 'Traffic', description: 'Broken traffic signals, illegal parking, missing signs', icon: 'TrafficCone' },
      { name: 'Public Property', description: 'Damaged park benches, broken fences, bus shelters', icon: 'Building' },
      { name: 'Sanitation', description: 'Unclean public toilets, foul odor, unsanitary conditions', icon: 'Sparkles' },
      { name: 'Other', description: 'General civic complaints and miscellaneous community concerns', icon: 'HelpCircle' },
    ];
    await Category.insertMany(categoryData);

    // 2. Seed Users (1 Admin, 3 Officers, 8 Citizens)
    console.log('Seeding Users...');
    const admin = await User.create({
      name: 'Venkat (System Admin)',
      email: 'admin@civicpulse.org',
      password: passwordHash,
      phone: '+1-555-0100',
      role: 'admin',
      department: 'Central Administration',
    });

    const officer1 = await User.create({
      name: 'Robert Vance',
      email: 'robert.vance@civicpulse.com',
      employeeId: 'OFC001',
      password: passwordHash,
      phone: '+1-555-0101',
      role: 'officer',
      department: 'Roads & Infrastructure',
      active: true,
      mustChangePassword: false,
    });

    const officer2 = await User.create({
      name: 'Elena Rostova',
      email: 'elena.rostova@civicpulse.com',
      employeeId: 'OFC002',
      password: passwordHash,
      phone: '+1-555-0102',
      role: 'officer',
      department: 'Water & Sanitation Dept',
      active: true,
      mustChangePassword: false,
    });

    const officer3 = await User.create({
      name: 'Marcus Brody',
      email: 'marcus.brody@civicpulse.com',
      employeeId: 'OFC003',
      password: passwordHash,
      phone: '+1-555-0103',
      role: 'officer',
      department: 'Electrical & Power Grid',
      active: true,
      mustChangePassword: false,
    });

    const citizens = [];
    const citizenNames = [
      'David Miller',
      'Priya Sharma',
      'Carlos Mendez',
      'Amina Yusuf',
      'John Smith',
      'Sophia Chen',
      'Michael Scott',
      'Jessica Taylor',
    ];

    for (let i = 0; i < citizenNames.length; i++) {
      const citizen = await User.create({
        name: citizenNames[i],
        email: `citizen${i + 1}@civicpulse.org`,
        password: passwordHash,
        phone: `+1-555-020${i + 1}`,
        role: 'citizen',
      });
      citizens.push(citizen);
    }

    // 3. Seed Sample Issues
    console.log('Seeding Issues & Timelines...');
    const sampleIssues = [
      {
        issueId: 'CIV-2026-00101',
        title: 'Hazardous deep pothole near Metro Station Gate 3',
        description: 'Large pothole measuring approx 4 feet across causing severe traffic congestion and danger to two-wheelers during rainy conditions.',
        category: 'Roads',
        severity: 'critical',
        priorityScore: 92,
        priority: 'critical',
        location: '124 Anna Salai, near Metro Gate 3',
        latitude: 13.0827,
        longitude: 80.2707,
        imageUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop'],
        status: 'assigned',
        reportedBy: citizens[0]._id,
        assignedTo: officer1._id,
        upvoteCount: 42,
        slaDeadline: new Date(Date.now() + 10 * 3600 * 1000), // 10 hours left
      },
      {
        issueId: 'CIV-2026-00102',
        title: 'Overflowing garbage bin attracting stray animals',
        description: 'Commercial dumpster on 5th Avenue hasn’t been emptied for 4 days. Waste spilling onto sidewalk creating unhygienic stench.',
        category: 'Garbage',
        severity: 'high',
        priorityScore: 78,
        priority: 'high',
        location: '5th Avenue & Market Square',
        latitude: 13.085,
        longitude: 80.275,
        imageUrls: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop'],
        status: 'in_progress',
        reportedBy: citizens[1]._id,
        assignedTo: officer2._id,
        upvoteCount: 28,
        slaDeadline: new Date(Date.now() + 18 * 3600 * 1000),
      },
      {
        issueId: 'CIV-2026-00103',
        title: 'Major water pipeline leak flooding main residential street',
        description: 'Clean water gushing out of broken underground supply pipe. Water pressure in surrounding 50 homes severely affected.',
        category: 'Water',
        severity: 'critical',
        priorityScore: 96,
        priority: 'critical',
        location: '42 Lotus Boulevard, Block B',
        latitude: 13.078,
        longitude: 80.262,
        imageUrls: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop'],
        status: 'resolved',
        reportedBy: citizens[2]._id,
        assignedTo: officer2._id,
        upvoteCount: 65,
        resolutionRemarks: 'Replaced broken 6-inch main valve and restored full water pressure to residential grid.',
        resolutionImages: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop'],
        resolvedAt: new Date(Date.now() - 4 * 3600 * 1000),
        slaDeadline: new Date(Date.now() + 8 * 3600 * 1000),
      },
      {
        issueId: 'CIV-2026-00104',
        title: 'Dark street due to 5 non-functional streetlights',
        description: 'Complete stretch of 3rd Cross Street is pitch black at night creating safety concerns for pedestrian commuters.',
        category: 'Street Lights',
        severity: 'medium',
        priorityScore: 54,
        priority: 'medium',
        location: '3rd Cross Street, Gandhi Nagar',
        latitude: 13.09,
        longitude: 80.28,
        imageUrls: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop'],
        status: 'verified',
        reportedBy: citizens[3]._id,
        assignedTo: null,
        upvoteCount: 19,
        slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      },
      {
        issueId: 'CIV-2026-00105',
        title: 'High-voltage electric wire hanging low near school playground',
        description: 'Hanging power line snapped during storm and is suspended just 6 feet above ground near St. Jude Public School.',
        category: 'Electricity',
        severity: 'critical',
        priorityScore: 99,
        priority: 'critical',
        location: 'St. Jude School Lane',
        latitude: 13.072,
        longitude: 80.255,
        imageUrls: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop'],
        status: 'assigned',
        reportedBy: citizens[4]._id,
        assignedTo: officer3._id,
        upvoteCount: 88,
        slaDeadline: new Date(Date.now() - 2 * 3600 * 1000), // SLA Breached for demo!
      },
      {
        issueId: 'CIV-2026-00106',
        title: 'Clogged storm drain causing localized rainwater standing',
        description: 'Plastic bags and debris blocking gutter outlet near community center.',
        category: 'Drainage',
        severity: 'medium',
        priorityScore: 45,
        priority: 'medium',
        location: 'Community Center, Sector 4',
        latitude: 13.088,
        longitude: 80.268,
        imageUrls: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop'],
        status: 'closed',
        reportedBy: citizens[5]._id,
        assignedTo: officer2._id,
        upvoteCount: 12,
        resolutionRemarks: 'De-silted storm drain inlet and cleared blocked pipes.',
        resolutionImages: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop'],
        resolvedAt: new Date(Date.now() - 48 * 3600 * 1000),
        slaDeadline: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        issueId: 'CIV-2026-00107',
        title: 'Broken traffic signal light at major 4-way intersection',
        description: 'Red light bulb burned out causing dangerous near-miss collisions during rush hour.',
        category: 'Traffic',
        severity: 'high',
        priorityScore: 82,
        priority: 'high',
        location: 'Central Plaza Junction',
        latitude: 13.081,
        longitude: 80.279,
        imageUrls: ['https://images.unsplash.com/photo-1508873696983-2df515122519?w=800&auto=format&fit=crop'],
        status: 'under_review',
        reportedBy: citizens[6]._id,
        assignedTo: null,
        upvoteCount: 34,
        slaDeadline: new Date(Date.now() + 14 * 3600 * 1000),
      },
      {
        issueId: 'CIV-2026-00108',
        title: 'Vandalized public park bench with sharp exposed iron edges',
        description: 'Wooden slats broken off bench near children play zone.',
        category: 'Public Property',
        severity: 'low',
        priorityScore: 28,
        priority: 'low',
        location: 'Greenwood Park North',
        latitude: 13.095,
        longitude: 80.26,
        imageUrls: ['https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop'],
        status: 'reported',
        reportedBy: citizens[7]._id,
        assignedTo: null,
        upvoteCount: 8,
        slaDeadline: new Date(Date.now() + 120 * 3600 * 1000),
      },
    ];

    for (const issueData of sampleIssues) {
      const issue = await Issue.create(issueData);

      // Create initial timeline
      await IssueTimeline.create({
        issue: issue._id,
        status: 'reported',
        message: 'Issue reported by citizen.',
        changedBy: issue.reportedBy,
        remarks: 'Report registered in system.',
      });

      if (['verified', 'assigned', 'in_progress', 'resolved', 'closed'].includes(issue.status)) {
        await IssueTimeline.create({
          issue: issue._id,
          status: 'verified',
          message: 'Complaint verified by Admin Sarah Connor.',
          changedBy: admin._id,
        });
      }

      if (['assigned', 'in_progress', 'resolved', 'closed'].includes(issue.status) && issue.assignedTo) {
        await IssueTimeline.create({
          issue: issue._id,
          status: 'assigned',
          message: `Assigned to Officer.`,
          changedBy: admin._id,
        });
      }

      if (['in_progress', 'resolved', 'closed'].includes(issue.status) && issue.assignedTo) {
        await IssueTimeline.create({
          issue: issue._id,
          status: 'in_progress',
          message: 'Officer started site inspection and resolution work.',
          changedBy: issue.assignedTo,
        });
      }

      if (['resolved', 'closed'].includes(issue.status) && issue.assignedTo) {
        await IssueTimeline.create({
          issue: issue._id,
          status: 'resolved',
          message: 'Officer completed work and submitted resolution proof photo.',
          changedBy: issue.assignedTo,
          remarks: issue.resolutionRemarks,
        });
      }

      if (issue.status === 'closed') {
        await IssueTimeline.create({
          issue: issue._id,
          status: 'closed',
          message: 'Citizen confirmed satisfactory resolution. Ticket closed.',
          changedBy: issue.reportedBy,
        });
      }

      // Add sample upvotes
      const numUpvotes = Math.min(issue.upvoteCount, citizens.length);
      for (let k = 0; k < numUpvotes; k++) {
        await Upvote.create({
          issue: issue._id,
          user: citizens[k]._id,
        });
      }
    }

    console.log('Seeding completed successfully!');
    console.log('\n--- DEMO USER CREDENTIALS ---');
    console.log('Admin:   admin@civicpulse.org / Password123!');
    console.log('Officer: robert.vance@civicpulse.com (ID: OFC001) / Password123!');
    console.log('Officer: elena.rostova@civicpulse.com (ID: OFC002) / Password123!');
    console.log('Officer: marcus.brody@civicpulse.com (ID: OFC003) / Password123!');
    console.log('Citizen: citizen1@civicpulse.org / Password123!');
    console.log('-----------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
