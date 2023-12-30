import { Model, Schema, Types, model } from "mongoose";

interface Credential {
    userId: Types.ObjectId;
    email: string;
    password: string;
}

type CredentialSchema = Model<Credential>;

const schema = new Schema<Credential, CredentialSchema>({
    userId: { type: Schema.Types.ObjectId, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
});

export const CredentialModel = model<Credential, CredentialSchema>("credentials", schema);