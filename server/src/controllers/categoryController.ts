import { Request, Response } from 'express';
import { categoryService } from '../services/categoryService';

export const getCategories = (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, data: categoryService.getAll() });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

export const getCategory = (req: Request, res: Response): void => {
  try {
    const category = categoryService.getById(req.params.id);
    if (!category) { res.status(404).json({ success: false, error: 'Category not found' }); return; }
    res.json({ success: true, data: category });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
};

export const createCategory = (req: Request, res: Response): void => {
  try {
    const { name, image, slug } = req.body;
    if (!name || !slug) { res.status(400).json({ success: false, error: 'name and slug are required' }); return; }
    const category = categoryService.create({ name, image: image ?? '', slug, productCount: 0 });
    res.status(201).json({ success: true, data: category });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

export const updateCategory = (req: Request, res: Response): void => {
  try {
    const updated = categoryService.update(req.params.id, req.body);
    if (!updated) { res.status(404).json({ success: false, error: 'Category not found' }); return; }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

export const deleteCategory = (req: Request, res: Response): void => {
  try {
    const deleted = categoryService.delete(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, error: 'Category not found' }); return; }
    res.json({ success: true, message: 'Category deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};
