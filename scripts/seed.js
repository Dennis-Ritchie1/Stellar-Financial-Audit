"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcryptjs_1.default.hash('ChangeMe123!', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@stellar-audit.local' },
        update: { passwordHash },
        create: {
            email: 'admin@stellar-audit.local',
            passwordHash,
            role: 'ADMIN',
        },
    });
    console.log('Seeded admin user:', admin.email);
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map