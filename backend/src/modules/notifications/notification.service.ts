import { prisma } from '../../prisma/client.js';
import { logger } from '../../utils/logger.js';
import { NotFoundError } from '../../utils/errors.js';

export interface NotificationPreferenceInput {
  pushEnabled?: boolean;
  newReleases?: boolean;
  trendingReels?: boolean;
  walletAlerts?: boolean;
  emailReceipts?: boolean;
  loginAlerts?: boolean;
  marketingEmails?: boolean;
}

export interface SendNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'REWARD' | 'REFERRAL' | 'WITHDRAWAL' | 'SECURITY' | 'CAMPAIGN' | 'NEW_RELEASE';
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Retrieve notification preferences for a user.
   * If none exists yet, automatically create standard defaults on the server.
   */
  public static async getPreferences(userId: string) {
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId,
          pushEnabled: true,
          newReleases: true,
          trendingReels: false,
          walletAlerts: true,
          emailReceipts: true,
          loginAlerts: true,
          marketingEmails: false,
        },
      });
    }

    return pref;
  }

  /**
   * Update notification preferences on the server.
   */
  public static async updatePreferences(userId: string, data: NotificationPreferenceInput) {
    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        pushEnabled: data.pushEnabled ?? true,
        newReleases: data.newReleases ?? true,
        trendingReels: data.trendingReels ?? false,
        walletAlerts: data.walletAlerts ?? true,
        emailReceipts: data.emailReceipts ?? true,
        loginAlerts: data.loginAlerts ?? true,
        marketingEmails: data.marketingEmails ?? false,
      },
      update: {
        pushEnabled: data.pushEnabled !== undefined ? data.pushEnabled : undefined,
        newReleases: data.newReleases !== undefined ? data.newReleases : undefined,
        trendingReels: data.trendingReels !== undefined ? data.trendingReels : undefined,
        walletAlerts: data.walletAlerts !== undefined ? data.walletAlerts : undefined,
        emailReceipts: data.emailReceipts !== undefined ? data.emailReceipts : undefined,
        loginAlerts: data.loginAlerts !== undefined ? data.loginAlerts : undefined,
        marketingEmails: data.marketingEmails !== undefined ? data.marketingEmails : undefined,
      },
    });

    logger.info(`[NOTIFICATIONS] Updated preferences for user ${userId}: ${JSON.stringify(pref)}`);
    return pref;
  }

  /**
   * Register or refresh an FCM device token for push notifications.
   */
  public static async registerDeviceToken(userId: string, token: string, platform: string = 'android') {
    if (!token || token.trim().length === 0) return null;

    const deviceToken = await prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform,
        isActive: true,
      },
      update: {
        userId, // re-assign to active user if device switched account
        platform,
        isActive: true,
      },
    });

    logger.info(`[NOTIFICATIONS] Registered device token for user ${userId} on platform ${platform}`);
    return deviceToken;
  }

  /**
   * Deactivate or remove a device token upon logout.
   */
  public static async removeDeviceToken(token: string) {
    if (!token) return;
    try {
      await prisma.deviceToken.updateMany({
        where: { token },
        data: { isActive: false },
      });
      logger.info(`[NOTIFICATIONS] Deactivated device token`);
    } catch (err) {
      logger.warn(`[NOTIFICATIONS] Failed to deactivate device token: ${err}`);
    }
  }

  /**
   * Dispatch a notification to a specific user, evaluating server-side preferences before delivery.
   */
  public static async sendNotification(payload: SendNotificationPayload) {
    const { userId, title, message, type = 'INFO', metadata } = payload;

    // 1. Fetch user's server preferences
    const prefs = await this.getPreferences(userId);

    // 2. Check if this notification type is permitted by user's preferences
    let shouldDeliverPush = prefs.pushEnabled;

    if (shouldDeliverPush) {
      if (type === 'NEW_RELEASE' && !prefs.newReleases) {
        shouldDeliverPush = false;
      } else if ((type === 'REWARD' || type === 'WITHDRAWAL' || type === 'REFERRAL') && !prefs.walletAlerts) {
        shouldDeliverPush = false;
      } else if (type === 'SECURITY' && !prefs.loginAlerts) {
        shouldDeliverPush = false;
      } else if (type === 'CAMPAIGN' && !prefs.trendingReels) {
        shouldDeliverPush = false;
      }
    }

    // 3. Always save in-app notification record in DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // 4. Send Push notification if permitted
    if (shouldDeliverPush) {
      const activeTokens = await prisma.deviceToken.findMany({
        where: { userId, isActive: true },
        select: { token: true, platform: true },
      });

      if (activeTokens.length > 0) {
        logger.info(
          `[PUSH_DISPATCH] Sending push notification to user ${userId} (${activeTokens.length} active devices): "${title}" - "${message}"`
        );
        // Note: Real Firebase Admin SDK dispatch would happen here with FCM tokens: activeTokens.map(t => t.token)
      } else {
        logger.info(`[PUSH_DISPATCH] User ${userId} has no active device tokens registered.`);
      }
    } else {
      logger.info(`[PUSH_DISPATCH] Push suppressed for user ${userId} per server preferences (type=${type})`);
    }

    return notification;
  }

  /**
   * List in-app notifications for the user.
   */
  public static async listNotifications(userId: string, limit: number = 30, offset: number = 0) {
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      total,
      unreadCount,
    };
  }

  /**
   * Mark a specific notification as read.
   */
  public static async markAsRead(userId: string, notificationId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notif) throw new NotFoundError('Notification not found');

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user.
   */
  public static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
