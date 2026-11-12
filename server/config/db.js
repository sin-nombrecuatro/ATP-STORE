const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atp_store';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('[MongoDB] Conectado:', mongoose.connection.host + '/' + mongoose.connection.name);
}

module.exports = connectDB;
