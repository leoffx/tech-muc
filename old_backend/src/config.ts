import dotenv from 'dotenv';

dotenv.config();

export const PORT = Number(process.env.PORT) || 3001;
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const WORK_DIR = process.env.WORK_DIR || './workspace';
export const ALLOWED_GIT_HOST = process.env.ALLOWED_GIT_HOST || 'github.com';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const config = {
  port: PORT,
  databaseUrl: DATABASE_URL,
  openaiApiKey: OPENAI_API_KEY,
  workDir: WORK_DIR,
  allowedGitHost: ALLOWED_GIT_HOST,
  corsOrigin: CORS_ORIGIN,
  env: NODE_ENV,
};
