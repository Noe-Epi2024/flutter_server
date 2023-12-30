import { Model, Schema, model } from "mongoose";

import { Project } from "../../types/projects";
import { Member } from "../../types/members";
import { TasksSchema } from "./tasks";

const memberSchema = new Schema<Member>({
    userId: { type: Schema.Types.ObjectId, required: true },
    role: { type: String, required: false, default: "reader" },
});

type ProjectSchema = Model<Project>;

const schema = new Schema<Project, ProjectSchema>({
    name: { type: String, required: true },
    members: { type: [memberSchema], required: true },
    tasks: { type: [TasksSchema], required: true },
});

const ProjectModel = model<Project, ProjectSchema>("projects", schema);

export { ProjectModel, memberSchema }