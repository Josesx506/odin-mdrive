const prisma = require('../config/prismaClient');
const bcrypt = require("bcryptjs");
require('dotenv').config();

const guestEmail = "go@odin.com"
const guestPswd = process.env.GUEST_PSWD;

async function seedGuestUser() {
    if (!guestPswd) {
        throw new Error("Missing GUEST_PSWD in environment variables");
    }
    try {
        const userCount = await prisma.driveUser.count();
        if (userCount === 0) {
            const hashedPassword = await bcrypt.hash(guestPswd, 10);

            const user = await prisma.driveUser.upsert({
                where: { email: guestEmail },
                update: { password: hashedPassword },
                create: {
                    name: "goOdin",
                    email: guestEmail,
                    password: hashedPassword,
                    files: {
                        create: { name: 'root', type: 'FOLDER' }
                    }
                }
            });
            console.log("Guest user seeded successfully. 🌱");
        } else {
            console.log("DB already contains values, seeding skipped. 🌱");
        }
    } catch (err) {
        throw err;
    }
}

seedGuestUser();