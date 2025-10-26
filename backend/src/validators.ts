import z from "zod"

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  country: z.string(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const createMemberSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
})

export const createTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.enum(["todo", "in-progress", "review", "completed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string(), // ISO string expected
})

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "review", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
})
