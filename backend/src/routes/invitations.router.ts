import express from "express";
import authMiddleware from "../middleware/auth.middleware";
import { getInvitations, acceptInvitation, rejectInvitation } from "../controllers/invitations.controller";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getInvitations);
router.post("/:invitationId/accept", acceptInvitation);
router.post("/:invitationId/reject", rejectInvitation);

export default router;
