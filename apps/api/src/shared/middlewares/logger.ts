import pinoHttp from 'pino-http';
import logger from '#config/logger.ts';

export default pinoHttp({
  logger,
  customProps: (req) => ({
    apiToken: (req as any).apiToken,
  }),
});
