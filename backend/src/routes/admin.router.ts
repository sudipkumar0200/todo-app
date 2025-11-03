import express from "express";
import authMiddleware from "../middleware/auth.middleware";
import { setUserRole } from "../controllers/admin.controller";

const router = express.Router();

router.use(authMiddleware);

router.put("/users/:userId/role", setUserRole);

export default router;
