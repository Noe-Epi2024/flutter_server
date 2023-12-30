import { ProjectModel } from "../../database/schema/projects";
import { UserModel } from "../../database/schema/users";
import { Token } from "../../types/token";
import { Request, Response } from 'express';
import { decodeAccessToken } from "../../functions/token/decode";
import { Member } from "../../types/members";

enum eMemberRole {
    admin = "admin",
    reader = "reader",
    writer = "writer"
}

async function getMembers(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;

        var projectId = req.params.id;

        if (!token || !projectId) {
            return res.status(400).send({ success: false, message: "No access token or projectId provided" });
        }

        const userId = decodeAccessToken(token) as Token;

        const projects = await ProjectModel.findOne({ _id: projectId })

        if (projects === null) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const MemberInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!MemberInProject) {
            return res.status(409).send({ success: false, message: "Member not found in project" });
        }

        const response: Member[] = await Promise.all(projects.members.map(async (member) => {
            try {
                const user = await UserModel.findById(member.userId);
                if (user) {
                    return {
                        userId: member.userId,
                        role: member.role,
                        name: user.name
                    };
                } else {
                    throw new Error(`Member not found for member with ID: ${member.userId}`);
                }
            } catch (error) {
                console.error('Error fetching Member details:', error);
                return {
                    userId: member.userId,
                    role: member.role,
                    name: 'Unknown'
                };
            }
        }));

        return res.status(200).send({ success: true, message: "members list found", data: { members: response } });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function postMember(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        const memberId = req.body.userId;
        const memberRole = req.body.role;

        if (!token || !projectId) {
            return res.status(400).send({ success: false, message: "No access token or projectId provided" });
        }

        if (!memberId) {
            return res.status(400).send({ success: false, message: "No userId provided" });
        }

        if (memberRole && !Object.values(eMemberRole).includes(memberRole as eMemberRole)) {
            return res.status(400).send({ success: false, message: "Role must be admin, reader or writer" });
        }

        const userId = decodeAccessToken(token) as Token;

        const projects = await ProjectModel.findOne({ _id: projectId })

        if (projects === null) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const MemberInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!MemberInProject) {
            return res.status(409).send({ success: false, message: "Member not found in project" });
        }

        if (MemberInProject.role !== "owner" && MemberInProject.role !== "admin") {
            return res.status(409).send({ success: false, message: "Member not owner in project" });
        }

        const userExists = await UserModel.findOne({ _id: memberId });

        if (!userExists) {
            return res.status(409).send({ success: false, message: "Member can not be added because it does not exist" });
        }

        const MemberAlreadyInProject = projects.members.find(member => String(member.userId) === memberId);

        if (MemberAlreadyInProject) {
            return res.status(409).send({ success: false, message: "Member already in project" });
        }

        const newMember = {
            userId: memberId,
            role: memberRole as "admin" | "reader" | "writer"
        };

        const newMembers = await ProjectModel.updateOne({ _id: projectId }, { $push: { members: newMember } });

        if (!newMembers || !newMembers.modifiedCount) {
            return res.status(400).send({ success: false, message: "Can't add member to project" });
        }

        return res.status(200).send({ success: true, message: "members added to the project" });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function patchMember(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        const memberId = req.body.userId;
        const memberRole = req.body.role;

        if (!token || !projectId) {
            return res.status(400).send({ success: false, message: "No access token or projectId provided" });
        }

        if (!memberId || !memberRole) {
            return res.status(200).send({ success: true, message: "No Content changed" });
        }

        const userId = decodeAccessToken(token) as Token;

        const projects = await ProjectModel.findOne({ _id: projectId })

        if (projects === null) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const projectOwner = projects.members.find(member => String(member.userId) === userId.userId);

        if (!projectOwner) {
            return res.status(409).send({ success: false, message: "Member not found in project" });
        }

        if (projectOwner.role !== "owner" && projectOwner.role !== "admin") {
            return res.status(409).send({ success: false, message: "Member not owner or admin in project" });
        }

        if (projectOwner.role === "owner" && projectOwner.userId === memberId) {
            return res.status(409).send({ success: false, message: "Owner can't changed his role in project" });
        }

        const userExists = await UserModel.findOne({ _id: memberId });

        if (!userExists) {
            return res.status(409).send({ success: false, message: "Member can't be edited because it does not exist" });
        }

        const newMemberAlreadyInProject = projects.members.find(member => String(member.userId) === memberId);

        if (!newMemberAlreadyInProject) {
            return res.status(409).send({ success: false, message: "Member not in project" });
        }

        if (!Object.values(eMemberRole).includes(memberRole as eMemberRole)) {
            return res.status(400).send({ success: false, message: "Role must be admin, reader or writer" });
        }

        const memberData = await ProjectModel.updateOne({ _id: projectId, "members.userId": memberId }, { $set: { "members.$.role": memberRole } });

        if (!memberData || !memberData.modifiedCount) {
            return res.status(200).send({ success: true, message: "No Content changed" });
        }

        return res.status(200).send({ success: true, message: "member role has been changed" });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function deleteMember(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        var memberId = req.body.userId;

        if (!token || !projectId) {
            return res.status(400).send({ success: false, message: "No access token or projectId provided" });
        }

        if (!memberId) {
            return res.status(400).send({ success: false, message: "No userId provided" });
        }

        const userId = decodeAccessToken(token) as Token;

        const projects = await ProjectModel.findOne({ _id: projectId })

        if (projects === null) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const MemberInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!MemberInProject) {
            return res.status(409).send({ success: false, message: "Member not found in project" });
        }

        if (MemberInProject.role !== "owner") {
            return res.status(409).send({ success: false, message: "Member not owner in project" });
        }

        const userExists = await UserModel.findOne({ _id: memberId });

        if (!userExists) {
            return res.status(409).send({ success: false, message: "Member can not be deleted because it does not exist" });
        }

        const memberAlreadyInProject = projects.members.find(member => String(member.userId) === memberId);

        if (!memberAlreadyInProject) {
            return res.status(409).send({ success: false, message: "Member not in project" });
        }
        // Update ownerId to null for tasks associated with the user leaving the project
        await ProjectModel.updateMany(
            { _id: projectId, "tasks.ownerId": memberId },
            { $set: { "tasks.$[elem].ownerId": null } },
            { arrayFilters: [{ "elem.ownerId": memberId }] }
        );

        // Remove the user from the members array
        const response = await ProjectModel.updateOne(
            { _id: projectId },
            { $pull: { members: { userId: memberId } } }
        );

        if (!response || !response.modifiedCount) {
            return res.status(400).send({ success: false, message: "Can't delete member" });
        }

        return res.status(200).send({ success: true, message: `Member removed` })
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

export { getMembers, postMember, patchMember, deleteMember }