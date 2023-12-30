import { Request, Response, NextFunction } from 'express';
import { decodeAccessToken } from "../functions/token/decode";

export default function accessTokenExist(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(400).send({ success: false, message: "No access token sent" });
    }

    try {
        const accessToken = decodeAccessToken(token);

        if (accessToken === null) {
            return res.status(400).send({ success: false, message: "Invalid access token" });
        }

        return next();
    } catch (err) {
        return res.status(409).send({ success: false, message: "Server Error" });
    }
}