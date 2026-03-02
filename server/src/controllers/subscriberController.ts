import { Request, Response } from 'express';
import { subscriberService } from '../services/subscriberService';

export const getSubscribers = (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, data: subscriberService.getAll() });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch subscribers' });
  }
};

export const subscribe = (req: Request, res: Response): void => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'Valid email is required' }); return;
    }
    const sub = subscriberService.subscribe(email);
    if (!sub) {
      res.status(409).json({ success: false, error: 'Email already subscribed' }); return;
    }
    res.status(201).json({ success: true, data: sub, message: 'Successfully subscribed!' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
};

export const deleteSubscriber = (req: Request, res: Response): void => {
  try {
    const deleted = subscriberService.delete(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, error: 'Subscriber not found' }); return; }
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete subscriber' });
  }
};
