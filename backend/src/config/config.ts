import 'dotenv/config';

export const config = {
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3000',
  },
  database: {
    type: (process.env.DATABASE_TYPE || 'postgres') as any,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'military_system',
    path: process.env.DATABASE_PATH || './military_system.db',
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your_encryption_key_32_chars_long!',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : ['http://localhost:5173'],
  },
  file: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};

export default config;
