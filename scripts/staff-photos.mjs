import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const images = [
  ["Haroon Qureshi", "/images/demo/staff-haroon.jpg"],
  ["Daniel Okoye", "/images/demo/staff-daniel.jpg"],
  ["Samir Patel", "/images/demo/staff-samir.jpg"],
  ["Layla Hassan", "/images/demo/staff-layla.jpg"],
];
for (const [fullName, profileImage] of images) {
  const updated = await prisma.staffMember.updateMany({ where: { fullName }, data: { profileImage } });
  console.log(`${fullName}: ${updated.count}`);
}
await prisma.$disconnect();
