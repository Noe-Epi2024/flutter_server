import { UserModel } from "../../database/schema/users";
import { ProjectModel } from "../../database/schema/projects";
import { CredentialModel } from "../../database/schema/credentials";
import { Token } from "../../types/token";
import { Request, Response } from 'express';
import { decodeAccessToken } from "../../functions/token/decode";
import { User } from "../../types/users";

async function getMe(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        const accessToken = decodeAccessToken(token) as Token;

        if (!accessToken) {
            return res.status(400).send({ success: false, message: "Invalid access token" });
        }

        const user = await UserModel.findById(accessToken.userId);

        if (!user) {
            return res.status(409).send({ success: false, message: "No user found" });
        }

        const response = {
            email: user.email,
            name: user.name,
            photo: user.photo
        };

        res.status(200).send({ success: true, message: "OK", data: response });
    } catch (err) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function patchMe(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;
        const body = req.body;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        if (!body) {
            return res.status(200).send({ success: true, message: "No content changed" });
        }

        const accessToken = decodeAccessToken(token) as Token;

        if (!accessToken) {
            return res.status(400).send({ success: false, message: "Invalid access token" });
        }

        const userId = accessToken.userId;

        const user = await UserModel.findOne({ _id: userId });

        if (!user) {
            return res.status(409).send({ success: false, message: "User not found" });
        }

        const response = await UserModel.updateOne({ _id: userId }, body);

        if (body.email) {
            const newEmail = await CredentialModel.updateOne({ userId: userId }, { email: body.email });
        }

        if (!response || !response.acknowledged) {
            return res.status(200).send({ success: true, message: "No content changed" });
        }

        res.status(200).send({ success: true, message: "Value successfully modified" });
    } catch (err) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

async function getUsers(req: Request, res: Response) {
    try {
        const { exclude, filter } = req.query;

        let users: User[] | null = null;

        if (!exclude && filter) {
            return res.status(400).send({ success: false, message: "Can't filter without excluding" });
        }

        if (!exclude && !filter) {
            users = await UserModel.find({});
        }

        if (exclude && !filter) {
            const userInProject = await ProjectModel.findById(exclude);
            const userList = userInProject?.members.map(member => member.userId);
            users = await UserModel.find({ _id: { $nin: userList } });
        }

        if (exclude && filter) {
            const userInProject = await ProjectModel.findById(exclude);
            const userList = userInProject?.members.map(member => member.userId);
            users = await UserModel.find({ $and: [{ _id: { $nin: userList } }, { name: { $regex: filter as string, $options: 'i' } }] });
        }

        return res.status(200).send({ success: true, message: "Users successfully retrieved", data: { users: users } });
    } catch (err) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}


export { getMe, patchMe, getUsers };