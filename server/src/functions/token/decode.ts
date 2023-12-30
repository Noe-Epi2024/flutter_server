import jwt from 'jsonwebtoken';
import * as dotenv from "dotenv";
dotenv.config();

function decodeAccessToken(token: string) {
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return "expired";
        }
        return null;
    }
}

export {
    decodeAccessToken,
};