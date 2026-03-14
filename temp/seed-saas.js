"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var client_1 = require("@prisma/client");
var adapter_pg_1 = require("@prisma/adapter-pg");
var pg_1 = require("pg");
// Use SaaS database URL for seeding SaaS schema
var pool = new pg_1.Pool({
    connectionString: process.env.SAAS_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
var adapter = new adapter_pg_1.PrismaPg(pool);
var saasPrisma = new client_1.PrismaClient({ adapter: adapter });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var saasSettings, _i, saasSettings_1, setting, demoSchool, announcements, _a, announcements_1, announcement, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🌱 Seeding SaaS schema...');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 16, , 17]);
                    // ─── PLANS ───────────────────────────────────────────────────────────────────
                    console.log('Creating pricing plans...');
                    return [4 /*yield*/, saasPrisma.plan.upsert({
                            where: { name: 'trial' },
                            update: {},
                            create: {
                                name: 'trial',
                                displayName: 'Free Trial',
                                description: 'Try all features free for 14 days',
                                priceMonthly: 0,
                                priceYearly: 0,
                                currency: 'INR',
                                maxStudents: 50,
                                maxTeachers: 5,
                                features: JSON.stringify(['Student Management', 'Attendance Tracking', 'Basic Reports', 'Email Support']),
                                trialDays: 14,
                                sortOrder: 1,
                                isActive: true,
                            },
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, saasPrisma.plan.upsert({
                            where: { name: 'basic' },
                            update: {},
                            create: {
                                name: 'basic',
                                displayName: 'Basic',
                                description: 'Perfect for small schools',
                                priceMonthly: 999,
                                priceYearly: 9999,
                                currency: 'INR',
                                maxStudents: 100,
                                maxTeachers: 10,
                                features: JSON.stringify(['Student Management', 'Attendance Tracking', 'Fee Management', 'Basic Reports', 'Email Support']),
                                trialDays: 0,
                                sortOrder: 2,
                                isActive: true,
                            },
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, saasPrisma.plan.upsert({
                            where: { name: 'professional' },
                            update: {},
                            create: {
                                name: 'professional',
                                displayName: 'Professional',
                                description: 'Ideal for growing schools',
                                priceMonthly: 1999,
                                priceYearly: 19999,
                                currency: 'INR',
                                maxStudents: 500,
                                maxTeachers: 25,
                                features: JSON.stringify(['Student Management', 'Attendance Tracking', 'Fee Management', 'Advanced Reports', 'Email Support', 'API Access']),
                                trialDays: 0,
                                sortOrder: 3,
                                isActive: true,
                            },
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, saasPrisma.plan.upsert({
                            where: { name: 'enterprise' },
                            update: {},
                            create: {
                                name: 'enterprise',
                                displayName: 'Enterprise',
                                description: 'Complete solution for large institutions',
                                priceMonthly: 4999,
                                priceYearly: 49999,
                                currency: 'INR',
                                maxStudents: 2000,
                                maxTeachers: 100,
                                features: JSON.stringify(['All Features', 'Priority Support', 'Custom Integrations', 'Dedicated Account Manager', 'White-label Options']),
                                trialDays: 0,
                                sortOrder: 4,
                                isActive: true,
                            },
                        })];
                case 5:
                    _b.sent();
                    console.log('✅ Pricing plans created');
                    // ─── SaaS SETTINGS ───────────────────────────────────────────────────────────
                    console.log('Creating SaaS settings...');
                    saasSettings = [
                        // Payment Settings
                        { group: 'saas_payment', key: 'razorpay_key_id', value: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key' },
                        { group: 'saas_payment', key: 'razorpay_key_secret', value: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_demo_secret' },
                        { group: 'saas_payment', key: 'bank_name', value: 'Demo Bank' },
                        { group: 'saas_payment', key: 'bank_account_number', value: '1234567890' },
                        { group: 'saas_payment', key: 'bank_ifsc', value: 'DEMO0001234' },
                        { group: 'saas_payment', key: 'business_name', value: 'School ERP Demo' },
                        { group: 'saas_payment', key: 'business_email', value: 'billing@schoolerp.demo' },
                        { group: 'saas_payment', key: 'business_phone', value: '+919876543210' },
                        { group: 'saas_payment', key: 'business_address', value: '123 Demo Street, Demo City, 123456' },
                        // Platform Settings
                        { group: 'saas_platform', key: 'default_trial_days', value: '14' },
                        { group: 'saas_platform', key: 'max_schools_per_admin', value: '10' },
                        { group: 'saas_platform', key: 'enable_auto_trial_extension', value: 'true' },
                        { group: 'saas_platform', key: 'trial_extension_days', value: '7' },
                        // Email Settings
                        { group: 'saas_email', key: 'from_email', value: 'noreply@schoolerp.demo' },
                        { group: 'saas_email', key: 'from_name', value: 'School ERP Platform' },
                        { group: 'saas_email', key: 'support_email', value: 'support@schoolerp.demo' },
                    ];
                    _i = 0, saasSettings_1 = saasSettings;
                    _b.label = 6;
                case 6:
                    if (!(_i < saasSettings_1.length)) return [3 /*break*/, 9];
                    setting = saasSettings_1[_i];
                    return [4 /*yield*/, saasPrisma.saasSetting.upsert({
                            where: { group_key: { group: setting.group, key: setting.key } },
                            update: { value: setting.value },
                            create: setting,
                        })];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9:
                    console.log('✅ SaaS settings created');
                    // ─── SAMPLE SCHOOLS (for testing) ─────────────────────────────────────────────────
                    console.log('Creating sample schools...');
                    return [4 /*yield*/, saasPrisma.school.upsert({
                            where: { slug: 'demo-school' },
                            update: {},
                            create: {
                                name: 'Demo School',
                                slug: 'demo-school',
                                domain: 'demo.schoolerp.demo',
                                email: 'admin@demo.schoolerp.demo',
                                phone: '+919876543210',
                                address: '123 Demo Street, Demo City, 123456',
                                isActive: true,
                            },
                        })];
                case 10:
                    demoSchool = _b.sent();
                    // Create trial subscription for demo school
                    return [4 /*yield*/, saasPrisma.subscription.upsert({
                            where: { schoolId: demoSchool.id },
                            update: {},
                            create: {
                                schoolId: demoSchool.id,
                                plan: 'trial',
                                status: 'trial',
                                maxStudents: 50,
                                maxTeachers: 5,
                                features: JSON.stringify(['Student Management', 'Attendance Tracking', 'Basic Reports', 'Email Support']),
                                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                                currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                            },
                        })];
                case 11:
                    // Create trial subscription for demo school
                    _b.sent();
                    console.log('✅ Sample schools created');
                    // ─── SAMPLE ANNOUNCEMENTS ─────────────────────────────────────────────────────
                    console.log('Creating sample announcements...');
                    announcements = [
                        {
                            title: 'Welcome to School ERP Platform',
                            message: 'We are excited to have you on board! Explore all the features available during your trial period.',
                            type: 'info',
                            targetPlans: JSON.stringify(['trial', 'basic', 'professional', 'enterprise']),
                            isActive: true,
                            createdBy: 'system',
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                        },
                        {
                            title: 'New Features Released',
                            message: 'Check out our latest features including enhanced reporting and improved attendance tracking.',
                            type: 'feature',
                            targetPlans: JSON.stringify(['professional', 'enterprise']),
                            isActive: true,
                            createdBy: 'system',
                            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                        },
                        {
                            title: 'Scheduled Maintenance',
                            message: 'Platform will undergo maintenance on Sunday 2AM - 4AM IST. Services may be temporarily unavailable.',
                            type: 'maintenance',
                            targetPlans: JSON.stringify(['trial', 'basic', 'professional', 'enterprise']),
                            isActive: true,
                            createdBy: 'system',
                            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                        },
                    ];
                    _a = 0, announcements_1 = announcements;
                    _b.label = 12;
                case 12:
                    if (!(_a < announcements_1.length)) return [3 /*break*/, 15];
                    announcement = announcements_1[_a];
                    return [4 /*yield*/, saasPrisma.saasAnnouncement.upsert({
                            where: { title: announcement.title },
                            update: announcement,
                            create: announcement,
                        })];
                case 13:
                    _b.sent();
                    _b.label = 14;
                case 14:
                    _a++;
                    return [3 /*break*/, 12];
                case 15:
                    console.log('✅ Sample announcements created');
                    console.log('\n🎉 SaaS schema seeding completed successfully!');
                    console.log('\n📊 Seeding Summary:');
                    console.log('   - 4 Pricing plans (trial, basic, professional, enterprise)');
                    console.log('   - 17 SaaS settings (payment, platform, email)');
                    console.log('   - 1 Sample school with trial subscription');
                    console.log('   - 3 Sample announcements');
                    return [3 /*break*/, 17];
                case 16:
                    error_1 = _b.sent();
                    console.error('❌ Error seeding SaaS schema:', error_1);
                    throw error_1;
                case 17: return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, saasPrisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
