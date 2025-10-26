import express from "express"
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/tasks.controller"

const router = express.Router({ mergeParams: true })

router.get("/", getTasks)
router.post("/", createTask)
router.put("/:taskId", updateTask)
router.delete("/:taskId", deleteTask)

export default router
