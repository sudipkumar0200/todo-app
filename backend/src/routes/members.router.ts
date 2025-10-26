import express from "express"
import authMiddleware from "../middleware/auth.middleware"
import { getMembers, createMember } from "../controllers/members.controller"
import tasksRouter from "./tasks.router"

const router = express.Router()

router.use(authMiddleware)

router.get("/", getMembers)
router.post("/", createMember)

// mount tasks router for nested routes
router.use( "/:memberId/tasks", tasksRouter )

export default router
