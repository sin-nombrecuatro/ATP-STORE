const express = require('express');
const rateLimit = require('express-rate-limit');
const Message = require('../models/Message');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Has enviado muchos mensajes. Intenta más tarde.' } });

router.post('/', limiter, optionalAuth, async (req, res, next) => {
  try {
    const { name, email, message } = req.body || {};
    if (![name, email, message].every((v) => typeof v === 'string' && v.trim()))
      return res.status(400).json({ error: 'Completa todos los campos.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return res.status(400).json({ error: 'Correo inválido.' });
    await Message.create({ name: name.trim().slice(0, 80), email: email.trim().slice(0, 120), message: message.trim().slice(0, 1000), user: req.user ? req.user._id : undefined });
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
