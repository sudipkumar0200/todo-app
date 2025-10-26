import { Request, Response } from "express"
import { client } from "../config"
import { createMemberSchema } from "../validators"

export async function getMembers(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if(!userId) return res.status(401).json({ error: "Unauthorized" })
    const members = await client.member.findMany({ where: { userId } })
    return res.json({ members })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function createMember(req: Request, res: Response) {
  try {
    const parsed = createMemberSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() })
    const userId = req.user?.userId as string
    const { name, email, role } = parsed.data
    const member = await client.member.create({ data: { name, email, role, userId } })
    return res.status(201).json(member)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Internal server error" })
  }
}
