import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes';
import issueRoutes from './routes/issueRoutes';
import officerRoutes from './routes/officerRoutes';
import adminRoutes from './routes/adminRoutes';
import categoryRoutes from './routes/categoryRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { verifyEmailTransporter } from './services/emailService';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const rawMongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicpulse';
const MONGO_URI = rawMongoUri.trim();

// Database connection helper with connection caching
let connectingPromise: Promise<typeof mongoose | null> | null = null;

export async function connectDB(): Promise<typeof mongoose | null> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (connectingPromise) {
    return connectingPromise;
  }
  connectingPromise = mongoose
    .connect(MONGO_URI, { dbName: 'civicpulse' })
    .then((m) => {
      console.log('[CivicPulse] MongoDB Atlas connected successfully');
      return m;
    })
    .catch((err: any) => {
      console.error(`[CivicPulse] MongoDB connection failed: ${err.message || 'Unknown error'}`);
      connectingPromise = null;
      return null;
    });

  return connectingPromise;
}

// Database auto-connection middleware for serverless invocations
app.use(async (_req, _res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);

// Root & Health check endpoints
app.get('/', (_req, res) => {
  res.json({
    message: 'CivicPulse API is running successfully',
    status: 'OK',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CivicPulse API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Start listening when running standalone (not serverless)
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[CivicPulse] Express Server running on http://localhost:${PORT}`);
      verifyEmailTransporter().then((res) => {
        if (res.success) {
          console.log(`[CivicPulse] 📧 Email Service: ${res.message}`);
        } else {
          console.log(`[CivicPulse] ℹ️ Email Service: ${res.message}`);
        }
      });
    });
  });
}

export default app;

