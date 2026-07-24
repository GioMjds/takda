import { Controller, Get, Put, Param, Body, UsePipes } from '@nestjs/common';
import {
  upsertWorkingHoursInputSchema,
  UpsertWorkingHoursInput,
} from '@takda/shared';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { WorkingHoursService } from './working-hours.service';
import { UserRole } from '@prisma/client';

@Controller({ path: 'businesses/:businessId/working-hours', version: '1' })
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF, UserRole.MANAGER)
export class WorkingHoursController {
  constructor(private readonly service: WorkingHoursService) {}

  @Get()
  async listForBusiness(
    @Param('businessId') businessId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.listForBusiness(businessId, userId);
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @UsePipes(new ZodValidationPipe(upsertWorkingHoursInputSchema))
  async upsertMany(
    @Param('businessId') businessId: string,
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(upsertWorkingHoursInputSchema))
    dto: UpsertWorkingHoursInput,
  ) {
    return this.service.upsertMany(businessId, userId, dto);
  }
}
