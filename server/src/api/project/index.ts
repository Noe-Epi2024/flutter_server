import { ProjectModel } from "../../database/schema/projects";
import { UserModel } from "../../database/schema/users";
import { Token } from "../../types/token";
import { Request, Response } from 'express';
import { decodeAccessToken } from "../../functions/token/decode";
import { Projects, ProjectById } from "../../types/projects";

function calculateProgress(tasks: any[]) {
    let tasksWithSubtasks = tasks.filter(task => task.subtasks.length > 0);
    let totalSubtasks = 0;
    let completedSubtasks = 0;

    tasksWithSubtasks.forEach(task => {
        task.subtasks.forEach((subtask: { isDone: boolean }) => {
            totalSubtasks++;
            if (subtask.isDone) {
                completedSubtasks++;
            }
        });
    });

    const progress = totalSubtasks > 0 ? Math.ceil((completedSubtasks / totalSubtasks) * 100) : null;
    return progress;
}

async function getProject(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;

        var id = req.params.id;

        if (!token || !id) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        const projects = await ProjectModel.findOne({ _id: id })

        if (projects === null) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const userInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!userInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        const response: ProjectById = {
            id: projects._id,
            name: projects.name,
            role: userInProject.role,
            tasks: await Promise.all(projects.tasks.map(async task => {
                const progress = calculateProgress([task]);
                try {
                    const user = await UserModel.findById(task.ownerId);
                    if (user) {
                        return {
                            id: task.id,
                            ownerName: user.name,
                            name: task.name,
                            startDate: task.startDate,
                            endDate: task.endDate,
                            progress: progress,
                            numberOfSubtasks: task.subtasks.length,
                            numberOfCompletedSubtasks: task.subtasks.filter(subtask => subtask.isDone).length,
                        };
                    } else {
                        return {
                            id: task.id,
                            name: task.name,
                            startDate: task.startDate,
                            endDate: task.endDate,
                            progress: progress,
                            numberOfSubtasks: task.subtasks.length,
                            numberOfCompletedSubtasks: task.subtasks.filter(subtask => subtask.isDone).length,
                        };
                    }
                } catch (error) {
                    console.error('Error fetching user details:', error);
                    return {
                        id: task.id,
                        ownerName: 'Unknown',
                        name: task.name,
                        startDate: task.startDate,
                        endDate: task.endDate,
                        progress: 0,
                        numberOfSubtasks: 0,
                        numberOfCompletedSubtasks: 0,
                    };
                }
            }))
        };

        return res.status(200).send({ success: true, message: "Project found", data: response });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function getProjects(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        const user = await UserModel.findById(userId.userId);

        if (!user) {
            return res.status(409).send({ success: false, message: "User not found" });
        }

        const projects = await ProjectModel.find({ "members.userId": userId.userId })


        const response: Projects[] = projects.map(project => {
            const progress = calculateProgress(project.tasks);
            const userInProject = project.members.find(member => String(member.userId) === userId.userId);
            return {
                id: project._id,
                name: project.name,
                membersCount: project.members.length,
                role: userInProject ? userInProject.role : '',
                progress: progress
            };
        });


        return res.status(200).send({ success: true, message: "Projects found", data: { name: user.name, projects: response } });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function postProject(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        const name = req.body.name;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        const existingProject = await ProjectModel.findOne({ "name": name, "members.userId": userId.userId })

        if (existingProject) {
            return res.status(409).send({ success: false, message: "Project already exists" });
        }

        const projects = await ProjectModel.create({
            name: name,
            members: [
                { userId: userId.userId, role: 'owner' }
            ],
            tasks: []
        });

        console.log(projects._id);

        return res.status(200).send({ success: true, message: `Project '${name}' created`, data: { id: projects._id } });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function patchProject(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var id = req.params.id;
        var name = req.body.name;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        if (!id || !name) {
            return res.status(200).send({ success: true, message: "No Content changed" });
        }

        const userId = decodeAccessToken(token) as Token;

        const projects = await ProjectModel.findOne({ _id: id })

        if (projects === null) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const userInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!userInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        if (userInProject.role !== 'owner') {
            return res.status(409).send({ success: false, message: "User not allowed to modify project" });
        }

        const response = await ProjectModel.updateOne({ _id: id }, { name: name });

        if (!response || !response.acknowledged) {
            return res.status(400).send({ success: false, message: "Can't update name, data invalid" });
        }

        return res.status(200).send({ success: true, message: "Task name changed" })
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function deleteProject(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var id = req.params.id;

        if (!token || !id) {
            return res.status(400).send({ success: false, message: "No Access Token or no Id provided" });
        }

        const userId = decodeAccessToken(token) as Token;

        const projects = await ProjectModel.findOne({ _id: id })

        if (projects === null) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const userInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!userInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        if (userInProject.role !== 'owner') {
            return res.status(409).send({ success: false, message: "User not allowed to delete project" });
        }

        const response = await ProjectModel.findOneAndDelete({ _id: id });

        if (!response || !response.name) {
            return res.status(400).send({ success: false, message: "Can't delete project" });
        }

        return res.status(200).send({ success: true, message: `Project '${response.name}' deleted` })
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function quitProject(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var id = req.params.id;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        const projects = await ProjectModel.findOne({ _id: id })

        console.log(projects);

        if (projects === null) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const userInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!userInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        if (userInProject.role === 'owner') {
            return res.status(409).send({ success: false, message: "Owner not allowed to quit a project" });
        }

        // Update ownerId to null for tasks associated with the user leaving the project
        await ProjectModel.updateMany(
            { _id: id, "tasks.ownerId": userInProject.userId },
            { $set: { "tasks.$[elem].ownerId": null } },
            { arrayFilters: [{ "elem.ownerId": userInProject.userId }] }
        );

        // Remove the user from the members array
        await ProjectModel.updateOne(
            { _id: id },
            { $pull: { members: { userId: userInProject.userId } } }
        );

        return res.status(200).send({ success: true, message: "Project leaved successfully" })
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

export {
    getProject,
    getProjects,
    postProject,
    patchProject,
    deleteProject,
    quitProject,
}