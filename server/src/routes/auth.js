import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { COOKIE, cookieOptions, requireAuth, signToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();
const authLimit = rateLimit({ name: 'auth', limit: 10, windowMs: 60_000, by: 'ip' }); // brute-force guard

const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(100),
  role: z.enum(['user', 'admin', 'customer']).default('user').transform((r) => (r === 'customer' ? 'user' : r)),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(100) });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/register', authLimit, async (req, res) => {
  const { name, email, password, role } = registerSchema.parse(req.body);
  if (await User.exists({ email: email.toLowerCase() }))
    return res.status(409).json({ error: 'That email already has an account. Sign in instead.' });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role });
  res.cookie(COOKIE, signToken(user), cookieOptions).status(201).json({ user: publicUser(user) });
});

router.post('/login', authLimit, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.cookie(COOKIE, signToken(user), cookieOptions).json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined }).json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  res.json({ user: publicUser(user) });
});

export default router;
