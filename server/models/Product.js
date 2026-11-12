const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, enum: ['Mujer', 'Hombre', 'Calzado', 'Accesorios'] },
    type: { type: String, required: true }, // camiseta, jean, vestido...
    price: { type: Number, required: true, min: 0 }, // COP
    colors: [String],
    sizes: [String],
    tags: [String], // casual, formal, verano, fiesta...
    image: { type: String, required: true },
    stock: { type: Number, default: 20, min: 0 },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
