import {
  Controller,
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  createBusinessInputSchema,
  updateBusinessInputSchema,
  listBusinessQuerySchema,
  CreateBusinessInput,
  UpdateBusinessInput,
  ListBusinessesQuery,
  UpdateBusinessSettingsInput,
} from '@takda/shared';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BusinessesService } from './businesses.service';

@Controller({ path: 'businesses', version: '1' })
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UsePipes(new ZodValidationPipe(createBusinessInputSchema))
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(createBusinessInputSchema))
    dto: CreateBusinessInput,
  ) {
    return this.businessesService.create(user.tenantId, user.userId, dto);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(listBusinessQuerySchema))
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: ListBusinessesQuery,
  ) {
    return this.businessesService.findAll(userId, query);
  }

  @Get(':idOrSlug')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    return this.businessesService.findOne(idOrSlug, userId);
  }

  @Patch(':idOrSlug')
  @UsePipes(new ZodValidationPipe(updateBusinessInputSchema))
  async update(
    @CurrentUser('userId') userId: string,
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: UpdateBusinessInput,
  ) {
    return this.businessesService.update(idOrSlug, userId, dto);
  }

  @Delete(':idOrSlug')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    return this.businessesService.softDelete(idOrSlug, userId);
  }

  @Patch(':idOrSlug/settings')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @UsePipes(new ZodValidationPipe(updateBusinessInputSchema))
  async updateSettings(
    @CurrentUser('userId') userId: string,
    @Param('isOrSlug') idOrSlug: string,
    @Body() dto: UpdateBusinessSettingsInput,
  ) {
    return this.businessesService.updateSettings(idOrSlug, userId, dto);
  }
}
