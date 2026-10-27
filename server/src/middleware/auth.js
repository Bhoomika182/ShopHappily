import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const COOKIE = 'sm_token';

export const signToken = (user) =>
  jwt.sign({ id: String(user._id), role: user.role }, config.jwtSecret, { expiresIn: '7d' });

// JWT lives in an httpOnly cookie: JavaScript (and therefore XSS) cannot read it.
// Default is 'lax' (same-origin / reverse proxy). Use 'none' + secure for cross-site if needed.
export const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.COOKIE_SAME_SITE || 'none',
  secure: true,
  maxAge: 7 * 24 * 3600 * 1000,
};

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.id;
    req.role = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Your session expired. Sign in again.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
  next();
}
