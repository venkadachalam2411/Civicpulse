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

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicpulse';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(MONGO_URI, { dbName: 'civicpulse' });
    console.log('MongoDB connected successfully! Clearing existing collections...');

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
      // 1. Chennai (North-East TN)
      {
        issueId: 'CIV-2026-00101',
        title: 'Hazardous deep pothole near Metro Station Gate 3',
        description: 'Large pothole measuring approx 4 feet across causing severe traffic congestion and danger to two-wheelers during rainy conditions.',
        category: 'Roads',
        severity: 'critical',
        priorityScore: 92,
        priority: 'critical',
        location: 'Anna Salai, Metro Gate 3, Chennai',
        latitude: 13.0827,
        longitude: 80.2707,
        imageUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop'],
        status: 'assigned',
        reportedBy: citizens[0]._id,
        assignedTo: officer1._id,
        upvoteCount: 42,
        slaDeadline: new Date(Date.now() + 10 * 3600 * 1000),
      },
      // 2. Coimbatore (Western TN)
      {
        issueId: 'CIV-2026-00102',
        title: 'Commercial waste overflowing near Gandhipuram bus stand',
        description: 'Large dumpster on Cross Cut Road has not been cleared for 3 days. Trash spilling onto pedestrian walkway.',
        category: 'Garbage',
        severity: 'high',
        priorityScore: 78,
        priority: 'high',
        location: 'Cross Cut Road, Gandhipuram, Coimbatore',
        latitude: 11.0168,
        longitude: 76.9558,
        imageUrls: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop'],
        status: 'in_progress',
        reportedBy: citizens[1]._id,
        assignedTo: officer2._id,
        upvoteCount: 36,
        slaDeadline: new Date(Date.now() + 18 * 3600 * 1000),
      },
      // 3. Madurai (South-Central TN)
      {
        issueId: 'CIV-2026-00103',
        title: 'Drinking water pipeline rupture near Goripalayam junction',
        description: 'Main Cauvery supply line broken, flooding the road and depriving 80 residential houses of water pressure.',
        category: 'Water',
        severity: 'critical',
        priorityScore: 96,
        priority: 'critical',
        location: 'Goripalayam Main Junction, Madurai',
        latitude: 9.9252,
        longitude: 78.1198,
        imageUrls: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop'],
        status: 'resolved',
        reportedBy: citizens[2]._id,
        assignedTo: officer2._id,
        upvoteCount: 65,
        resolutionRemarks: 'Replaced broken 6-inch main valve and restored full water supply to Goripalayam grid.',
        resolutionImages: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop'],
        resolvedAt: new Date(Date.now() - 4 * 3600 * 1000),
        slaDeadline: new Date(Date.now() + 8 * 3600 * 1000),
      },
      // 4. Tiruchirappalli (Central TN)
      {
        issueId: 'CIV-2026-00104',
        title: 'Flickering streetlights creating safety hazards near Rockfort',
        description: 'Six consecutive LED poles are completely dark on West Boulevard road creating blind corners at night.',
        category: 'Street Lights',
        severity: 'medium',
        priorityScore: 54,
        priority: 'medium',
        location: 'West Boulevard Road, Rockfort, Tiruchirappalli',
        latitude: 10.7905,
        longitude: 78.7047,
        imageUrls: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop'],
        status: 'verified',
        reportedBy: citizens[3]._id,
        assignedTo: null,
        upvoteCount: 22,
        slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      },
      // 5. Salem (North-Central TN)
      {
        issueId: 'CIV-2026-00105',
        title: 'Dangerous low-hanging power wire near Fairlands School',
        description: 'Damaged overhead electric wire sagging dangerously close to school van entry path after windstorm.',
        category: 'Electricity',
        severity: 'critical',
        priorityScore: 99,
        priority: 'critical',
        location: 'Fairlands Main Road, Salem',
        latitude: 11.6643,
        longitude: 78.1460,
        imageUrls: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop'],
        status: 'assigned',
        reportedBy: citizens[4]._id,
        assignedTo: officer3._id,
        upvoteCount: 88,
        slaDeadline: new Date(Date.now() - 2 * 3600 * 1000), // SLA Breached
      },
      // 6. Tirunelveli (Southern TN)
      {
        issueId: 'CIV-2026-00106',
        title: 'Clogged canal causing localized stagnation near Palayamkottai',
        description: 'Monsoon silt blocking stormwater drainage near Palayamkottai market causing waterlogging on road.',
        category: 'Drainage',
        severity: 'medium',
        priorityScore: 48,
        priority: 'medium',
        location: 'Market Road, Palayamkottai, Tirunelveli',
        latitude: 8.7139,
        longitude: 77.7567,
        imageUrls: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop'],
        status: 'closed',
        reportedBy: citizens[5]._id,
        assignedTo: officer2._id,
        upvoteCount: 15,
        resolutionRemarks: 'Cleared silt and unblocked drain culvert with municipal team.',
        resolutionImages: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop'],
        resolvedAt: new Date(Date.now() - 48 * 3600 * 1000),
        slaDeadline: new Date(Date.now() - 24 * 3600 * 1000),
      },
      // 7. Vellore (Northern TN)
      {
        issueId: 'CIV-2026-00107',
        title: 'Non-functional traffic signal at Katpadi Railway Junction',
        description: 'Signal stuck on yellow flash creating heavy vehicle gridlock during peak college and train hours.',
        category: 'Traffic',
        severity: 'high',
        priorityScore: 84,
        priority: 'high',
        location: 'Katpadi Railway Road, Vellore',
        latitude: 12.9165,
        longitude: 79.1325,
        imageUrls: ['https://images.unsplash.com/photo-1508873696983-2df515122519?w=800&auto=format&fit=crop'],
        status: 'under_review',
        reportedBy: citizens[6]._id,
        assignedTo: null,
        upvoteCount: 39,
        slaDeadline: new Date(Date.now() + 14 * 3600 * 1000),
      },
      // 8. Thanjavur (Delta Region TN)
      {
        issueId: 'CIV-2026-00108',
        title: 'Broken boundary railing at Sivaganga Park garden',
        description: 'Decorative iron railing collapsed into public walkway, leaving sharp jagged iron posts exposed.',
        category: 'Public Property',
        severity: 'low',
        priorityScore: 32,
        priority: 'low',
        location: 'Sivaganga Park, Thanjavur',
        latitude: 10.7870,
        longitude: 79.1378,
        imageUrls: ['https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop'],
        status: 'reported',
        reportedBy: citizens[7]._id,
        assignedTo: null,
        upvoteCount: 11,
        slaDeadline: new Date(Date.now() + 96 * 3600 * 1000),
      },
      // 9. Erode (Western TN)
      {
        issueId: 'CIV-2026-00109',
        title: 'Open drainage manhole cover near Brough Road market',
        description: 'Heavy concrete cover cracked and fallen into sewer. Urgent replacement required to prevent vehicle falls.',
        category: 'Drainage',
        severity: 'critical',
        priorityScore: 94,
        priority: 'critical',
        location: 'Brough Road, Erode',
        latitude: 11.3410,
        longitude: 77.7172,
        imageUrls: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop'],
        status: 'assigned',
        reportedBy: citizens[0]._id,
        assignedTo: officer2._id,
        upvoteCount: 52,
        slaDeadline: new Date(Date.now() + 12 * 3600 * 1000),
      },
      // 10. Kanyakumari / Nagercoil (Southernmost TN)
      {
        issueId: 'CIV-2026-00110',
        title: 'High mast light malfunctioning at Coastal Promenade',
        description: 'Coastal illumination high mast light transformer failure causing beach road darkness.',
        category: 'Street Lights',
        severity: 'medium',
        priorityScore: 60,
        priority: 'medium',
        location: 'Beach Road, Kanyakumari',
        latitude: 8.0883,
        longitude: 77.5385,
        imageUrls: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop'],
        status: 'verified',
        reportedBy: citizens[1]._id,
        assignedTo: null,
        upvoteCount: 29,
        slaDeadline: new Date(Date.now() + 40 * 3600 * 1000),
      },
      // 11. Hosur / Krishnagiri (North-Western TN)
      {
        issueId: 'CIV-2026-00111',
        title: 'Industrial area main road damaged by heavy container traffic',
        description: 'Deep road subsidence spanning 20 meters near SIPCOT Phase 1 entrance.',
        category: 'Roads',
        severity: 'high',
        priorityScore: 85,
        priority: 'high',
        location: 'SIPCOT Phase 1, Hosur',
        latitude: 12.7409,
        longitude: 77.8253,
        imageUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop'],
        status: 'in_progress',
        reportedBy: citizens[2]._id,
        assignedTo: officer1._id,
        upvoteCount: 47,
        slaDeadline: new Date(Date.now() + 20 * 3600 * 1000),
      },
      // 12. Thoothukudi (Tuticorin - Coastal Southern TN)
      {
        issueId: 'CIV-2026-00112',
        title: 'Harbor road traffic signal sensor malfunction',
        description: 'Heavy port container trucks facing intersection gridlocks due to stuck timer.',
        category: 'Traffic',
        severity: 'high',
        priorityScore: 76,
        priority: 'high',
        location: 'Port Access Road, Thoothukudi',
        latitude: 8.7642,
        longitude: 78.1348,
        imageUrls: ['https://images.unsplash.com/photo-1508873696983-2df515122519?w=800&auto=format&fit=crop'],
        status: 'reported',
        reportedBy: citizens[3]._id,
        assignedTo: null,
        upvoteCount: 18,
        slaDeadline: new Date(Date.now() + 30 * 3600 * 1000),
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
