"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceSchema = void 0;
const zod_1 = require("zod");
exports.serviceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    businessId: zod_1.z.string(),
    slug: zod_1.z.string(),
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().nullable().optional(),
    durationMin: zod_1.z.number().int().positive(),
    capacityPerSlot: zod_1.z.number().int().positive().default(1),
    dailyCapacity: zod_1.z.number().int().positive().nullable().optional(),
    openTime: zod_1.z.string(),
    closeTime: zod_1.z.string(),
    daysOfWeekMask: zod_1.z.number().int().default(127),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=service.js.map