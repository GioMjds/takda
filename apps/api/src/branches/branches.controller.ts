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
  createBranchInputSchema,
  updateBranchInputSchema,
  listBranchesQuerySchema,
  CreateBranchInput,
  UpdateBranchInput,
  ListBranchesQuery,
} from '@takda/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BranchesService } from './branches.service';

@Controller({ path: 'businesses/:businessId/branches', version: '1' })
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UsePipes(new ZodValidationPipe(createBranchInputSchema))
  async create(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Body() dto: CreateBranchInput,
  ) {
    return this.branchesService.create(businessId, userId, dto);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(listBranchesQuerySchema))
  async findAll(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Query() query: ListBranchesQuery,
  ) {
    return this.branchesService.listForBusiness(businessId, userId, query);
  }

  @Get(':branchId')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.branchesService.findOne(businessId, userId, branchId);
  }

  @Patch(':branchId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UsePipes(new ZodValidationPipe(updateBranchInputSchema))
  async update(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchInput,
  ) {
    return this.branchesService.update(businessId, userId, branchId, dto);
  }

  @Delete(':branchId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async delete(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.branchesService.softDelete(businessId, userId, branchId);
  }
}
