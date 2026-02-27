import express, { Application } from 'express';
import router from './routes/index.ts';
import errorHandler from '#shared/middlewares/errorHandler.ts';
import loggerMiddleware from '#shared/middlewares/logger.ts';
import cors from 'cors';

const app: Application = express();

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost'];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use('/api', router);
app.use(errorHandler);

export default app;
