import { Request, Response } from 'express';
import crypto from 'crypto';
import { uploadFileToS3, getSignedUrlFromS3, s3BucketName } from '../../database/s3';
import { UserModel } from '../../database/schema/users';
import { decodeAccessToken } from "../../functions/token/decode";
import { Token } from "../../types/token";

export async function addPicture(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        if (!userId) {
            return res.status(400).send({ success: false, message: "Invalid access token" });
        }

        const user = await UserModel.findOne({ _id: userId.userId });

        if (!user) {
            return res.status(400).send('User not found.');
        }

        const name = crypto.randomBytes(32).toString('hex');

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        await uploadFileToS3(req.file.buffer, name, req.file.mimetype);

        const url = await getSignedUrlFromS3(name);

        await UserModel.updateOne(
            { _id: userId.userId },
            { $set: { photo: name } }
        );

        res.status(200).send({ data: { url: url } });
    } catch (error) {
        console.error("Error adding picture:", error);
        res.status(500).send('Internal Server Error');
    }
}


export async function getPicture(req: Request, res: Response) {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(400).send({ success: false, message: "No access token sent" });
        }

        const userId = decodeAccessToken(token) as Token;

        const user = await UserModel.findOne({ _id: userId.userId });

        if (!user) {
            return res.status(400).send('User not found.');
        }

        if (!user.photo) {
            res.status(200).send({ data: { url: null } });
        }

        const url = await getSignedUrlFromS3(user.photo);

        if (!url) {
            return res.status(400).send('Error getting picture.');
        }

        res.status(200).send({ data: { url: url } });
    } catch (error) {
        console.error("Error getting picture:", error);
        res.status(500).send('Internal Server Error');
    }
}
