import { Types } from "mongoose";

type User = {
    email: string;
    name: string;
    photo: string;
}

type Credential = {
    userId: Types.ObjectId;
    email: string;
    password: string;
}

export { User, Credential };