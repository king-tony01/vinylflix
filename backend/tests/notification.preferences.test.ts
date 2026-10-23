import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '../src/prisma/client.js';
import { NotificationService } from '../src/modules/notifications/notification.service.js';

describe('Notification Preferences & Push Tokens (Server-Side Sync)', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create clean test user
    const username = `notif_user_${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username}@test.com`,
        passwordHash: 'hashed_password',
        referralCode: `NOTIF_${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({});
    await prisma.deviceToken.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
  });

  it('should auto-create default notification preferences on first fetch', async () => {
    const prefs = await NotificationService.getPreferences(testUserId);
    expect(prefs).toBeDefined();
    expect(prefs.userId).toBe(testUserId);
    expect(prefs.pushEnabled).toBe(true);
    expect(prefs.newReleases).toBe(true);
    expect(prefs.trendingReels).toBe(false);
    expect(prefs.walletAlerts).toBe(true);
    expect(prefs.emailReceipts).toBe(true);
    expect(prefs.loginAlerts).toBe(true);
    expect(prefs.marketingEmails).toBe(false);
  });

  it('should update preferences on server without losing other flags', async () => {
    // Initial fetch
    await NotificationService.getPreferences(testUserId);

    // Update only newReleases and trendingReels
    const updated = await NotificationService.updatePreferences(testUserId, {
      newReleases: false,
      trendingReels: true,
      marketingEmails: true,
    });

    expect(updated.newReleases).toBe(false);
    expect(updated.trendingReels).toBe(true);
    expect(updated.marketingEmails).toBe(true);
    expect(updated.pushEnabled).toBe(true); // Unchanged
    expect(updated.walletAlerts).toBe(true); // Unchanged

    // Verify persistence directly from DB
    const persisted = await prisma.notificationPreference.findUnique({
      where: { userId: testUserId },
    });
    expect(persisted?.newReleases).toBe(false);
    expect(persisted?.trendingReels).toBe(true);
  });

  it('should register and deactivate device tokens', async () => {
    const token = `fcm_token_sample_${Date.now()}`;
    const device = await NotificationService.registerDeviceToken(testUserId, token, 'android');
    expect(device).toBeDefined();
    expect(device?.token).toBe(token);
    expect(device?.isActive).toBe(true);

    // Deactivate on logout
    await NotificationService.removeDeviceToken(token);
    const inDb = await prisma.deviceToken.findUnique({ where: { token } });
    expect(inDb?.isActive).toBe(false);
  });

  it('should create in-app notification and enforce preference filtering', async () => {
    // Register token
    const token = `token_push_${Date.now()}`;
    await NotificationService.registerDeviceToken(testUserId, token, 'android');

    // 1. Send normal reward notification (walletAlerts = true by default)
    const notif1 = await NotificationService.sendNotification({
      userId: testUserId,
      title: 'Reward Credited',
      message: 'You received ₦1,000',
      type: 'REWARD',
    });
    expect(notif1.id).toBeDefined();
    expect(notif1.title).toBe('Reward Credited');

    // 2. Disable wallet alerts
    await NotificationService.updatePreferences(testUserId, { walletAlerts: false });

    // Send another reward notification
    const notif2 = await NotificationService.sendNotification({
      userId: testUserId,
      title: 'Reward Credited 2',
      message: 'You received ₦500',
      type: 'REWARD',
    });
    // In-app notification is still saved in DB for history
    expect(notif2.id).toBeDefined();

    // 3. Test listNotifications and unread count
    const list = await NotificationService.listNotifications(testUserId);
    expect(list.total).toBe(2);
    expect(list.unreadCount).toBe(2);

    // 4. Mark one as read
    await NotificationService.markAsRead(testUserId, notif1.id);
    const listAfterOne = await NotificationService.listNotifications(testUserId);
    expect(listAfterOne.unreadCount).toBe(1);

    // 5. Mark all as read
    await NotificationService.markAllAsRead(testUserId);
    const listAfterAll = await NotificationService.listNotifications(testUserId);
    expect(listAfterAll.unreadCount).toBe(0);
  });
});
