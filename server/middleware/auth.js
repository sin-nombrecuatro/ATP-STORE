const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE = 'atp_token';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('Define JWT_SECRET (mínimo 16 caracteres) en el archivo .env');
  return s;
}

function signToken(user) {
  return jwt.sign({ id: user._id }, secret(), { expiresIn: '7d' });
}

function cookieOpts() {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE, token, { ...cookieOpts(), maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE, cookieOpts());
}

async function loadUser(req) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, secret());
    return await User.findById(id);
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
  try {
    const user = await loadUser(req);
    if (!user) return res.status(401).json({ error: 'Debes iniciar sesión.' });
    req.user = user;
    next();
  } catch (e) { next(e); }
}

// Sesión opcional (el asesor IA funciona con o sin login)
async function optionalAuth(req, _res, next) {
  try { req.user = await loadUser(req); next(); } catch (e) { next(e); }
}

module.exports = { signToken, setAuthCookie, clearAuthCookie, requireAuth, optionalAuth };
