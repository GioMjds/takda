import {
  Controller,
  Post,
  Param,
  Body,
  UsePipes,
  ConflictException,
  Get,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { QueueTokenService } from './queue-token.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  refreshQueueTokenInputSchema,
  RefreshQueueTokenInput,
  ERROR_CODES,
  isTerminalStatus,
} from '@takda/shared';
import { QueueService } from './queue.service';

@Controller({ path: 'bookings', version: '1' })
export class QueuePublicController {
  constructor(
    private readonly queueTokenService: QueueTokenService,
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/queue-token')
  @UsePipes(new ZodValidationPipe(refreshQueueTokenInputSchema))
  async refreshQueueToken(
    @Param('id') bookingId: string,
    @Body() dto: RefreshQueueTokenInput,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.customerPhone !== dto.phone) {
      throw new ConflictException({
        code: ERROR_CODES.BOOKING_NOT_FOUND,
        message: 'Booking not found or phone mismatch',
      });
    }

    if (isTerminalStatus(booking.status)) {
      throw new ConflictException({
        code: ERROR_CODES.BOOKING_TERMINAL,
        message: `Booking is in terminal state '${booking.status}'`,
      });
    }

    const { token, expiresAt } = this.queueTokenService.mintToken({
      bookingId: booking.id,
      businessId: booking.businessId,
    });

    return {
      booking: {
        ...booking,
        slotStart: booking.slotStart.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        resolvedAt: booking.resolvedAt?.toISOString() ?? null,
      },
      queueToken: token,
      queueTokenExpiresAt: expiresAt,
    };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':id/position')
  async getQueuePosition(@Param('id') bookingId: string) {
    return this.queueService.computePositionForBooking(bookingId);
  }
}
