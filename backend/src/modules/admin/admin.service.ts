import { prisma } from '../../prisma/client.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ConfigService } from '../config/config.service.js';

export class AdminService {
  public static async getDashboardMetrics() {
    const [
      totalUsers,
      paidMembers,
      totalCampaigns,
      activeCampaigns,
      pendingWithdrawals,
      completedWithdrawals,
      rewardsAgg,
      paymentsAgg,
      riskAlertsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.membership.count({ where: { status: 'ACTIVE' } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.withdrawal.count({ where: { status: 'COMPLETED' } }),
      prisma.reward.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['AVAILABLE', 'LOCKED'] } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SETTLED' },
      }),
      prisma.riskEvent.count({
        where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        paidMembers,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
      },
      financials: {
        totalRevenue: paymentsAgg._sum.amount || 0,
        totalRewardsIssued: rewardsAgg._sum.amount || 0,
        pendingWithdrawalsCount: pendingWithdrawals,
        completedWithdrawalsCount: completedWithdrawals,
      },
      risk: {
        highRiskAlerts: riskAlertsCount,
      },
    };
  }

  public static async listUsers(query: { search?: string; role?: string; status?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { username: { contains: query.search } },
        { referralCode: { contains: query.search } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: query.limit || 30,
        skip: query.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          wallet: true,
          riskScore: true,
          memberships: { where: { status: 'ACTIVE' }, take: 1 },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  public static async updateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED',
    adminId: string,
    reason: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await AuditService.log({
      actorId: adminId,
      action: `USER_STATUS_${status}`,
      targetType: 'USER',
      targetId: userId,
      previousState: { status: user.status },
      newState: { status },
      reason,
    });

    return updated;
  }

  public static async reverseReward(rewardId: string, adminId: string, reason: string) {
    const updatedReward = await LedgerService.reverseReward(rewardId, adminId, reason);

    await AuditService.log({
      actorId: adminId,
      action: 'REWARD_REVERSED',
      targetType: 'REWARD',
      targetId: rewardId,
      reason,
    });

    return updatedReward;
  }

  public static async listPendingWithdrawals() {
    return prisma.withdrawal.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            riskScore: true,
          },
        },
      },
    });
  }

  public static async updatePlatformConfig(
    key: string,
    value: any,
    adminId: string,
    description?: string
  ) {
    await ConfigService.set(key, value, description, adminId);
    return { key, value };
  }
}
