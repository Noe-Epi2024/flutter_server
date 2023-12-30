import { Model, Schema, model } from "mongoose";

interface User {
    email: string;
    name: string;
    photo: string;
}

type UserSchema = Model<User>;

const schema = new Schema<User, UserSchema>({
    email: { type: String, required: true },
    name: { type: String, required: true },
    photo: {
        type: String,
        required: false
    },
});

export const UserModel = model<User, UserSchema>("users", schema);