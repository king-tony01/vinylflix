import { prisma } from '../../prisma/client.js';
import { NotFoundError } from '../../utils/errors.js';

export class UserService {
  public static async updateProfile(userId: string, data: { fullName?: string; bio?: string; country?: string; avatarUrl?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: data.fullName || null,
        bio: data.bio || null,
        country: data.country || 'NG',
        avatarUrl: data.avatarUrl || null,
      },
      update: {
        fullName: data.fullName !== undefined ? data.fullName : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
        country: data.country !== undefined ? data.country : undefined,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
      },
    });

    return profile;
  }
}
