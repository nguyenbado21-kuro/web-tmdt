import { Request, Response } from 'express';
import { productService } from '../services/productService';
import { ApiResponse, Product } from '../models/types';

// GET /products?categoryId=&search=&featured=
export const getProducts = (req: Request, res: Response): void => {
  try {
    const { categoryId, search, featured } = req.query;
    const featuredBool =
      featured === 'true' ? true : featured === 'false' ? false : undefined;

    const products = productService.getAll(
      categoryId as string | undefined,
      search as string | undefined,
      featuredBool
    );

    const response: ApiResponse<Product[]> = { success: true, data: products };
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

// GET /products/:id
export const getProduct = (req: Request, res: Response): void => {
  try {
    const product = productService.getById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
};

// POST /products
export const createProduct = (req: Request, res: Response): void => {
  try {
    const { name, description, price, categoryId, images, stock, rating, reviewCount, featured } =
      req.body;

    // Validation
    if (!name || !description || price === undefined || !categoryId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, price, categoryId',
      });
      return;
    }
    if (typeof price !== 'number' || price < 0) {
      res.status(400).json({ success: false, error: 'Price must be a non-negative number' });
      return;
    }

    const product = productService.create({
      name,
      description,
      price,
      originalPrice: req.body.originalPrice ?? undefined,
      categoryId,
      images: images ?? [],
      stock: stock ?? 0,
      rating: rating ?? 0,
      reviewCount: reviewCount ?? 0,
      featured: featured ?? false,
    });

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
};

// PUT /products/:id
export const updateProduct = (req: Request, res: Response): void => {
  try {
    const updated = productService.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
};

// DELETE /products/:id
export const deleteProduct = (req: Request, res: Response): void => {
  try {
    const deleted = productService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
};
