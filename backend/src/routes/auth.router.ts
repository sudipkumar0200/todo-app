import { Router } from "express";
import { login, signup, changePassword } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/change-password", authenticate, changePassword);

export default router;