import { Request, Response } from 'express';
import { orderService } from '../services/orderService';

export const getOrders = (req: Request, res: Response): void => {
  try {
    const { userId } = req.query;
    res.json({ success: true, data: orderService.getAll(userId as string | undefined) });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

export const getOrder = (req: Request, res: Response): void => {
  try {
    const order = orderService.getById(req.params.id);
    if (!order) { res.status(404).json({ success: false, error: 'Order not found' }); return; }
    res.json({ success: true, data: order });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
};

export const createOrder = (req: Request, res: Response): void => {
  try {
    const { userId, customerName, customerEmail, items, totalPrice, address } = req.body;
    if (!userId || !items?.length || !totalPrice || !address) {
      res.status(400).json({ success: false, error: 'Missing required order fields' }); return;
    }
    const order = orderService.create({ userId, customerName, customerEmail, items, totalPrice, status: 'pending', address });
    res.status(201).json({ success: true, data: order });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
};

export const updateOrder = (req: Request, res: Response): void => {
  try {
    const updated = orderService.update(req.params.id, req.body);
    if (!updated) { res.status(404).json({ success: false, error: 'Order not found' }); return; }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
};

export const deleteOrder = (req: Request, res: Response): void => {
  try {
    const deleted = orderService.delete(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, error: 'Order not found' }); return; }
    res.json({ success: true, message: 'Order deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete order' });
  }
};
