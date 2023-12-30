import { Types } from 'mongoose';
import { Subtask } from './subtasks';

export interface Task {
    id: Types.ObjectId;
    ownerId: Types.ObjectId;
    ownerName: string;
    description: string;
    name: string;
    startDate: Date;
    endDate: Date;
    subtasks: Subtask[];
}