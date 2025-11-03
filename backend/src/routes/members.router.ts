import { Router } from "express";
import {
  createMember,
  getMembers,
  getMember,
} from "../controllers/members.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/roleCheck";

const router = Router();

router.use(authenticate);

router.post("/", requireAdmin, createMember);
router.get("/", getMembers);
router.get("/:memberId", getMember);

export default router;
