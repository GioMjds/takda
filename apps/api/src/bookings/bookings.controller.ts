import { Controller, Post, Param, Body, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BookingsService } from './bookings.service';
import { createBookingSchema, CreateBookingInput } from '@takda/shared';

@Controller({ path: 'businesses', version: '1' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':slug/bookings')
  @UsePipes(new ZodValidationPipe(createBookingSchema))
  async createBooking(
    @Param('slug') slug: string,
    @Body() dto: CreateBookingInput,
  ) {
    return this.bookingsService.createBooking(slug, dto);
  }
}
