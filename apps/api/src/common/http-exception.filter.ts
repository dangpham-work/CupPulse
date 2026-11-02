import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ApiError } from '@brewlite/shared';
import type { Response } from 'express';
import { AppException } from './app-exception';

/** Chuẩn hóa mọi lỗi về dạng { statusCode, code, message, details? } (SRS 1.3, NFR-05). */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toApiError(exception);
    res.status(body.statusCode).json(body);
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const messages = typeof response === 'object' && response !== null ? (response as { message?: unknown }).message : undefined;
      if (status === HttpStatus.BAD_REQUEST) {
        return {
          statusCode: status,
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu không hợp lệ',
          details: { errors: Array.isArray(messages) ? messages : [exception.message] },
        };
      }
      return { statusCode: status, code: HttpStatus[status] ?? 'HTTP_ERROR', message: exception.message };
    }
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống' };
  }
}
