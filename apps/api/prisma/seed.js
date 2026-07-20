"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const DEFAULT_PASSWORD = 'Password123!';
async function main() {
    console.log('🌱 Starting Prisma seeding process...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);
    console.log('📌 Seeding Tenant...');
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'takda-dev' },
        update: {
            name: 'Takda Development Tenant',
        },
        create: {
            slug: 'takda-dev',
            name: 'Takda Development Tenant',
        },
    });
    console.log(`  └─ Tenant ID: ${tenant.id} (${tenant.slug})`);
    console.log('📌 Seeding Users...');
    const ownerUser = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'owner@takda.app',
            },
        },
        update: {
            passwordHash,
            name: 'Juan Dela Cruz',
            role: client_1.UserRole.OWNER,
        },
        create: {
            tenantId: tenant.id,
            email: 'owner@takda.app',
            passwordHash,
            name: 'Juan Dela Cruz',
            role: client_1.UserRole.OWNER,
        },
    });
    const staffUser = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'staff@takda.app',
            },
        },
        update: {
            passwordHash,
            name: 'Maria Santos',
            role: client_1.UserRole.STAFF,
        },
        create: {
            tenantId: tenant.id,
            email: 'staff@takda.app',
            passwordHash,
            name: 'Maria Santos',
            role: client_1.UserRole.STAFF,
        },
    });
    const adminUser = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'admin@takda.app',
            },
        },
        update: {
            passwordHash,
            name: 'System Admin',
            role: client_1.UserRole.ADMIN,
        },
        create: {
            tenantId: tenant.id,
            email: 'admin@takda.app',
            passwordHash,
            name: 'System Admin',
            role: client_1.UserRole.ADMIN,
        },
    });
    console.log(`  ├─ Owner User: ${ownerUser.email}`);
    console.log(`  ├─ Staff User: ${staffUser.email}`);
    console.log(`  └─ Admin User: ${adminUser.email}`);
    console.log('📌 Seeding Businesses...');
    const barbershop = await prisma.business.upsert({
        where: {
            tenantId_slug: {
                tenantId: tenant.id,
                slug: 'mang-juan-barbershop',
            },
        },
        update: {
            name: 'Mang Juan Barbershop',
            address: 'Stall 12, Market Square, Quezon City',
            phone: '+639171234567',
            timezone: 'Asia/Manila',
            isActive: true,
        },
        create: {
            tenantId: tenant.id,
            slug: 'mang-juan-barbershop',
            name: 'Mang Juan Barbershop',
            address: 'Stall 12, Market Square, Quezon City',
            phone: '+639171234567',
            timezone: 'Asia/Manila',
            isActive: true,
        },
    });
    const opticalClinic = await prisma.business.upsert({
        where: {
            tenantId_slug: {
                tenantId: tenant.id,
                slug: 'st-jude-optical',
            },
        },
        update: {
            name: 'St. Jude Optical Clinic',
            address: 'Unit 4, Health Bldg, Pasig City',
            phone: '+639189876543',
            timezone: 'Asia/Manila',
            isActive: true,
        },
        create: {
            tenantId: tenant.id,
            slug: 'st-jude-optical',
            name: 'St. Jude Optical Clinic',
            address: 'Unit 4, Health Bldg, Pasig City',
            phone: '+639189876543',
            timezone: 'Asia/Manila',
            isActive: true,
        },
    });
    console.log(`  ├─ Business 1: ${barbershop.name} (${barbershop.slug})`);
    console.log(`  └─ Business 2: ${opticalClinic.name} (${opticalClinic.slug})`);
    console.log('📌 Seeding Memberships...');
    await prisma.membership.upsert({
        where: {
            userId_businessId: {
                userId: ownerUser.id,
                businessId: barbershop.id,
            },
        },
        update: { role: client_1.MembershipRole.OWNER },
        create: {
            userId: ownerUser.id,
            businessId: barbershop.id,
            role: client_1.MembershipRole.OWNER,
        },
    });
    await prisma.membership.upsert({
        where: {
            userId_businessId: {
                userId: ownerUser.id,
                businessId: opticalClinic.id,
            },
        },
        update: { role: client_1.MembershipRole.OWNER },
        create: {
            userId: ownerUser.id,
            businessId: opticalClinic.id,
            role: client_1.MembershipRole.OWNER,
        },
    });
    await prisma.membership.upsert({
        where: {
            userId_businessId: {
                userId: staffUser.id,
                businessId: barbershop.id,
            },
        },
        update: { role: client_1.MembershipRole.STAFF },
        create: {
            userId: staffUser.id,
            businessId: barbershop.id,
            role: client_1.MembershipRole.STAFF,
        },
    });
    console.log('📌 Seeding Services...');
    const haircutService = await prisma.service.upsert({
        where: {
            businessId_slug: {
                businessId: barbershop.id,
                slug: 'standard-haircut',
            },
        },
        update: {
            name: 'Standard Haircut',
            description: 'Quick precision haircut and styling',
            durationMin: 15,
            capacityPerSlot: 1,
            openTime: '08:00',
            closeTime: '17:00',
            daysOfWeekMask: 127,
            isActive: true,
        },
        create: {
            businessId: barbershop.id,
            slug: 'standard-haircut',
            name: 'Standard Haircut',
            description: 'Quick precision haircut and styling',
            durationMin: 15,
            capacityPerSlot: 1,
            openTime: '08:00',
            closeTime: '17:00',
            daysOfWeekMask: 127,
            isActive: true,
        },
    });
    const beardTrimService = await prisma.service.upsert({
        where: {
            businessId_slug: {
                businessId: barbershop.id,
                slug: 'beard-trim',
            },
        },
        update: {
            name: 'Beard Trim & Shave',
            description: 'Classic razor shave and beard grooming',
            durationMin: 10,
            capacityPerSlot: 1,
            openTime: '08:00',
            closeTime: '17:00',
            daysOfWeekMask: 127,
            isActive: true,
        },
        create: {
            businessId: barbershop.id,
            slug: 'beard-trim',
            name: 'Beard Trim & Shave',
            description: 'Classic razor shave and beard grooming',
            durationMin: 10,
            capacityPerSlot: 1,
            openTime: '08:00',
            closeTime: '17:00',
            daysOfWeekMask: 127,
            isActive: true,
        },
    });
    const eyeExamService = await prisma.service.upsert({
        where: {
            businessId_slug: {
                businessId: opticalClinic.id,
                slug: 'eye-exam',
            },
        },
        update: {
            name: 'Comprehensive Eye Examination',
            description: 'Full vision test and lens prescription',
            durationMin: 30,
            capacityPerSlot: 2,
            openTime: '09:00',
            closeTime: '16:00',
            daysOfWeekMask: 127,
            isActive: true,
        },
        create: {
            businessId: opticalClinic.id,
            slug: 'eye-exam',
            name: 'Comprehensive Eye Examination',
            description: 'Full vision test and lens prescription',
            durationMin: 30,
            capacityPerSlot: 2,
            openTime: '09:00',
            closeTime: '16:00',
            daysOfWeekMask: 127,
            isActive: true,
        },
    });
    console.log(`  ├─ Service 1: ${haircutService.name}`);
    console.log(`  ├─ Service 2: ${beardTrimService.name}`);
    console.log(`  └─ Service 3: ${eyeExamService.name}`);
    console.log('📌 Seeding Sample Bookings...');
    const now = new Date();
    const slot1 = new Date(now);
    slot1.setHours(9, 0, 0, 0);
    const slot2 = new Date(now);
    slot2.setHours(9, 15, 0, 0);
    const slot3 = new Date(now);
    slot3.setHours(10, 0, 0, 0);
    await prisma.booking.upsert({
        where: {
            service_slot_phone_unique: {
                serviceId: haircutService.id,
                slotStart: slot1,
                customerPhone: '+639171112222',
            },
        },
        update: {
            status: client_1.BookingStatus.CONFIRMED,
        },
        create: {
            tenantId: tenant.id,
            businessId: barbershop.id,
            serviceId: haircutService.id,
            slotStart: slot1,
            customerName: 'Pedro Penduko',
            customerPhone: '+639171112222',
            notes: 'First time customer',
            source: client_1.BookingSource.ONLINE,
            status: client_1.BookingStatus.CONFIRMED,
        },
    });
    await prisma.booking.upsert({
        where: {
            service_slot_phone_unique: {
                serviceId: haircutService.id,
                slotStart: slot2,
                customerPhone: '+639173334444',
            },
        },
        update: {
            status: client_1.BookingStatus.PENDING,
        },
        create: {
            tenantId: tenant.id,
            businessId: barbershop.id,
            serviceId: haircutService.id,
            slotStart: slot2,
            customerName: 'Ana Reyes',
            customerPhone: '+639173334444',
            notes: 'Requested senior stylist',
            source: client_1.BookingSource.ONLINE,
            status: client_1.BookingStatus.PENDING,
        },
    });
    await prisma.booking.upsert({
        where: {
            service_slot_phone_unique: {
                serviceId: haircutService.id,
                slotStart: slot3,
                customerPhone: '+639175556666',
            },
        },
        update: {
            status: client_1.BookingStatus.CHECKED_IN,
            resolvedAt: now,
        },
        create: {
            tenantId: tenant.id,
            businessId: barbershop.id,
            serviceId: haircutService.id,
            slotStart: slot3,
            customerName: 'Carlos Garcia',
            customerPhone: '+639175556666',
            source: client_1.BookingSource.WALK_IN,
            status: client_1.BookingStatus.CHECKED_IN,
            resolvedAt: now,
        },
    });
    console.log('  └─ Created sample bookings for Mang Juan Barbershop');
    console.log('\n✅ Seeding complete!');
    console.log('----------------------------------------------------');
    console.log('🔑 TEST USER CREDENTIALS FOR LOGIN CHECKS:');
    console.log('----------------------------------------------------');
    console.log(`Tenant Slug : takda-dev`);
    console.log(`Default Password: ${DEFAULT_PASSWORD}\n`);
    console.log(`1. OWNER Account:`);
    console.log(`   Email: owner@takda.app`);
    console.log(`   Role: OWNER`);
    console.log(`   Name: Juan Dela Cruz\n`);
    console.log(`2. STAFF Account:`);
    console.log(`   Email: staff@takda.app`);
    console.log(`   Role: STAFF`);
    console.log(`   Name: Maria Santos\n`);
    console.log(`3. ADMIN Account:`);
    console.log(`   Email: admin@takda.app`);
    console.log(`   Role: ADMIN`);
    console.log(`   Name: System Admin`);
    console.log('----------------------------------------------------\n');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map