import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/http-exception.filter';

/** Cấu hình chung cho main.ts và test: tiền tố /api/v1, validate whitelist, định dạng lỗi. */
export function configureApp(app: INestApplication, corsOrigin?: string[]): void {
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.use(helmet());
  app.enableCors({ origin: corsOrigin ?? false });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
