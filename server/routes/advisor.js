const express = require('express');
const rateLimit = require('express-rate-limit');
const Product = require('../models/Product');
const { optionalAuth } = require('../middleware/auth');
const { advise } = require('../services/advisor');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Vas muy rápido 😅 espera un momento y vuelve a preguntar.' }
});

router.post('/chat', limiter, optionalAuth, async (req, res, next) => {
  try {
    const { message, history } = req.body || {};
    if (typeof message !== 'string' || !message.trim())
      return res.status(400).json({ error: 'Escribe tu mensaje.' });

    const products = await Product.find({ stock: { $gt: 0 } }).lean();
    const result = await advise({
      message: message.trim().slice(0, 500),
      history: Array.isArray(history) ? history : [],
      user: req.user,
      products
    });
    res.json(result);
  } catch (e) { next(e); }
});

module.exports = router;
