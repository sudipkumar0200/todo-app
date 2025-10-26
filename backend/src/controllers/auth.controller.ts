import { Request, Response } from "express";
import { client, JWT_SECRET } from "../config";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../utils/hash";
import { signupSchema, loginSchema } from "../validators";

export async function signup(req: Request, res: Response) {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.format() });
    const { email, password, name, country } = parsed.data;

    const existing = await client.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    const hashed = hashPassword(password);
    const user = await client.user.create({
      data: { email, password: hashed, name, country },
      select: {
        id: true,
        email: true,
        name: true,
        country: true,
        createdAt: true,
      },
    });

    if (!JWT_SECRET)
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    const token = jwt.sign(
      { userId: user.id, role: "user" },
      JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.format() });
    const { email, password } = parsed.data;

    const user = await client.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!JWT_SECRET)
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    const token = jwt.sign(
      { userId: user.id, role: "user" },
      JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    const out = {
      id: user.id,
      email: user.email,
      name: user.name,
      country: user.country,
    };
    return res.json({ user: out, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
