import { Types } from 'mongoose';
import { Member } from './members';
import { Task } from './tasks';

interface Project {
    name: string;
    members: Member[];
    tasks: Task[];
}

type Projects = {
    id: Types.ObjectId;
    name: string;
    membersCount: number;
    role: string;
    progress: number | null;
}

type ProjectById = {
    id: Types.ObjectId;
    name: string;
    role: string;
    tasks: Array<{
        id: Types.ObjectId;
        ownerName?: string;
        name?: string;
        startDate?: Date;
        endDate?: Date;
        progress: number | null;
        numberOfSubtasks?: number;
        numberOfCompletedSubtasks?: number;
    }>;
}

export { Project, Projects, ProjectById }