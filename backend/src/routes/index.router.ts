import express from "express"
import authRouter from "./auth.router"
import membersRouter from "./members.router"
import teamsRouter from "./teams.router"
import invitationsRouter from "./invitations.router"
import adminRouter from "./admin.router"

const router = express.Router()

router.use("/auth", authRouter)
router.use("/members", membersRouter)
router.use("/teams", teamsRouter)
router.use("/invitations", invitationsRouter)
router.use("/admin", adminRouter)

export default router