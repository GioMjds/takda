import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  cancelBookingInputSchema,
  queueHistoryQuerySchema,
  setPriorityInputSchema,
  skipBookingInputSchema,
  transferBookingInputSchema,
  walkInInputSchema,
  type CancelBookingInput,
  type QueueHistoryQuery,
  type SetPriorityInput,
  type SkipBookingInput,
  type TransferBookingInput,
  type WalkInInput,
} from '@takda/shared';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { QueueAdminService } from './queue-admin.service';

@Controller({ path: 'businesses/:businessId/queue', version: '1' })
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.STAFF)
export class QueueAdminController {
  constructor(private readonly queueAdmin: QueueAdminService) {}

  @Post('walk-ins')
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(walkInInputSchema))
  async registerWalkIn(
    @Param('businessId') businessId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: WalkInInput,
  ) {
    return this.queueAdmin.registerWalkIn(businessId, user.userId, dto);
  }

  @Post('next')
  @HttpCode(200)
  async callNext(
    @Param('businessId') businessId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const booking = await this.queueAdmin.callNext(businessId, user.userId);
    return { booking };
  }

  @Post(':bookingId/complete')
  @HttpCode(200)
  async complete(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.queueAdmin.complete(businessId, bookingId, user.userId);
  }

  @Post(':bookingId/recall')
  @HttpCode(200)
  async recall(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.queueAdmin.recall(businessId, bookingId, user.userId);
  }

  @Post(':bookingId/skip')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(skipBookingInputSchema))
  async skip(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SkipBookingInput,
  ) {
    return this.queueAdmin.skip(businessId, bookingId, user.userId, dto.reason);
  }

  /// #21 — Owner cancel-on-behalf of a customer.
  @Post(':bookingId/cancel')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(cancelBookingInputSchema))
  async cancel(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CancelBookingInput,
  ) {
    return this.queueAdmin.cancel(
      businessId,
      bookingId,
      user.userId,
      dto.reason,
    );
  }

  /// #18 — Set a customer's priority tier.
  @Post(':bookingId/priority')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(setPriorityInputSchema))
  async setPriority(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SetPriorityInput,
  ) {
    return this.queueAdmin.setPriority(
      businessId,
      bookingId,
      user.userId,
      dto.priorityTier,
    );
  }

  /// #22 — Transfer a booking to another service.
  @Post(':bookingId/transfer')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(transferBookingInputSchema))
  async transfer(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TransferBookingInput,
  ) {
    return this.queueAdmin.transfer(
      businessId,
      bookingId,
      user.userId,
      dto.targetServiceId,
      dto.slotStart,
    );
  }

  /// Today's live queue for the owner dashboard (SSR-friendly snapshot).
  @Get()
  async liveQueue(
    @Param('businessId') businessId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.queueAdmin.getLiveQueue(businessId, user.userId);
  }

  /// Active services for the walk-in modal (#16) and transfer picker (#22).
  @Get('services')
  async services(
    @Param('businessId') businessId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.queueAdmin.listServices(businessId, user.userId);
  }

  /// #25 — Paginated queue history with wait-time stats.
  @Get('history')
  async history(
    @Param('businessId') businessId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(queueHistoryQuerySchema))
    query: QueueHistoryQuery,
  ) {
    return this.queueAdmin.getHistory(businessId, user.userId, query);
  }
}
