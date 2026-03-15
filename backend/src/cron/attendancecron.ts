import cron from "node-cron";
import { PrismaClient, AttendanceStatus, TaskStatus } from "@prisma/client";
import { getTodayISTDate } from "../utils/attendance";


const prisma = new PrismaClient();

// Runs at 9:00 PM IST = 15:30 UTC
// cron format: minute hour * * *
export function startAttendanceCronJobs(): void {
    // Mark attendance at 9 PM IST daily (3:30 PM UTC)
    cron.schedule("30 15 * * *", processEODAttendance, {
        timezone: "UTC",
    });

    console.log("Attendance cron jobs scheduled");
}

export async function processEODAttendance(): Promise<void> {
    console.log("Processing EOD attendance...");

    const today = getTodayISTDate();

    try {
        const allMembers = await prisma.member.findMany({ select: { id: true } });

        for (const member of allMembers) {
            const todaysTasks = await prisma.task.findMany({
                where: {
                    memberId: member.id,
                    createdAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 86400000),
                    },
                },
            });

            const existingRecord = await prisma.dailyAttendance.findUnique({
                where: { memberId_date: { memberId: member.id, date: today } },
            });
            if (!existingRecord) {
                throw new Error("No Exisiting Record")
            }
            // No tasks submitted today → absent
            if (todaysTasks.length === 0) {
                await prisma.dailyAttendance.upsert({
                    where: { memberId_date: { memberId: member.id, date: today } },
                    update: { status: AttendanceStatus.absent },
                    create: { memberId: member.id, date: today, status: AttendanceStatus.absent },
                });
                continue;
            }

            // Tasks submitted but not all completed → partial
            const allCompleted = todaysTasks.every((t) => t.status === TaskStatus.completed);

            if (!allCompleted) {
                await prisma.dailyAttendance.upsert({
                    where: { memberId_date: { memberId: member.id, date: today } },
                    update: { status: AttendanceStatus.partial },
                    create: {
                        memberId: member.id,
                        date: today,
                        status: AttendanceStatus.partial,
                        taskSubmittedAt: existingRecord?.taskSubmittedAt ?? todaysTasks[0].createdAt,
                    },
                });
                continue;
            }

            // All tasks completed → present (only update if not already marked present)
            if (existingRecord?.status !== AttendanceStatus.present) {
                await prisma.dailyAttendance.upsert({
                    where: { memberId_date: { memberId: member.id, date: today } },
                    update: {
                        status: AttendanceStatus.present,
                        allTasksCompletedAt: new Date(),
                    },
                    create: {
                        memberId: member.id,
                        date: today,
                        status: AttendanceStatus.present,
                        taskSubmittedAt: existingRecord?.taskSubmittedAt ?? todaysTasks[0].createdAt,
                        allTasksCompletedAt: new Date(),
                    },
                });
            }
        }

        console.log("EOD attendance processing complete");
    } catch (error) {
        console.error("EOD attendance processing error:", error);
    }
}
