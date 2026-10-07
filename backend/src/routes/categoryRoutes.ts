import { Router } from 'express';
import { getCategories, getAllAdminCategories, createCategory, updateCategory } from '../controllers/categoryController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getCategories);
router.get('/admin', authenticateToken, requireRole(['admin']), getAllAdminCategories);
router.post('/', authenticateToken, requireRole(['admin']), createCategory);
router.put('/:id', authenticateToken, requireRole(['admin']), updateCategory);

export default router;
