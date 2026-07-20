"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessSchema = exports.businessSlugSchema = void 0;
const zod_1 = require("zod");
exports.businessSlugSchema = zod_1.z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/u, 'Slug must contain only lowercase letters, numbers, and hyphens');
exports.businessSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tenantId: zod_1.z.string(),
    slug: exports.businessSlugSchema,
    name: zod_1.z.string().min(1, 'Name is required'),
    timezone: zod_1.z.string().default('Asia/Manila'),
    address: zod_1.z.string().nullable().optional(),
    phone: zod_1.z.string().nullable().optional(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=business.js.map