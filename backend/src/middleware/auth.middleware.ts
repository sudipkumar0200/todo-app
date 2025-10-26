import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET, UserPayload } from "../config"

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload
    }
  }
}

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" })
    }
  const token = auth.split(" ")[1]
  if (!token) return res.status(401).json({ error: "Missing token" })
  if (!JWT_SECRET) return res.status(500).json({ error: "JWT_SECRET not configured" })
  const secret = JWT_SECRET as string
  const payload = jwt.verify(token, secret) as unknown as UserPayload
    // attach to request
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}
