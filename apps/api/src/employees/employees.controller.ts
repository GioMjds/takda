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
  createEmployeeInputSchema,
  updateEmployeeInputSchema,
  listEmployeesQuerySchema,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ListEmployeesQuery,
} from '@takda/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { EmployeesService } from './employees.service';

@Controller({ path: 'businesses/:businessId/employees', version: '1' })
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UsePipes(new ZodValidationPipe(createEmployeeInputSchema))
  async create(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Body() dto: CreateEmployeeInput,
  ) {
    return this.employeesService.add(businessId, userId, dto);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(listEmployeesQuerySchema))
  async findAll(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Query() query: ListEmployeesQuery,
  ) {
    return this.employeesService.listForBusiness(businessId, userId, query);
  }

  @Get(':employeeId')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.employeesService.findOne(businessId, userId, employeeId);
  }

  @Patch(':employeeId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UsePipes(new ZodValidationPipe(updateEmployeeInputSchema))
  async update(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateEmployeeInput,
  ) {
    return this.employeesService.updateRole(
      businessId,
      userId,
      employeeId,
      dto,
    );
  }

  @Delete(':employeeId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('businessId') businessId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.employeesService.remove(businessId, userId, employeeId);
  }
}
