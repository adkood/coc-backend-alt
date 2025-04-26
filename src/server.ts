import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { DataSource } from 'typeorm';

import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';

import authRouter from '../src/api/routes/auth/AuthRoutes';
import usersRouter from '../src/api/routes/users/UserRoutes';
import gstRouter from '../src/api/routes/gst/GstRoutes';

import { Users } from './api/entity/user/Users';
import { GstRegistrations } from './api/entity/gst/GstRegistrations';
import { Gstr1 } from './api/entity/gst/Gstr1';

const logger = pino({ name: 'server start' });
const app: Express = express();

// Create a DataSource instance
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_HOST : process.env.LOCAL_DB_HOST,
  port: 3306,
  username: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_USERNAME : process.env.LOCAL_DB_USERNAME,
  password: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_PASSWORD : process.env.LOCAL_DB_PASSWORD,
  database: process.env.NODE_ENV === 'production' ? process.env.PROD_DB_NAME : process.env.LOCAL_DB_NAME,
  entities: [
    Users,
    GstRegistrations,
    Gstr1
  ],
  synchronize: false,
});

// Initialize the DataSource
AppDataSource.initialize()
  .then(() => {
    console.log('DB connected');
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

// Middleware setup
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true); // Allow all origins
    },
    credentials: true
    // exposedHeaders: ['set-cookie']
  })
);

app.use(helmet());
// app.use(rateLimiter);
app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());

// Routes mounting
app.use('/practice/v1/auth', authRouter);
app.use('/practice/v1/users', usersRouter);
app.use('/practice/v1/gst', gstRouter);

// Test route
app.get('/', (req, res) => {
  res.send('Welcome to coc');
});

// Error handlers
app.use(errorHandler());

export { app, AppDataSource, logger };