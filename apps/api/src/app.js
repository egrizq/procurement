import express from 'express';
import router from './routes/index.js';
import errorHandler from '#shared/middlewares/errorHandler.ts';
import loggerMiddleware from '#shared/middlewares/logger.ts';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(cors({}));

app.use('/api', router);
app.use(errorHandler);

export default app;
