import { Types } from 'mongoose';

export interface Subtask {
    name: string;
    isDone: boolean;
    _id: Types.ObjectId;
}