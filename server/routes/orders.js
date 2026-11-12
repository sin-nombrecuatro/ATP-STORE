const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const FREE_SHIPPING_FROM = Number(process.env.FREE_SHIPPING_FROM || 200000);
const SHIPPING_COST = Number(process.env.SHIPPING_COST || 12000);
const s = (v, n = 120) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  const reserved = []; // para revertir stock si algo falla
  try {
    const { items, shipping } = req.body || {};
    if (!Array.isArray(items) || items.length === 0 || items.length > 30)
      return res.status(400).json({ error: 'El carrito está vacío o es inválido.' });

    const ship = {
      fullName: s(shipping && shipping.fullName, 80),
      phone: s(shipping && shipping.phone, 20),
      address: s(shipping && shipping.address, 160),
      city: s(shipping && shipping.city, 60)
    };
    if (!ship.fullName || !ship.phone || !ship.address || !ship.city)
      return res.status(400).json({ error: 'Completa los datos de envío.' });

    const orderItems = [];
    let subtotal = 0;
    for (const it of items) {
      const qty = Math.floor(Number(it && it.quantity));
      if (!it || !mongoose.isValidObjectId(it.productId) || !(qty >= 1 && qty <= 20))
        return res.status(400).json({ error: 'Producto o cantidad inválida.' });

      // El precio SIEMPRE se toma de la base de datos, nunca del cliente
      const p = await Product.findOneAndUpdate({ _id: it.productId, stock: { $gte: qty } }, { $inc: { stock: -qty } }, { returnDocument: 'after' });
      if (!p) return res.status(409).json({ error: 'Uno de los productos ya no tiene stock suficiente.' });
      reserved.push({ id: p._id, qty });

      orderItems.push({ product: p._id, name: p.name, price: p.price, size: s(it.size, 10), color: s(it.color, 30), quantity: qty });
      subtotal += p.price * qty;
    }

    const total = subtotal + (subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST);
    const order = await Order.create({ user: req.user._id, items: orderItems, total, shipping: ship });
    res.status(201).json({ order });
  } catch (e) {
    await Promise.all(reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
    next(e);
  }
});

router.get('/mine', async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ orders });
  } catch (e) { next(e); }
});

module.exports = router;
