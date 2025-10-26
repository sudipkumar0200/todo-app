import { Request, Response } from "express";
import { client } from "../config";
import { createTaskSchema, updateTaskSchema } from "../validators";

function mapStatus(input: string) {
  if (input === "in-progress") return "in_progress";
  return input;
}

export async function getTasks(req: Request, res: Response) {
  console.log("getTasks called");
  try {
    const { memberId } = req.params;
    if (!memberId) {
      // Assuming memberId is a required route parameter, this handles the 'undefined' case.
      return res.status(400).json({ error: "Member ID is required" });
    }
    const userId = req.user?.userId;
    const member = await client.member.findUnique({ where: { id: memberId } });
    if (!member || member.userId !== userId)
      return res.status(404).json({ error: "Member not found" });

    const tasks = await client.task.findMany({ where: { memberId } });
    return res.json({ tasks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createTask(req: Request, res: Response) {
  console.log("createTask called");
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.format() });
    const { memberId } = req.params;
    if (!memberId) {
      // Assuming memberId is a required route parameter, this handles the 'undefined' case.
      return res.status(400).json({ error: "Member ID is required" });
    }
    const userId = req.user?.userId;
    const member = await client.member.findUnique({ where: { id: memberId } });
    if (!member || member.userId !== userId)
      return res.status(404).json({ error: "Member not found" });

    const { title, description, status, priority, dueDate } = parsed.data;
    const prismaStatus = mapStatus(status) as any;
    const due = new Date(dueDate);
    if (isNaN(due.getTime()))
      return res.status(400).json({ error: "Invalid dueDate" });

    const task = await client.task.create({
      data: {
        title,
        description,
        status: prismaStatus,
        priority,
        dueDate: due,
        memberId,
      },
    });
    return res.status(201).json(task);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateTask(req: Request, res: Response) {
  console.log("updateTask called");
  try {
    const { memberId, taskId } = req.params;
    const { title, description, status, priority, dueDate } = req.body;

    if (!memberId || !taskId) {
      return res.status(400).json({ error: "Member ID is required" });
    }
    const member = await client.member.findFirst({
      where: {
        id: memberId,
        userId: req.user!.userId,
      },
    });

    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    const task = await client.task.findFirst({
      where: {
        id: taskId,
        memberId,
      },
    });

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed" && task.status !== "completed") {
        updateData.completedAt = new Date();
      } else if (status !== "completed") {
        updateData.completedAt = null;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const updatedTask = await client.task.update({
      where: { id: taskId },
      data: updateData,
    });

    res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Error updating task" });
  }
  // try {
  //   const parsed = updateTaskSchema.safeParse(req.body);
  //   if (!parsed.success)
  //     return res.status(400).json({ error: parsed.error.format() });
  //   const { memberId, taskId } = req.params;
  //   if (!memberId || !taskId) {
  //     // Assuming memberId is a required route parameter, this handles the 'undefined' case.
  //     return res.status(400).json({ error: "Member ID is required" });
  //   }
  //   const userId = req.user?.userId;
  //   const member = await client.member.findUnique({ where: { id: memberId } });
  //   if (!member || member.userId !== userId)
  //     return res.status(404).json({ error: "Member not found" });

  //   const task = await client.task.findUnique({ where: { id: taskId } });
  //   if (!task || task.memberId !== memberId)
  //     return res.status(404).json({ error: "Task not found" });

  //   const data: any = {};
  //   if (parsed.data.title) data.title = parsed.data.title;
  //   if (parsed.data.description) data.description = parsed.data.description;
  //   if (parsed.data.status) data.status = mapStatus(parsed.data.status) as any;
  //   if (parsed.data.priority) data.priority = parsed.data.priority;
  //   if (parsed.data.dueDate) {
  //     const due = new Date(parsed.data.dueDate);
  //     if (isNaN(due.getTime()))
  //       return res.status(400).json({ error: "Invalid dueDate" });
  //     data.dueDate = due;
  //   }

  //   const updated = await client.task.update({ where: { id: taskId }, data });
  //   return res.json(updated);
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json({ error: "Internal server error" });
  // }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const { memberId, taskId } = req.params;
    if (!memberId || !taskId) {
      // Assuming memberId is a required route parameter, this handles the 'undefined' case.
      return res.status(400).json({ error: "Member ID is required" });
    }
    const userId = req.user?.userId;
    const member = await client.member.findUnique({ where: { id: memberId } });
    if (!member || member.userId !== userId)
      return res.status(404).json({ error: "Member not found" });

    const task = await client.task.findUnique({ where: { id: taskId } });
    if (!task || task.memberId !== memberId)
      return res.status(404).json({ error: "Task not found" });

    await client.task.delete({ where: { id: taskId } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
