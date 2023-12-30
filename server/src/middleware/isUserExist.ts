import { Request, Response, NextFunction } from 'express';
import tokenToEmail from "../functions/token/tokenToEmail";

export default async function isUserExist(req: Request, res: Response, next: NextFunction) {

    const accessToken = req.headers.authorization;

    if (!accessToken) {
        return res.status(400).send({ success: false, message: "No token provided" });
    }

    const userEmail = await tokenToEmail(accessToken);

    if (!userEmail) {
        return res.status(400).send({ success: false, message: "Invalid token" });
    }

    next();
}