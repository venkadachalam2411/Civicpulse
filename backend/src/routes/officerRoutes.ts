import { Router } from 'express';
import { getOfficerIssues, updateIssueStatus, resolveIssue } from '../controllers/officerController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { upload } from '../services/storageService';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['officer', 'admin']));

router.get('/issues', getOfficerIssues);
router.put('/issues/:id/status', updateIssueStatus);
router.post('/issues/:id/resolve', upload.array('resolutionImages', 5), resolveIssue);

export default router;
