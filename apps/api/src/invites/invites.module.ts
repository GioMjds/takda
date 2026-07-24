import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { EmployeesModule } from '../employees/employees.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule, EmployeesModule],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
