import { Model, Schema, model } from "mongoose";

interface Subtask {
    name: string;
    isDone: boolean;
}

type SubtaskSchema = Model<Subtask>;

const SubtasksSchema = new Schema<Subtask, SubtaskSchema>({
    name: { type: String, required: true },
    isDone: { type: Boolean, required: false, default: false },
});

const SubtaskModel = model<Subtask, SubtaskSchema>("subtasks", SubtasksSchema);

export { SubtaskModel, SubtasksSchema }