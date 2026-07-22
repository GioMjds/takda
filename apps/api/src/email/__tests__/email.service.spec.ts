import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';

describe('EmailService', () => {
  let service: EmailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test-id' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EMAIL_FROM') return 'noreply@takda.app';
              if (key === 'EMAIL_HOST') return 'localhost';
              if (key === 'EMAIL_PORT') return 1025;
              if (key === 'EMAIL_SECURE') return 'false';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    // Replace internal transporter sendMail
    (service as any).transporter = { sendMail: sendMailMock };
  });

  it('sends staff invite email with accept URL', async () => {
    await service.sendStaffInvite(
      'staff@example.com',
      'Pasig Barbershop',
      'https://takda.app/invites/accept?token=abc',
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@takda.app',
        to: 'staff@example.com',
        subject: 'Invitation to join Pasig Barbershop on Takda',
        html: expect.stringContaining(
          'https://takda.app/invites/accept?token=abc',
        ),
      }),
    );
  });
});
