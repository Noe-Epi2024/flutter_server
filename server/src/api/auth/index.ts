import { UserModel } from "../../database/schema/users";
import { CredentialModel } from "../../database/schema/credentials";
import { Credential } from "../../types/users";
import { pbkdf2Sync, randomBytes } from "crypto";
import { generateAccessToken } from "../../functions/token/generate";
import { Request, Response } from 'express';
import * as dotenv from "dotenv";
dotenv.config();

async function userRegister(req: Request, res: Response) {
    try {
        const userCredentials: Credential = req.body;

        if (!(userCredentials.email && userCredentials.password)) {
            res.status(400).send({ success: false, message: "All input with red asterix are required" });
        }

        const oldUser = await UserModel.findOne({ email: userCredentials.email.toLowerCase() });

        if (oldUser) {
            return res.status(409).send({ success: false, message: "User Already Exist. Please Login" });
        }

        const salt = randomBytes(16).toString('hex');

        const hash = pbkdf2Sync(userCredentials.password, salt, 10000, 64, 'sha256').toString('hex');

        const storedPassword = `${salt}:${hash}`;

        const user = await UserModel.create({
            name: userCredentials.email.toLowerCase().split('@')[0],
            email: userCredentials.email.toLowerCase(),
        });

        const Credentials = await CredentialModel.create({
            userId: user._id,
            email: userCredentials.email.toLowerCase(),
            password: storedPassword,
        });

        const token = generateAccessToken(user._id)

        res.status(201).send({ success: true, message: "New user created successfully", data: { accessToken: token } });
    } catch (err) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
};

async function userLogin(req: Request, res: Response) {
    try {
        const userCredentials: Credential = req.body;

        if (!(userCredentials.email && userCredentials.password)) {
            res.status(400).send({ success: false, message: "All input with red asterix are required" });
        }

        const oldCredential = await CredentialModel.findOne({ email: userCredentials.email.toLowerCase() });

        if (!oldCredential) {
            return res.status(409).send({ success: false, message: "User doesn't Exist. Please Register" });
        }

        const [storedSalt, storedHash] = oldCredential.password.split(':');

        const inputHash = pbkdf2Sync(userCredentials.password, storedSalt, 10000, 64, 'sha256',);

        const password = inputHash.toString('hex') === storedHash;

        if (!password) {
            return res.status(400).send({ success: false, message: "Invalid Credentials" });
        }

        const oldUser = await UserModel.findOne({ _id: oldCredential.userId });

        if (!oldUser) {
            return res.status(409).send({ success: false, message: "User not found. Please Register" });
        }

        const token = generateAccessToken(oldUser._id)

        res.status(200).send({ success: true, message: "User successfully logged in", data: { accessToken: token } });
    } catch (err) {
        return res.status(409).send({ success: false, message: "Internal Server Error" });
    }
}

export {
    userRegister,
    userLogin,
}