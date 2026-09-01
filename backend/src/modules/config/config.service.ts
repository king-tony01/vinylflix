import { prisma } from '../../prisma/client.js';
import { config } from '../../config/index.js';
import { AuditService } from '../audit/audit.service.js';

export class ConfigService {
  private static cache: Map<string, any> = new Map();
  private static lastFetch = 0;
  private static CACHE_TTL = 30000; // 30 seconds

  public static async get<T = any>(key: string, defaultValue: T): Promise<T> {
    const now = Date.now();
    if (this.cache.has(key) && now - this.lastFetch < this.CACHE_TTL) {
      return this.cache.get(key);
    }

    const record = await prisma.platformConfig.findUnique({
      where: { key },
    });

    if (record) {
      try {
        const val = JSON.parse(record.valueJson);
        this.cache.set(key, val);
        return val as T;
      } catch {
        return defaultValue;
      }
    }

    return defaultValue;
  }

  public static async set(
    key: string,
    value: any,
    description?: string,
    adminId?: string
  ): Promise<void> {
    const previous = await prisma.platformConfig.findUnique({ where: { key } });
    const prevValue = previous ? JSON.parse(previous.valueJson) : null;

    const valueJson = JSON.stringify(value);

    await prisma.platformConfig.upsert({
      where: { key },
      create: {
        key,
        valueJson,
        description: description || `Configuration for ${key}`,
        updatedById: adminId,
      },
      update: {
        valueJson,
        description: description || undefined,
        updatedById: adminId,
      },
    });

    this.cache.set(key, value);

    await AuditService.log({
      actorId: adminId,
      action: 'CONFIG_UPDATED',
      targetType: 'PLATFORM_CONFIG',
      targetId: key,
      previousState: prevValue,
      newState: value,
      reason: `Updated platform configuration for ${key}`,
    });
  }

  public static async getAllConfigs() {
    return prisma.platformConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  public static async getBusinessRules() {
    return {
      currency: await this.get('DEFAULT_CURRENCY', config.businessDefaults.currency),
      membershipPrice: await this.get('DEFAULT_MEMBERSHIP_PRICE', config.businessDefaults.membershipPrice),
      conditionalReward: await this.get('DEFAULT_CONDITIONAL_REWARD', config.businessDefaults.conditionalReward),
      referralRequirement: await this.get('DEFAULT_REFERRAL_REQUIREMENT', config.businessDefaults.referralRequirement),
      minWithdrawalAmount: await this.get('DEFAULT_MIN_WITHDRAWAL_AMOUNT', config.businessDefaults.minWithdrawalAmount),
      minWatchDurationSeconds: await this.get('DEFAULT_MIN_WATCH_DURATION', config.businessDefaults.minWatchDurationSeconds),
      watchRewardAmount: await this.get('DEFAULT_WATCH_REWARD_AMOUNT', config.businessDefaults.watchRewardAmount),
      platformFeePercent: await this.get('PLATFORM_FEE_PERCENT', 5.0),
    };
  }
}
