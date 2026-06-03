import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Replicate the same adapter pattern as lib/prisma.ts
// Can't use @/ alias — seed runs outside Next.js
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ── CHANGE THIS ───────────────────────────────────────────────────────────────
const BOOKING_ID = "f0faf0e1-2dd1-4fcd-8eae-e34253efff55";
// ─────────────────────────────────────────────────────────────────────────────

const feedback = {
  summary:
    "Sonu has a strong understanding of React fundamentals, component architecture, and state management. He solves problems systematically and is progressing well toward a mid-level frontend developer role.",
  technical:
    "Strong React fundamentals with good knowledge of hooks, component lifecycle, and TypeScript. Demonstrated solid problem-solving skills and adapted well to guidance during technical discussions.",
  communication:
    "Communicates clearly and logically, explaining thought processes well. Occasionally focused on implementation too early but demonstrated strong overall reasoning.",
  problemSolving:
    "Demonstrated strong problem-solving skills and a structured approach to data structures. Identified key concepts effectively and showed good analytical thinking throughout.",
  recommendation:
    "Recommended for mid-level frontend roles. Strong React foundation with room to grow in system design, async JavaScript concepts, large-scale component architecture, and dynamic programming patterns.",
  strengths: [
    "Strong React & hooks knowledge",
    "Clear verbal communication",
    "Systematic debugging approach",
    "Good CSS & browser fundamentals",
  ],
  improvements: [
    "System design basic",
    "Async/event loop internals",
    "Dynamic programming patterns",
    "Ask clarifying questions upfront",
  ],
  overallRating: "AVERAGE", // POOR | AVERAGE | GOOD | EXCELLENT
  sessionRating: 4,
  sessionComment:
    "Great session. Sonu was engaged, receptive to feedback, and showed strong potential. Looking forward to seeing his progress with further system design preparation.",
};

async function main() {
  const booking = await db.booking.findUnique({
    where: { id: BOOKING_ID },
    select: { id: true, status: true },
  });

  if (!booking) {
    console.error(`❌  No booking found with ID: ${BOOKING_ID}`);
    process.exit(1);
  }

  const existing = await db.feedback.findUnique({
    where: { bookingId: BOOKING_ID },
  });

  if (existing) {
    console.error(`❌  Feedback already exists for booking: ${BOOKING_ID}`);
    process.exit(1);
  }

  await db.$transaction([
    db.feedback.create({
      data: { bookingId: BOOKING_ID, ...feedback },
    }),
    db.booking.update({
      where: { id: BOOKING_ID },
      data: { status: "COMPLETED" },
    }),
  ]);

  console.log(`✅  Feedback seeded for booking: ${BOOKING_ID}`);
  console.log(`✅  Booking status → COMPLETED`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());