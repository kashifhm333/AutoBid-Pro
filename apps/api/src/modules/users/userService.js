import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../errors/index.js';

export class UserService {
  static async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        profile: {
          include: {
            addresses: true,
            phoneNumbers: true,
            preferences: true
          }
        },
        sellerProfile: true,
        dealerProfile: true,
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return {
      ...user,
      roles: user.userRoles.map(ur => ur.role.name)
    };
  }

  static async updateProfile(userId, profileData) {
    return prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });
  }

  static async updatePreferences(userId, preferenceData) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new NotFoundError('UserProfile for user', userId);
    }

    return prisma.userPreference.upsert({
      where: { profileId: profile.id },
      update: preferenceData,
      create: {
        profileId: profile.id,
        ...preferenceData
      }
    });
  }

  static async getSellerProfile(userId) {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true
          }
        }
      }
    });

    if (!seller) {
      throw new NotFoundError('SellerProfile for user', userId);
    }

    return seller;
  }
}
