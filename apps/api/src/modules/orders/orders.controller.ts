import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import type { OrderPage, OrderView } from '@brewlite/shared';
import { JwtAuthGuard, type AuthUser } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/roles.decorator';
import { CreateOrderDto, ListOrdersQuery } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

/** FR-04, FR-07, FR-08 – mọi endpoint cần JWT. */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto): Promise<OrderView> {
    return this.orders.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListOrdersQuery): Promise<OrderPage> {
    return this.orders.list(user.id, query.page ?? 1, query.limit ?? 10);
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string): Promise<OrderView> {
    return this.orders.get(user, id);
  }
}
