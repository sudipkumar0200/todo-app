import express from "express";
import authMiddleware from "../middleware/auth.middleware";
import { getTeams, createTeam, getTeamMembers, inviteToTeam, getTeamTasks, changeMemberRole, removeMemberFromTeam } from "../controllers/teams.controller";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getTeams);
router.post("/", createTeam);
router.get("/:teamId/members", getTeamMembers);
router.post("/:teamId/invite", inviteToTeam);
router.get("/:teamId/tasks", getTeamTasks);
router.put("/:teamId/members/:memberId/role", changeMemberRole);
router.delete("/:teamId/members/:memberId", removeMemberFromTeam);

export default router;
