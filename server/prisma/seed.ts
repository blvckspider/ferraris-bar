import dotenv from "dotenv";
import argon2 from "argon2";
import { PrismaClient, Role } from "../src/generated/prisma/index.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL! } }
});

async function main() {
  console.log("Creating dev user...");

  if(process.env.DEV_EMAIL && process.env.DEV_PASSWORD){
    const devEmail = process.env.DEV_EMAIL;
    const devPassword = process.env.DEV_PASSWORD;
    const devHash = await argon2.hash(devPassword);
    
    const devUser = await prisma.user.upsert({
      where: { email: devEmail },
      update: {},
      create: {
        email: devEmail,
        passwordHash: devHash,
        role: Role.DEV,
      },
    });
    console.log(`DEV user created: ${devUser.email} / password: ${devPassword}`);
  }
  else console.log("DEV user not created: missing DEV_EMAIL or DEV_PASSWORD env variables");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => { await prisma.$disconnect(); });