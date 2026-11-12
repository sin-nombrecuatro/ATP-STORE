const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const router = express.Router();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const str = (v) => (typeof v === 'string' ? v.trim().slice(0, 60) : '');

router.get('/', async (req, res, next) => {
  try {
    const { category, type, q, min, max, sort, featured } = req.query;
    const filter = {};
    if (str(category)) filter.category = str(category);
    if (str(type)) filter.type = str(type).toLowerCase();
    if (featured === 'true') filter.featured = true;
    if (Number(min) > 0 || Number(max) > 0) {
      filter.price = {};
      if (Number(min) > 0) filter.price.$gte = Number(min);
      if (Number(max) > 0) filter.price.$lte = Number(max);
    }
    if (str(q)) {
      const rx = new RegExp(esc(str(q)), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { type: rx }, { tags: rx }, { colors: rx }];
    }
    const sorts = { price_asc: { price: 1 }, price_desc: { price: -1 }, new: { createdAt: -1 } };
    const products = await Product.find(filter).sort(sorts[sort] || { featured: -1, createdAt: -1 }).lean();
    res.json({ products });
  } catch (e) { next(e); }
});

router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: str(idOrSlug) };
    const product = await Product.findOne(query).lean();
    if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json({ product });
  } catch (e) { next(e); }
});

module.exports = router;
