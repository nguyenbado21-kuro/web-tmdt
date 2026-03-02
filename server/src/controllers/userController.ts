import { Request, Response } from 'express';
import { userService } from '../services/userService';

export const getUsers = (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, data: userService.getAll() });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

export const getUser = (req: Request, res: Response): void => {
  try {
    const user = userService.getById(req.params.id);
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

export const createUser = (req: Request, res: Response): void => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) { res.status(400).json({ success: false, error: 'name, email and password are required' }); return; }
    const existing = userService.findByEmail(email);
    if (existing) { res.status(409).json({ success: false, error: 'Email already registered' }); return; }
    const user = userService.create({ name, email, password, role: role ?? 'customer' });
    res.status(201).json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

export const updateUser = (req: Request, res: Response): void => {
  try {
    const updated = userService.update(req.params.id, req.body);
    if (!updated) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

export const deleteUser = (req: Request, res: Response): void => {
  try {
    const deleted = userService.delete(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, message: 'User deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

export const loginUser = (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;
    const user = userService.findByEmail(email);
    if (!user || user.password !== password) {
      res.status(401).json({ success: false, error: 'Invalid credentials' }); return;
    }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};
