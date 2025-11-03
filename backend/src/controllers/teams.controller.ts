import { Request, Response } from "express";
import { client } from "../config";

export async function getTeams(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const teams = await client.team.findMany({ where: { ownerId: userId } });
    return res.json({ teams });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createTeam(req: Request, res: Response) {
  try {
    const userId = req.user?.userId as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const team = await client.team.create({ data: { name, description, ownerId: userId } });
    return res.status(201).json({ team });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTeamMembers(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    if (!teamId) return res.status(400).json({ error: "Team ID is required" });
    const userId = req.user?.userId as string;
    const team = await client.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

    const members = await client.member.findMany({ where: { teamId } });
    return res.json({ members });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function inviteToTeam(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    const { email, role } = req.body;
    const userId = req.user?.userId as string;
    if (!teamId || !email) return res.status(400).json({ error: "teamId and email are required" });

    const team = await client.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

    const invitation = await client.invitation.create({
      data: { teamId, email, role: role || "member", invitedBy: userId },
    });

    // TODO: send email invite

    return res.status(201).json({ invitation });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTeamTasks(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    if (!teamId) return res.status(400).json({ error: "Team ID is required" });
    const userId = req.user?.userId as string;
    const team = await client.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

    // Gather tasks for all members of the team
    const members = await client.member.findMany({ where: { teamId } });
    const memberIds = members.map((m) => m.id);
    const tasks = await client.task.findMany({ where: { memberId: { in: memberIds } } });
    return res.json({ tasks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function changeMemberRole(req: Request, res: Response) {
  try {
    const { teamId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.userId as string;
    if (!teamId || !memberId) return res.status(400).json({ error: "teamId and memberId required" });

    const team = await client.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

    const member = await client.member.findUnique({ where: { id: memberId } });
    if (!member) return res.status(404).json({ error: "Member not found" });
    if (member.teamId !== teamId) return res.status(400).json({ error: "Member is not part of this team" });

    const updated = await client.member.update({ where: { id: memberId }, data: { role } });
    return res.json({ member: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeMemberFromTeam(req: Request, res: Response) {
  try {
    const { teamId, memberId } = req.params;
    const userId = req.user?.userId as string;
    if (!teamId || !memberId) return res.status(400).json({ error: "teamId and memberId required" });

    const team = await client.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

    const member = await client.member.findUnique({ where: { id: memberId } });
    if (!member) return res.status(404).json({ error: "Member not found" });
    if (member.teamId !== teamId) return res.status(400).json({ error: "Member is not part of this team" });

    // Remove member from team: either delete or unset teamId. We'll delete the member record.
    await client.member.delete({ where: { id: memberId } });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
