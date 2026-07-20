import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { ERROR_CODES } from '@takda/shared';
import { QueueTokenService } from '../queue-token.service';

describe('QueueTokenService', () => {
  let service: QueueTokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueTokenService,
        JwtService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('super-secret-key-123') },
        },
      ],
    }).compile();

    service = module.get<QueueTokenService>(QueueTokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('mints and verifies valid token', () => {
    const minted = service.mintToken({ bookingId: 'b_123', businessId: 'biz_456' });
    expect(minted.token).toBeDefined();
    expect(minted.expiresAt).toBeDefined();

    const payload = service.verifyToken(minted.token);
    expect(payload.sub).toBe('b_123');
    expect(payload.businessId).toBe('biz_456');
    expect(payload.role).toBe('customer');
  });

  it('throws UnauthorizedException with QUEUE_TOKEN_INVALID on invalid token', () => {
    expect(() => service.verifyToken('invalid.token.string')).toThrow(UnauthorizedException);
    try {
      service.verifyToken('invalid.token.string');
    } catch (err: any) {
      expect(err.getResponse()).toEqual({
        code: ERROR_CODES.QUEUE_TOKEN_INVALID,
        message: 'Invalid or expired queue token',
      });
    }
  });
});
