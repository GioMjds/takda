"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotSchema = void 0;
const zod_1 = require("zod");
exports.slotSchema = zod_1.z.object({
    slotStart: zod_1.z.string().datetime(), // UTC ISO String
    isAvailable: zod_1.z.boolean(),
    capacity: zod_1.z.number().int(),
    bookedCount: zod_1.z.number().int(),
});
//# sourceMappingURL=slot.js.map