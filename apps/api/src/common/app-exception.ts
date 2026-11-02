import { HttpException, HttpStatus } from '@nestjs/common';

/** Lỗi nghiệp vụ có mã ổn định để client xử lý (SRS 1.3), ví dụ PRODUCT_NOT_FOUND. */
export class AppException extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: HttpStatus,
    readonly details?: Record<string, unknown>,
  ) {
    super(message, status);
  }
}
