import {
  Controller,
  Body,
  Delete,
  Get,
  Param,
  Post,
  UsePipes,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  createInviteInputSchema,
  acceptInviteInputSchema,
  CreateInviteInput,
  AcceptInviteInput,
} from '@takda/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { InvitesService } from './invites.service';

@Controller({ version: '1' })
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('businesses/:businessId/invites')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UsePipes(new ZodValidationPipe(createInviteInputSchema))
  async create(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Body() dto: CreateInviteInput,
  ) {
    return this.invitesService.create(businessId, userId, dto);
  }

  @Get('businesses/:businessId/invites')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF)
  async findAll(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
  ) {
    return this.invitesService.listForBusiness(businessId, userId);
  }
  @Delete('businesses/:businessId/invites/:inviteId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async revoke(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.invitesService.revoke(businessId, userId, inviteId);
  }

  @Public()
  @Post('invites/:token/accept')
  @UsePipes(new ZodValidationPipe(acceptInviteInputSchema))
  async accept(@Param('token') token: string, @Body() dto: AcceptInviteInput) {
    return this.invitesService.accept(token, { ...dto, token });
  }
}
