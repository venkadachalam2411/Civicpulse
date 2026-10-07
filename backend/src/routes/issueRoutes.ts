import { Router } from 'express';
import {
  createIssue,
  getIssues,
  getMyIssues,
  getIssueById,
  toggleUpvote,
  confirmOrReopenIssue,
  suggestCategoryEndpoint,
  checkDuplicateEndpoint,
} from '../controllers/issueController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../services/storageService';

const router = Router();

router.post('/suggest-category', suggestCategoryEndpoint);
router.post('/check-duplicate', checkDuplicateEndpoint);
router.get('/', getIssues);
router.get('/my', authenticateToken, getMyIssues);
router.get('/:id', getIssueById);
router.post('/', authenticateToken, upload.array('images', 5), createIssue);
router.post('/:id/upvote', authenticateToken, toggleUpvote);
router.delete('/:id/upvote', authenticateToken, toggleUpvote);
router.post('/:id/confirm-resolution', authenticateToken, confirmOrReopenIssue);

export default router;
