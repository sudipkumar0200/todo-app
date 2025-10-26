import express from "express"
import authRouter from "./auth.router"
import membersRouter from "./members.router"

const router = express.Router()

router.use("/auth", authRouter)
router.use("/members", membersRouter)

export default router