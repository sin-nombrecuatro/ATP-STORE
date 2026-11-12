require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const seedData = require('./seed/products');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        styleSrcAttr: ["'unsafe-inline'"], // permite style="" en elementos; <style> inline sigue bloqueado
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    }
  })
);
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// API
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/config', (_req, res) =>
  res.json({
    freeShippingFrom: Number(process.env.FREE_SHIPPING_FROM || 200000),
    shippingCost: Number(process.env.SHIPPING_COST || 12000),
    aiEnabled: Boolean(process.env.ANTHROPIC_API_KEY)
  })
);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/advisor', require('./routes/advisor'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// Frontend estático
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

// Errores
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
});

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('Falta JWT_SECRET en .env (mínimo 16 caracteres). Copia .env.example a .env');
    process.exit(1);
  }
  await connectDB();
  if (process.env.AUTO_SEED !== 'false' && (await Product.countDocuments()) === 0) {
    await Product.insertMany(seedData);
    console.log(`[Seed] Catálogo inicial cargado (${seedData.length} productos).`);
  }
  app.listen(PORT, () => console.log(`ATP Store en http://localhost:${PORT}`));
}

if (require.main === module) {
  start().catch((e) => {
    console.error('No se pudo iniciar el servidor:', e.message);
    process.exit(1);
  });
}

module.exports = app;
