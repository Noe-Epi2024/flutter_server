import { ProjectModel } from "../../database/schema/projects";
import { UserModel } from "../../database/schema/users";
import { Token } from "../../types/token";
import { Request, Response } from 'express';
import { decodeAccessToken } from "../../functions/token/decode";
import { ObjectId } from "mongodb";

async function postSubTask(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        var taskId = req.params.taskId;
        const subTaskName = req.body.name;

        if (!token || !projectId || !taskId) {
            return res.status(400).send({ success: false, message: "No access token or project/task id sent" });
        }

        if (!subTaskName) {
            return res.status(409).send({ success: false, message: "Missing parameter name" });
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

        const task = projects.tasks.find(task => String(task.id) === taskId);

        if (!task) {
            return res.status(404).send({ success: false, message: "Task not found in the project" });
        }

        const subTaskId = new ObjectId();

        const newSubTask = await ProjectModel.updateOne(
            { _id: projectId, "tasks._id": taskId }, // Match the project and the specific task within it
            { $push: { "tasks.$.subtasks": { name: subTaskName, isDone: false, _id: subTaskId } } } // Push the subtask into the specific task's subtasks array
        );

        if (!newSubTask || !newSubTask.modifiedCount) {
            return res.status(400).send({ success: false, message: "Can't add subTask to the project" });
        }

        return res.status(200).send({ success: true, message: "Task successfully created", data: { id: subTaskId } });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function deleteSubTask(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        var taskId = req.params.taskId;
        var subtaskId = req.body.subtaskId;

        if (!token || !projectId || !taskId) {
            return res.status(400).send({ success: false, message: "Missing parameter token or project/task id" });
        }

        if (!subtaskId) {
            return res.status(409).send({ success: false, message: "Missing parameter subtaskId" });
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

        const task = projects.tasks.find(task => String(task.id) === taskId);

        if (!task) {
            return res.status(404).send({ success: false, message: "Task not found in the project" });
        }

        const response = await ProjectModel.updateOne({ _id: projectId, "tasks._id": taskId }, { $pull: { "tasks.$.subtasks": { _id: subtaskId } } });

        if (!response || !response.modifiedCount) {
            return res.status(400).send({ success: false, message: "Can't delete not existing task to project" });
        }

        return res.status(200).send({ success: true, message: "Task successfully deleted" });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function patchSubTask(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        var projectId = req.params.id;
        var taskId = req.params.taskId;
        var subtaskId = req.params.subtaskId;
        var data = req.body;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token provided" });
        }

        if (!subtaskId || !projectId || !taskId) {
            return res.status(400).send({ success: false, message: "Missing parameter subtaskId or project/task id" });
        }

        if (!data || Object.keys(data).length === 0) {
            return res.status(200).send({ success: true, message: "No Content changed" });
        }

        if (data.name as string === undefined && data.isDone as Boolean === undefined) {
            return res.status(409).send({ success: false, message: "Missing or wrong data to change" });
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

        if (userInProject.role !== "owner" && userInProject.role !== "admin" && userInProject.role !== "writer") {
            return res.status(409).send({ success: false, message: "User not owner/admin or writer in the project" });
        }

        const taskData = await ProjectModel.updateOne(
            {
                _id: projectId,
                "tasks._id": taskId,
                "tasks.subtasks._id": subtaskId
            },
            {
                $set: {
                    "tasks.$[outer].subtasks.$[inner].name": data.name,
                    "tasks.$[outer].subtasks.$[inner].isDone": data.isDone
                }
            },
            {
                arrayFilters: [
                    { "outer._id": taskId },
                    { "inner._id": subtaskId }
                ]
            }
        );

        if (!taskData) {
            return res.status(400).send({ success: false, message: "Can't update Subtask data" });
        }

        if (taskData.modifiedCount === 0 && taskData.matchedCount !== 0) {
            return res.status(200).send({ success: true, message: "No Content changed" });
        }

        return res.status(200).send({ success: true, message: "SubTask successfully modified" });
    }
    catch (error) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

export { postSubTask, deleteSubTask, patchSubTask };