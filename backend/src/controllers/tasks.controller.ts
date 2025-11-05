import { Request, Response } from "express";
import { PrismaClient, UserRole, TaskStatus } from "@prisma/client";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../validation/taskValidation";

const prisma = new PrismaClient();

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const validatedData = createTaskSchema.parse(req.body);

    let member;
    // Verify member exists
    if (req.user.role === UserRole.member) {
      member = await prisma.member.findUnique({
        where: { userId: req.user.userId },
      });
    } else {
      if (!validatedData.userId) {
        res
          .status(400)
          .json({ message: "User ID is required for admin created tasks" });
        return;
      }
      member = await prisma.member.findUnique({
        where: { userId: validatedData.userId },
      });
    }

    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    // Check permissions: admin can create tasks for anyone, members can only create for themselves
    // if (req.user.role !== UserRole.admin ) {
    //   res
    //     .status(403)
    //     .json({ message: "You can only create tasks for yourself" });
    //   return;
    // }

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        dueDate: new Date(validatedData.dueDate),
        memberId: member.id,
      },
    });

    res.status(201).json(task);
  } catch (error: any) {
    console.error("Create task error:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMemberTasks(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: "Member ID is required" });
      return;
    }

    // console.log("Getting tasks for user:", req.user);
    const member = await prisma.member.findFirst({
      where: { userId: userId },
    });

    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    // Check permissions
    // if (
    //   req.user.role !== UserRole.admin
    // ) {
    //   res.status(403).json({ message: "Access denied" });
    //   return;
    // }

    const tasks = await prisma.task.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ tasks });
  } catch (error) {
    console.error("Get member tasks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { taskId } = req.params;
    if (!taskId) {
      res.status(400).json({ message: "Task ID is required" });
      return;
    }
    const validatedData = updateTaskSchema.parse(req.body);

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { member: true },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Check permissions
    if (
      req.user.role !== UserRole.admin &&
      existingTask.member.email !== req.user.email
    ) {
      res.status(403).json({ message: "You can only update your own tasks" });
      return;
    }

    const updateData: any = {
      ...validatedData,
    };

    // If status is being changed to completed, set completedAt
    if (
      validatedData.status === TaskStatus.completed &&
      existingTask.status !== TaskStatus.completed
    ) {
      updateData.completedAt = new Date();
    }

    // If dueDate is provided, convert to Date
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    res.json(task);
  } catch (error: any) {
    console.error("Update task error:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { taskId } = req.params;
    if (!taskId) {
      res.status(400).json({ message: "Task ID is required" });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { member: true },
    });

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Check permissions
    if (req.user.role !== UserRole.admin) {
      res.status(403).json({ message: "You can only delete your own tasks" });
      return;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
