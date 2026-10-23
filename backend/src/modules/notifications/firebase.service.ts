import fs from 'fs';
import path from 'path';
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

  // Single environment variable for file mount path (defaults to standard /app mount)
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() || '/app/firebase-service-account.json';
  const resolvedPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);

  if (!fs.existsSync(resolvedPath)) {
    if (process.env.NODE_ENV === 'test') {
      logger.warn(
        `[FIREBASE_ADMIN] Service account file not found at "${resolvedPath}". Skipping termination in test environment.`
      );
      return;
    }

    logger.error(
      `[FATAL] Firebase service account file not found at "${resolvedPath}". ` +
      `Please mount your Firebase service account JSON file or set FIREBASE_SERVICE_ACCOUNT_PATH. Terminating process.`
    );
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    const serviceAccount = JSON.parse(fileContent);

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });

    logger.info(`[FIREBASE_ADMIN] Successfully initialized Firebase Admin SDK from file: ${resolvedPath}`);
  } catch (error) {
    logger.error(`[FATAL] Failed to parse or initialize Firebase service account from "${resolvedPath}": ${error}`);
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
