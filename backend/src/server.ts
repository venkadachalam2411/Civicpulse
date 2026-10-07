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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicpulse';

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
    timestamp: new Date().toISOString(),
  });
});

// Database connection & server listen
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`[CivicPulse] MongoDB connected successfully to ${MONGODB_URI}`);
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
  })
  .catch((err) => {
    console.error('[CivicPulse] MongoDB connection error:', err);
    // Start server anyway so API endpoints can present friendly DB error or run in demo mode
    app.listen(PORT, () => {
      console.log(`[CivicPulse] Express Server running on http://localhost:${PORT} (Database pending)`);
    });
  });

export default app;
