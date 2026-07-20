"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.verifyOtpSchema = exports.requestOtpSchema = exports.signupSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .trim()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: zod_1.z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
});
exports.signupSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z
        .string()
        .trim()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: zod_1.z
        .string()
        .min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be valid E.164 format (e.g. +639171234567)'),
    tenantSlug: zod_1.z
        .string()
        .trim()
        .min(2, 'Tenant slug must be at least 2 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens')
        .optional(),
    businessName: zod_1.z
        .string()
        .trim()
        .min(2, 'Business name must be at least 2 characters')
        .optional(),
});
exports.requestOtpSchema = zod_1.z.object({
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be valid E.164 format (e.g. +639171234567)'),
});
exports.verifyOtpSchema = zod_1.z.object({
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be valid E.164 format (e.g. +639171234567)'),
    code: zod_1.z
        .string()
        .trim()
        .length(6, 'OTP code must be 6 digits')
        .regex(/^\d{6}$/, 'OTP code must consist of 6 numeric digits'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().trim().min(1, 'Refresh token is required').optional(),
});
//# sourceMappingURL=auth.js.map