import { describe, it, expect } from 'vitest';
import { createBranchInputSchema } from '../schemas';

describe('Branch Schemas', () => {
  it('validates valid create branch input', () => {
    const input = {
      name: 'Main Market Branch',
      address: '123 Palengke St',
      phone: '+639171234567',
    };
    const result = createBranchInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects empty branch name', () => {
    const input = { name: '' };
    const result = createBranchInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
