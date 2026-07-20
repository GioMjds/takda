import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be valid E.164 format (e.g. +639171234567)'),
  tenantSlug: z
    .string()
    .trim()
    .min(2, 'Tenant slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens')
    .optional(),
  businessName: z
    .string()
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be valid E.164 format (e.g. +639171234567)'),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be valid E.164 format (e.g. +639171234567)'),
  code: z
    .string()
    .trim()
    .length(6, 'OTP code must be 6 digits')
    .regex(/^\d{6}$/, 'OTP code must consist of 6 numeric digits'),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh token is required').optional(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
