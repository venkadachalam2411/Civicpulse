import { Router } from 'express';
import {
  getAllAdminIssues,
  getUsers,
  getOfficers,
  getNextOfficerDetails,
  createOfficer,
  updateOfficer,
  toggleOfficerStatus,
  assignOfficer,
  updatePriorityOverride,
  verifyIssue,
  getAnalytics,
} from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/issues', getAllAdminIssues);
router.get('/users', getUsers);
router.get('/officers', getOfficers);
router.get('/officers/next-id', getNextOfficerDetails);
router.post('/officers', createOfficer);
router.put('/officers/:id', updateOfficer);
router.patch('/officers/:id/status', toggleOfficerStatus);
router.put('/issues/:id/assign', assignOfficer);
router.put('/issues/:id/priority', updatePriorityOverride);
router.put('/issues/:id/verify', verifyIssue);
router.get('/analytics', getAnalytics);

export default router;

