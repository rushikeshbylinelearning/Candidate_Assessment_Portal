const mongoose = require('mongoose');
const appLogger = require('../utils/appLogger');

const poolSize = Math.max(
  2,
  Math.min(5, parseInt(process.env.MONGODB_MAX_POOL_SIZE || '5', 10))
);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    appLogger.error('MONGODB_URI is not set');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: poolSize,
      minPoolSize: 0,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_MS || '30000', 10),
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    appLogger.info(`MongoDB connected (${conn.connection.host}, pool=${poolSize})`);
  } catch (error) {
    appLogger.error('MongoDB connection error', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
