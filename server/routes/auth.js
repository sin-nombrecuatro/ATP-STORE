const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { signToken, setAuthCookie, clearAuthCookie, requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
});

router.post('/register', limiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (![name, email, password].every((v) => typeof v === 'string'))
      return res.status(400).json({ error: 'Datos inválidos.' });
    if (name.trim().length < 2) return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres.' });
    if (!EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'Correo electrónico inválido.' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres.' });

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

    const user = await User.create({ name: name.trim(), email: email.trim(), password });
    setAuthCookie(res, signToken(user));
    res.status(201).json({ user: user.toPublic() });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    next(e);
  }
});

router.post('/login', limiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'Datos inválidos.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    const ok = user && (await user.checkPassword(password));
    if (!ok) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    setAuthCookie(res, signToken(user));
    res.json({ user: user.toPublic() });
  } catch (e) { next(e); }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Responde 200 con user:null si no hay sesión (evita errores 401 en consola de visitantes)
router.get('/me', optionalAuth, (req, res) => res.json({ user: req.user ? req.user.toPublic() : null }));

// Preferencias de estilo (las usa el asesor IA)
router.patch('/preferences', requireAuth, async (req, res, next) => {
  try {
    const { style, size, budget } = req.body || {};
    if (typeof style === 'string') req.user.preferences.style = style.slice(0, 80);
    if (typeof size === 'string') req.user.preferences.size = size.slice(0, 10);
    if (Number.isFinite(Number(budget))) req.user.preferences.budget = Math.max(0, Number(budget));
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (e) { next(e); }
});

module.exports = router;
