import { Types } from "mongoose";

export interface Member {
    userId: Types.ObjectId;
    role: string;
    name: string;
}