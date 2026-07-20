import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ENV } from '../config/env';

@Module({
  imports: [
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: `${ENV.JWT_ACCESS_TTL_SECONDS}s` },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
