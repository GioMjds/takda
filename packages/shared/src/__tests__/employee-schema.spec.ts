import { describe, expect, it } from 'vitest';
import {
  createEmployeeInputSchema,
  updateEmployeeInputSchema,
  listEmployeesQuerySchema,
  ERROR_CODES,
} from '../index';

describe('Employee Schemas & Constants', () => {
  it('defines required error codes for employee management', () => {
    expect(ERROR_CODES.EMPLOYEE_NOT_FOUND).toBe('EMPLOYEE_NOT_FOUND');
    expect(ERROR_CODES.EMPLOYEE_ALREADY_EXISTS).toBe('EMPLOYEE_ALREADY_EXISTS');
    expect(ERROR_CODES.EMPLOYEE_LAST_OWNER).toBe('EMPLOYEE_LAST_OWNER');
  });

  it('validates create employee with existing userId', () => {
    const result = createEmployeeInputSchema.safeParse({
      userId: 'usr_123456',
      role: 'STAFF',
    });
    expect(result.success).toBe(true);
  });

  it('validates create employee with inline user details', () => {
    const result = createEmployeeInputSchema.safeParse({
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '+639171234567',
      role: 'MANAGER',
    });
    expect(result.success).toBe(true);
  });

  it('rejects create employee if neither userId nor inline email+name is provided', () => {
    const result = createEmployeeInputSchema.safeParse({
      role: 'STAFF',
    });
    expect(result.success).toBe(false);
  });

  it('validates update employee input', () => {
    const result = updateEmployeeInputSchema.safeParse({
      role: 'MANAGER',
    });
    expect(result.success).toBe(true);
  });

  it('validates list employees query with optional role filter', () => {
    const result = listEmployeesQuerySchema.safeParse({
      limit: 10,
      offset: 0,
      role: 'STAFF',
    });
    expect(result.success).toBe(true);
  });
});
