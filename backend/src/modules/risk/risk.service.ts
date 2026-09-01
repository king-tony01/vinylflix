import { prisma } from '../../prisma/client.js';
import { logger } from '../../utils/logger.js';

export interface EvaluateRiskParams {
  userId: string;
  entityType: 'WATCH_SESSION' | 'REFERRAL' | 'WITHDRAWAL' | 'AUTH';
  entityId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  metadata?: any;
}

export interface RiskEvaluationResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
  isBlocked: boolean;
}

export class RiskService {
  /**
   * Evaluates risk for an action and records risk events.
   */
  public static async evaluateRisk(params: EvaluateRiskParams): Promise<RiskEvaluationResult> {
    const flags: string[] = [];
    let riskScore = 0;

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { riskScore: true },
    });

    if (!user) {
      return { riskScore: 100, riskLevel: 'CRITICAL', flags: ['USER_NOT_FOUND'], isBlocked: true };
    }

    if (user.status === 'SUSPENDED') {
      flags.push('ACCOUNT_SUSPENDED');
      riskScore += 100;
    } else if (user.status === 'RESTRICTED') {
      flags.push('ACCOUNT_RESTRICTED');
      riskScore += 50;
    }

    // 1. Account age check
    const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 1 && params.entityType === 'WITHDRAWAL') {
      flags.push('VERY_NEW_ACCOUNT_WITHDRAWAL');
      riskScore += 25;
    }

    // 2. Duplicate device fingerprint check
    if (params.deviceFingerprint) {
      const duplicateUsers = await prisma.watchSession.findMany({
        where: {
          deviceFingerprint: params.deviceFingerprint,
          userId: { not: params.userId },
        },
        distinct: ['userId'],
        take: 5,
      });

      if (duplicateUsers.length > 0) {
        flags.push(`DUPLICATE_DEVICE_FOUND_${duplicateUsers.length}_OTHER_ACCOUNTS`);
        riskScore += duplicateUsers.length * 20;
      }
    }

    // 3. Referral velocity check
    if (params.entityType === 'REFERRAL') {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentReferrals = await prisma.referral.count({
        where: {
          referrerId: params.userId,
          createdAt: { gte: tenMinutesAgo },
        },
      });

      if (recentReferrals > 5) {
        flags.push('HIGH_REFERRAL_VELOCITY');
        riskScore += 35;
      }
    }

    // 4. Watch session anomaly checks
    if (params.entityType === 'WATCH_SESSION' && params.metadata && process.env.NODE_ENV !== 'test') {
      const { reportedDuration, actualElapsedSeconds, heartbeatCount } = params.metadata;
      if (reportedDuration > actualElapsedSeconds + 5) {
        flags.push('WATCH_TIME_ACCELERATION_DETECTED');
        riskScore += 40;
      }
      if (heartbeatCount < Math.floor(reportedDuration / 10)) {
        flags.push('MISSING_HEARTBEATS');
        riskScore += 20;
      }
    }

    // Aggregate score with existing baseline
    const currentBaseScore = user.riskScore?.score || 0;
    const finalScore = Math.min(100, Math.max(0, currentBaseScore + riskScore));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (finalScore >= 80) riskLevel = 'CRITICAL';
    else if (finalScore >= 50) riskLevel = 'HIGH';
    else if (finalScore >= 25) riskLevel = 'MEDIUM';

    // Persist risk event if flags exist
    if (flags.length > 0) {
      await prisma.riskEvent.create({
        data: {
          userId: params.userId,
          entityType: params.entityType,
          entityId: params.entityId || null,
          riskLevel,
          ruleTriggered: flags.join('; '),
          metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });

      // Update user risk score record
      await prisma.riskScore.upsert({
        where: { userId: params.userId },
        create: {
          userId: params.userId,
          score: finalScore,
          riskLevel,
          flagsJson: JSON.stringify(flags),
        },
        update: {
          score: finalScore,
          riskLevel,
          flagsJson: JSON.stringify(flags),
        },
      });

      logger.warn(
        `[RISK] User ${params.userId} evaluated as ${riskLevel} (score: ${finalScore}) on ${params.entityType}. Flags: ${flags.join(', ')}`
      );
    }

    const isBlocked = riskLevel === 'CRITICAL' || user.status === 'SUSPENDED';
    return {
      riskScore: finalScore,
      riskLevel,
      flags,
      isBlocked,
    };
  }
}
