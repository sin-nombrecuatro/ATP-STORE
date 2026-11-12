// Uso: npm run seed   (borra y vuelve a cargar el catálogo)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const data = require('./products');

(async () => {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany(data);
  console.log(`[Seed] ${data.length} productos cargados.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
