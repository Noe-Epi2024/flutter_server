import { ProjectModel } from "../../database/schema/projects";
import { UserModel } from "../../database/schema/users";
import { Token } from "../../types/token";
import { Request, Response } from 'express';
import { decodeAccessToken } from "../../functions/token/decode";
import { ObjectId } from "mongodb";

async function getTask(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        var taskId = req.params.taskId;

        if (!token || !projectId || !taskId) {
            return res.status(400).send({ success: false, message: "No access token or task/project id sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        if (!userId) {
            return res.status(409).send({ success: false, message: "User not found" });
        }

        const userExists = await UserModel.findOne({ _id: userId.userId });

        if (!userExists) {
            return res.status(409).send({ success: false, message: "User does not exist" });
        }

        const projects = await ProjectModel.findOne({ _id: projectId })

        if (!projects) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const userInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!userInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        const task = projects.tasks.find(task => String(task.id) === taskId);

        if (!task) {
            return res.status(409).send({ success: false, message: "Task not found in project" });
        }

        const ownerName = await UserModel.findById(task.ownerId);

        if (ownerName) {
            task.ownerName = ownerName.name
        }

        return res.status(200).send({ success: true, message: "Task successfully found", data: task });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function postTask(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        const task = req.body;

        if (!token || !projectId) {
            return res.status(400).send({ success: false, message: "No access token or project id sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        if (!userId) {
            return res.status(409).send({ success: false, message: "User not found" });
        }

        const userExists = await UserModel.findOne({ _id: userId.userId });

        if (!userExists) {
            return res.status(409).send({ success: false, message: "User does not exist" });
        }

        const projects = await ProjectModel.findOne({ _id: projectId })

        if (!projects) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const userInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!userInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        if (userInProject.role !== "owner" && userInProject.role !== "admin" && userInProject.role !== "writer") {
            return res.status(409).send({ success: false, message: "User not owner/admin or writer in the project" });
        }

        // if no body or empty body create empty task
        if (!task.name || !task.description || !task.startDate || !task.endDate || !task.ownerId) {
            task._id = new ObjectId();
            task.startDate = new Date();

            const newTask = await ProjectModel.updateOne({ _id: projectId }, { $push: { tasks: task } });

            if (!newTask || !newTask.modifiedCount) {
                return res.status(400).send({ success: false, message: "Can't add task to the project" });
            }

            return res.status(200).send({ success: true, message: "Task successfully created", data: { id: task._id } });

        }

        const ownerOfTaskId = await UserModel.findOne({ _id: task.ownerId });

        if (!ownerOfTaskId) {
            return res.status(409).send({ success: false, message: "User selected for being owner of the task does not exist" });
        }

        const ownerOfTaskInProject = projects.members.find(member => String(member.userId) === String(ownerOfTaskId._id));

        if (!ownerOfTaskInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        task._id = new ObjectId();
        task.startDate = new Date();

        const newTask = await ProjectModel.updateOne({ _id: projectId }, { $push: { tasks: task } });

        if (!newTask || !newTask.modifiedCount) {
            return res.status(400).send({ success: false, message: "Can't add task to the project" });
        }

        return res.status(200).send({ success: true, message: "Task successfully created", data: { id: task._id } });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function deleteTask(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        var taskId = req.body.taskId;

        if (!token || !projectId || !taskId) {
            return res.status(400).send({ success: false, message: "No access token or project/task id sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        if (!userId) {
            return res.status(409).send({ success: false, message: "User not found" });
        }

        const userExists = await UserModel.findOne({ _id: userId.userId });

        if (!userExists) {
            return res.status(409).send({ success: false, message: "User does not exist" });
        }

        const projects = await ProjectModel.findOne({ _id: projectId })

        if (!projects) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const userInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!userInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        if (userInProject.role !== "owner" && userInProject.role !== "admin" && userInProject.role !== "writer") {
            return res.status(409).send({ success: false, message: "User not owner/admin or writer in the project" });
        }

        const response = await ProjectModel.updateOne({ _id: projectId }, { $pull: { tasks: { _id: taskId } } });

        if (!response || !response.modifiedCount) {
            return res.status(400).send({ success: false, message: "Can't delete task to project" });
        }

        return res.status(200).send({ success: true, message: "Task successfully deleted" });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function patchTask(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        var taskId = req.params.taskId;
        var data = req.body;

        const allowedFields = ['name', 'description', 'startDate', 'endDate', 'ownerId'];
        const updateFields: { [key: string]: any } = {};

        if (!token || !projectId || !taskId) {
            return res.status(400).send({ success: false, message: "No access token or task/project id sent" });
        }

        if (!data || Object.keys(data).length === 0) {
            return res.status(200).send({ success: true, message: "No content changed" });
        }

        // Check if project and task exist
        const projects = await ProjectModel.findOne({ _id: projectId })

        if (!projects) {
            return res.status(409).send({ success: false, message: "Project not found" });
        }

        const task = projects.tasks.find(task => String(task.id) === taskId);

        if (!task) {
            return res.status(409).send({ success: false, message: "Task not found in project" });
        }

        // Check body value
        if (data.ownerId) {
            try {
                if (new ObjectId(data.ownerId)) {
                    const newOwner = await UserModel.findOne({ _id: data.ownerId });

                    if (!newOwner) {
                        return res.status(409).send({ success: false, message: "User selected for being owner of the task does not exist" });
                    }

                    const ownerOfTaskInProject = projects.members.find(member => String(member.userId) === String(data.ownerId));

                    if (!ownerOfTaskInProject) {
                        return res.status(409).send({ success: false, message: "User not found in project" });
                    }
                } else {
                    return res.status(409).send({ success: false, message: "Invalid id format" });
                }
            } catch (error) {
                return res.status(409).send({ success: false, message: "User selected for being owner of the task does not exist" });
            }
        }

        if (data.startDate && !data.endDate) {
            try {
                const startDate = new Date(data.startDate);

                if (isNaN(startDate.getTime())) {
                    return res.status(409).send({ success: false, message: "Invalid date format" });
                }

                if (startDate > task.endDate) {
                    return res.status(409).send({ success: false, message: "Start date can't be after task end date" });
                }

            } catch (error) {
                return res.status(409).send({ success: false, message: "Invalid date format" });
            }
        }

        if (data.endDate && !data.startDate) {
            try {
                const endDate = new Date(data.endDate);

                if (isNaN(endDate.getTime())) {
                    return res.status(409).send({ success: false, message: "Invalid date format" });
                }

                if (endDate < task.startDate) {
                    return res.status(409).send({ success: false, message: "End date can't be before task start date" });
                }
            } catch (error) {
                return res.status(409).send({ success: false, message: "Invalid date format" });
            }
        }

        if (data.startDate && data.endDate) {
            try {
                const endDate = new Date(data.endDate);
                const startDate = new Date(data.startDate);

                if (isNaN(endDate.getTime())) {
                    return res.status(409).send({ success: false, message: "End date invalid date format" });
                }

                if (isNaN(startDate.getTime())) {
                    return res.status(409).send({ success: false, message: "Start date invalid date format" });
                }

                if (startDate > endDate) {
                    return res.status(409).send({ success: false, message: "Start date can't be after end date" });
                }
            } catch (error) {
                return res.status(409).send({ success: false, message: "Invalid date format" });
            }
        }

        allowedFields.forEach(field => {
            if (data[field]) {
                updateFields[`tasks.$.${field}`] = data[field];
            }
        });

        const userId = decodeAccessToken(token) as Token;

        if (!userId) {
            return res.status(409).send({ success: false, message: "User not found" });
        }

        const userExists = await UserModel.findOne({ _id: userId.userId });

        if (!userExists) {
            return res.status(409).send({ success: false, message: "User does not exist" });
        }

        const userInProject = projects.members.find(member => String(member.userId) === userId.userId);

        if (!userInProject) {
            return res.status(409).send({ success: false, message: "User not found in project" });
        }

        if (userInProject.role !== "owner" && userInProject.role !== "admin" && userInProject.role !== "writer") {
            return res.status(409).send({ success: false, message: "User not owner/admin or writer in the project" });
        }

        const taskData = await ProjectModel.updateOne({ _id: projectId, "tasks._id": taskId }, { $set: updateFields });

        if (!taskData) {
            return res.status(400).send({ success: false, message: "Can't update task data" });
        }

        if (taskData.modifiedCount === 0 && taskData.matchedCount !== 0) {
            return res.status(200).send({ success: true, message: "No Content changed" });
        }

        return res.status(200).send({ success: true, message: "Task successfully modified" });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

export { getTask, postTask, deleteTask, patchTask };