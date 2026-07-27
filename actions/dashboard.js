"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const setAvailability = async ({ startTime, endTime }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (!dbUser || dbUser.role !== "INTERVIEWER") throw new Error("Forbidden");


    if (!startTime || !endTime) throw new Error("Start and end time required");
    if (new Date(startTime) >= new Date(endTime))
        throw new Error("Start time must be before end time");

    

    try {

        const existing = await db.availability.findFirst({
            where: { interviewerId: dbUser.id, status: "AVAILABLE" },
        });

        if (existing) {
            await db.availability.update({
                where: { id: existing.id },
                data: { startTime: new Date(startTime), endTime: new Date(endTime) },
            });

        } else {
            await db.availability.create({
                data: {
                    interviewerId: dbUser.id,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    status: "AVAILABLE",
                },
            });
        }

        revalidatePath("/dashboard");
        return { success: true };


    } catch (error) {
        console.error(err);
        throw new Error("Failed to save availability");
    }


};

export const getAvailability = async () => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (!dbUser) throw new Error("User not found");

    return db.availability.findFirst({
        where: { interviewerId: dbUser.id, status: "AVAILABLE" },
    });
};


// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
export const getInterviewerAppointments = async () => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (!dbUser) throw new Error("User not found");

    return db.booking.findMany({
        where: { interviewerId: dbUser.id },
        include: {
            interviewee: { select: { name: true, imageUrl: true, email: true } },
            feedback: true,
        },
        orderBy: { startTime: "desc" },
    });


}


// ─── EARNINGS / WITHDRAWAL ────────────────────────────────────────────────────

export const getInterviewerStats = async () => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: {
      creditBalance: true,
      creditRate: true,
      bookingsAsInterviewer: {
        where: { status: "COMPLETED" },
        select: { creditsCharged: true },
      },
    },
  });
  if (!dbUser) throw new Error("User not found");

  const totalEarned = dbUser.bookingsAsInterviewer.reduce(
    (sum, b) => sum + b.creditsCharged,
    0
  );

  return {
    creditBalance: dbUser.creditBalance,
    creditRate: dbUser.creditRate,
    totalEarned,
    completedSessions: dbUser.bookingsAsInterviewer.length,
  };
};






