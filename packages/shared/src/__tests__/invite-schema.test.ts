import { describe, expect, it } from 'vitest';
import {
  createInviteInputSchema,
  acceptInviteInputSchema,
  ERROR_CODES,
} from '../index';

describe('Staff Invite Schemas & Constants', () => {
  it('validates valid createInviteInput', () => {
    const valid = { email: 'staff@example.com', role: 'STAFF' };
    const result = createInviteInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email in createInviteInput', () => {
    const invalid = { email: 'invalid-email', role: 'STAFF' };
    const result = createInviteInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates valid acceptInviteInput', () => {
    const valid = {
      token: 'raw-token-string',
      name: 'John Staff',
      password: 'password123',
    };
    const result = acceptInviteInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('exports invite error codes', () => {
    expect(ERROR_CODES.INVITE_INVALID).toBe('INVITE_INVALID');
    expect(ERROR_CODES.INVITE_EXPIRED).toBe('INVITE_EXPIRED');
    expect(ERROR_CODES.INVITE_REVOKED).toBe('INVITE_REVOKED');
    expect(ERROR_CODES.INVITE_ALREADY_ACCEPTED).toBe('INVITE_ALREADY_ACCEPTED');
  });
});
