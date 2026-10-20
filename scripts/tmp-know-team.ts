import { prisma } from "../src/lib/db";

const clip = (value: string | null, n = 180) => (value ? value.replace(/\s+/g, " ").slice(0, n) : null);

async function main() {
const owners = await prisma.owner.findMany({
  orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  select: { name: true, title: true, isActive: true, image: true, headline: true, summary: true, bio: true, quote: true },
});
const staff = await prisma.staffMember.findMany({
  orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
  select: { fullName: true, title: true, category: true, isActive: true, profileImage: true, bio: true },
});

console.log(JSON.stringify({
  owners: owners.map((o) => ({ name: o.name, title: o.title, on: o.isActive, photo: Boolean(o.image), headline: clip(o.headline), summary: clip(o.summary), bio: clip(o.bio, 240), quote: clip(o.quote) })),
  staff: staff.map((s) => ({ name: s.fullName, title: s.title, category: s.category, on: s.isActive, photo: Boolean(s.profileImage), bio: clip(s.bio, 240) })),
}, null, 2));
await prisma.$disconnect();
}
main();
