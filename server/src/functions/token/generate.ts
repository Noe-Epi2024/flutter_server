import jwt from 'jsonwebtoken';
import { Types } from "mongoose";

function generateAccessToken(UserId: Types.ObjectId) {
    const payload = { userId: UserId };

    const token = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET!,
        {
            expiresIn: "120d",
        }
    );

    return token;
}

export {
    generateAccessToken,
}