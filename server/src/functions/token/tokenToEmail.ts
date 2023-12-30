import { decodeAccessToken } from './decode';
import { UserModel } from '../../database/schema/users';

type User = {
    email: string;
}

export default async function tokenToEmail(token: string): Promise<string | null> {
    const tokenData = decodeAccessToken(token);

    if (!tokenData || typeof tokenData === 'string') {
        return null;
    }

    const oldUser = await UserModel.findOne({ _id: tokenData.userId });

    const user = oldUser as User;

    if (!user || !user.email) {
        return null;
    }

    return user.email;
}