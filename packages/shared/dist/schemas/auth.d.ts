import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const signupSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodString;
    tenantSlug: z.ZodOptional<z.ZodString>;
    businessName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SignupInput = z.infer<typeof signupSchema>;
export declare const requestOtpSchema: z.ZodObject<{
    phone: z.ZodString;
}, z.core.$strip>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export declare const verifyOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    code: z.ZodString;
}, z.core.$strip>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
