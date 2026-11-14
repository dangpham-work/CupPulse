import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { OrderStatus, OrderView } from '@brewlite/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { OrdersService } from './orders.service';

class StaffOrdersQuery {
  @IsOptional()
  @IsString()
  status?: string;
}

class UpdateStatusDto {
  @IsIn(['PREPARING', 'READY', 'COMPLETED'], { message: 'Trạng thái không hợp lệ' })
  status!: OrderStatus;
}

const STAFF_VISIBLE: OrderStatus[] = ['PAID', 'PREPARING', 'READY'];

/** FR-12 – nhân viên quầy (và quản lý). */
@Controller('staff/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF')
export class StaffOrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** AC-12.1: cũ nhất trước, không bao giờ trả PENDING_PAYMENT. */
  @Get()
  list(@Query() query: StaffOrdersQuery): Promise<OrderView[]> {
    const wanted = (query.status ?? STAFF_VISIBLE.join(','))
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is OrderStatus => STAFF_VISIBLE.includes(s as OrderStatus));
    return this.orders.listForStaff(wanted.length ? wanted : STAFF_VISIBLE);
  }

  @Patch(':id/status')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateStatusDto): Promise<OrderView> {
    return this.orders.advance(id, dto.status);
  }
}
