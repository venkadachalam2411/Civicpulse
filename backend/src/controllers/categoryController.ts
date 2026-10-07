import { Request, Response } from 'express';
import Category from '../models/Category';

export async function getCategories(_req: Request, res: Response) {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 });
    return res.json({ success: true, categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllAdminCategories(_req: Request, res: Response) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json({ success: true, categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const category = await Category.create({ name, description: description || '', icon: icon || 'AlertCircle' });
    return res.status(201).json({ success: true, category });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, icon, active } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (active !== undefined) category.active = active;

    await category.save();
    return res.json({ success: true, category });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
