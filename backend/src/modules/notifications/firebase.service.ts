import fs from 'fs';
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

  try {
    // 1. Check for Base64 encoded Service Account JSON (Recommended for Coolify & Docker Compose)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim(), 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decoded);
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        logger.info('[FIREBASE_ADMIN] Initialized using FIREBASE_SERVICE_ACCOUNT_BASE64');
        return;
      } catch (err) {
        logger.error(`[FIREBASE_ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64: ${err}`);
      }
    }

    // 2. Check for whole JSON or Base64 in FIREBASE_SERVICE_ACCOUNT
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        let serviceAccount: any;
        if (raw.startsWith('{')) {
          serviceAccount = JSON.parse(raw);
        } else {
          // Attempt base64 decode if value does not start with JSON brace
          const decoded = Buffer.from(raw, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        }
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        logger.info('[FIREBASE_ADMIN] Initialized using FIREBASE_SERVICE_ACCOUNT');
        return;
      } catch (err) {
        logger.error(`[FIREBASE_ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT: ${err}`);
      }
    }

    // 3. Check for direct file path in FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS
    const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (filePath && fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        logger.info(`[FIREBASE_ADMIN] Initialized using service account file at ${filePath}`);
        return;
      } catch (err) {
        logger.error(`[FIREBASE_ADMIN] Failed to read credentials file at ${filePath}: ${err}`);
      }
    }

    // 4. Check for individual credentials (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY / PRIVATE_KEY_BASE64)
    if (
      process.env.FIREBASE_CLIENT_EMAIL &&
      (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64)
    ) {
      let privateKey: string;
      if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
        privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64.trim(), 'base64').toString('utf8');
      } else {
        privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      }

      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'vinylflix-project',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      logger.info('[FIREBASE_ADMIN] Initialized using discrete FIREBASE_* credentials');
      return;
    }

    // 5. Fallback to Google Application Default Credentials (ADC)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseApp = initializeApp();
      logger.info('[FIREBASE_ADMIN] Initialized using GOOGLE_APPLICATION_CREDENTIALS path');
      return;
    }

    logger.warn(
      '[FIREBASE_ADMIN] No Firebase Service Account configured. Real push notifications will not be sent until FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT is set in environment.'
    );
  } catch (error) {
    logger.error(`[FIREBASE_ADMIN] Initialization error: ${error}`);
  }
}

// Call on module load
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
        `[FIREBASE_MOCK] Skipped live FCM dispatch (Firebase Admin not configured in this environment). Would send to ${tokens.length} devices: "${payload.title}"`
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
