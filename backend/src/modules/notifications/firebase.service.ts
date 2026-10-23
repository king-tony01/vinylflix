import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from '../../utils/logger.js';
import { prisma } from '../../prisma/client.js';

let firebaseApp: App | null = null;

function initializeFirebaseAdmin() {
  if (firebaseApp || getApps().length > 0) {
    firebaseApp = getApps()[0];
    return;
  }

  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();

  // If environment variable does not exist or is empty, terminate the process
  if (!rawEnv) {
    if (process.env.NODE_ENV === 'test') {
      logger.warn(
        '[FIREBASE_ADMIN] FIREBASE_SERVICE_ACCOUNT not set in test environment. Skipping termination for tests.'
      );
      return;
    }

    logger.error(
      '[FATAL] Required environment variable FIREBASE_SERVICE_ACCOUNT is missing. Terminating process.'
    );
    process.exit(1);
  }

  try {
    // Parse service account: supports Base64 string (for Coolify/Docker) or raw JSON
    const jsonString = rawEnv.startsWith('{')
      ? rawEnv
      : Buffer.from(rawEnv, 'base64').toString('utf8');

    const serviceAccount = JSON.parse(jsonString);

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });

    logger.info('[FIREBASE_ADMIN] Successfully initialized Firebase Admin SDK from FIREBASE_SERVICE_ACCOUNT');
  } catch (error) {
    logger.error(`[FATAL] Failed to parse or initialize FIREBASE_SERVICE_ACCOUNT: ${error}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

// Initialize immediately on module load
initializeFirebaseAdmin();

export class FirebasePushService {
  /**
   * Dispatch push notification to a list of FCM device tokens.
   */
  public static async sendPushToTokens(
    tokens: string[],
    payload: {
      title: string;
      message: string;
      type?: string;
      metadata?: Record<string, any>;
    }
  ) {
    if (!tokens || tokens.length === 0) return;

    if (!firebaseApp && getApps().length === 0) {
      initializeFirebaseAdmin();
    }

    if (getApps().length === 0) {
      logger.info(
        `[FIREBASE_MOCK] Skipped FCM dispatch (Firebase not initialized). Would send to ${tokens.length} devices: "${payload.title}"`
      );
      return;
    }

    const { title, message, type = 'INFO', metadata = {} } = payload;

    const dataPayload: Record<string, string> = {
      type,
      title,
      body: message,
    };

    if (metadata) {
      for (const [key, val] of Object.entries(metadata)) {
        dataPayload[key] = typeof val === 'string' ? val : JSON.stringify(val);
      }
    }

    try {
      const messaging = getMessaging(firebaseApp || undefined);
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title,
          body: message,
        },
        data: dataPayload,
        android: {
          priority: 'high',
          notification: {
            channelId: 'vinylflix_notifications',
            sound: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
            icon: 'ic_launcher',
          },
        },
      });

      logger.info(
        `[FIREBASE_PUSH] Dispatched push notifications: ${response.successCount} succeeded, ${response.failureCount} failed.`
      );

      // Clean up invalid or unregistered tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          logger.info(`[FIREBASE_PUSH] Deactivating ${invalidTokens.length} unregistered tokens from DB`);
          await prisma.deviceToken.updateMany({
            where: { token: { in: invalidTokens } },
            data: { isActive: false },
          });
        }
      }
    } catch (error) {
      logger.error(`[FIREBASE_PUSH] Error sending push notification: ${error}`);
    }
  }
}
