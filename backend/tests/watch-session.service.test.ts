import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/prisma/client.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { WatchSessionService } from '../src/modules/watch-sessions/watch-session.service.js';
import { CampaignService } from '../src/modules/campaigns/campaign.service.js';
import { MembershipService } from '../src/modules/memberships/membership.service.js';

describe('WatchSessionService - Anti-Cheat & Rewarded Viewing Engine', () => {
  let creatorUserId: string;
  let paidUserId: string;
  let freeUserId: string;
  let videoId: string;
  let campaignId: string;
  let planId: string;
  let creatorPlanId: string;

  beforeAll(async () => {
    // 1. Create membership plans (internal test plans, isActive: false)
    const plan = await prisma.membershipPlan.create({
      data: {
        name: `Watch Test Plan ${Date.now()}`,
        tier: `PAID_WATCH_${Date.now()}`,
        price: 3000,
        currency: 'NGN',
        benefitsJson: JSON.stringify(['Reward eligibility']),
        isActive: false,
      },
    });
    planId = plan.id;

    const creatorPlan = await prisma.membershipPlan.upsert({
      where: { tier: 'CREATOR' },
      create: {
        name: 'Creator / Advertiser Tier',
        tier: 'CREATOR',
        price: 15000,
        currency: 'NGN',
        benefitsJson: JSON.stringify(['Campaign creation']),
        isActive: true,
      },
      update: {},
    });
    creatorPlanId = creatorPlan.id;

    // 2. Create creator user, paid viewer, and free viewer
    const creatorUser = await AuthService.register({
      email: `creator_${Date.now()}@platform.internal`,
      username: `creator_${Date.now()}`,
      password: 'Password123!',
    });
    creatorUserId = creatorUser.user.id;
    await MembershipService.activateMembership(creatorUserId, creatorPlanId);

    const paidUser = await AuthService.register({
      email: `paid_viewer_${Date.now()}@platform.internal`,
      username: `paid_viewer_${Date.now()}`,
      password: 'Password123!',
    });
    paidUserId = paidUser.user.id;
    await MembershipService.activateMembership(paidUserId, planId);

    const freeUser = await AuthService.register({
      email: `free_viewer_${Date.now()}@platform.internal`,
      username: `free_viewer_${Date.now()}`,
      password: 'Password123!',
    });
    freeUserId = freeUser.user.id;

    // 3. Create video and campaign
    const video = await prisma.video.create({
      data: {
        youtubeVideoId: `yt_test_${Date.now()}`,
        title: 'Campaign Rewarded Video',
        durationSeconds: 120,
      },
    });
    videoId = video.id;

    const campaign = await CampaignService.createCampaign(creatorUserId, {
      videoId: video.id,
      title: 'Watch Reward Campaign',
    });
    campaignId = campaign.id;
  });

  afterAll(async () => {
    const userIds = [paidUserId, freeUserId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.ledgerEntry.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.reward.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (campaignId) {
      await prisma.watchSession.deleteMany({ where: { campaignId } });
      await prisma.campaign.deleteMany({ where: { id: campaignId } });
    }
    if (videoId) {
      await prisma.video.deleteMany({ where: { id: videoId } });
    }
    if (planId) {
      await prisma.membership.deleteMany({ where: { planId } });
      await prisma.membershipPlan.deleteMany({ where: { id: planId } });
    }
  });

  it('should prevent free tier users from earning monetary viewing rewards', async () => {
    const session = await WatchSessionService.startSession(freeUserId, videoId, campaignId);
    
    // Simulate heartbeats
    for (let i = 0; i < 4; i++) {
      await WatchSessionService.recordHeartbeat(session.sessionToken, i * 10, 'PLAYING');
    }

    const result = await WatchSessionService.completeSession(session.sessionToken, 35);
    expect(result.qualificationStatus).toBe('DISQUALIFIED');
    expect(result.rewardEarned).toBe(0);

    const wallet = await prisma.wallet.findUnique({ where: { userId: freeUserId } });
    expect(wallet?.availableBalance).toBe(0);
  });

  it('should qualify paid member session and issue server-calculated ₦5 reward', async () => {
    const initialCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    const initialRemaining = initialCampaign?.remainingBudget || 0;

    const session = await WatchSessionService.startSession(paidUserId, videoId, campaignId);

    // Simulate 50 seconds of verified playback (satisfying 45s min duration for 120s video)
    for (let i = 1; i <= 5; i++) {
      await WatchSessionService.recordHeartbeat(session.sessionToken, i * 10, 'PLAYING');
    }

    const result = await WatchSessionService.completeSession(session.sessionToken, 50);
    expect(result.qualificationStatus).toBe('REWARDED');
    expect(result.rewardEarned).toBe(5);

    // Verify wallet updated via ledger
    const wallet = await prisma.wallet.findUnique({ where: { userId: paidUserId } });
    expect(wallet?.availableBalance).toBe(5);

    // Verify campaign budget decremented
    const updatedCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    expect(updatedCampaign?.remainingBudget).toBe(initialRemaining - 5);
  });

  it('should enforce daily view limits per campaign', async () => {
    // 2nd view (limit is 2)
    const session2 = await WatchSessionService.startSession(paidUserId, videoId, campaignId);
    for (let i = 1; i <= 5; i++) {
      await WatchSessionService.recordHeartbeat(session2.sessionToken, i * 10, 'PLAYING');
    }
    const result2 = await WatchSessionService.completeSession(session2.sessionToken, 50);
    expect(result2.qualificationStatus).toBe('REWARDED');

    // 3rd view (exceeds daily limit of 2)
    const session3 = await WatchSessionService.startSession(paidUserId, videoId, campaignId);
    for (let i = 1; i <= 5; i++) {
      await WatchSessionService.recordHeartbeat(session3.sessionToken, i * 10, 'PLAYING');
    }
    const result3 = await WatchSessionService.completeSession(session3.sessionToken, 50);
    expect(result3.qualificationStatus).toBe('DISQUALIFIED');
    expect(result3.rewardEarned).toBe(0);
  });

  afterAll(async () => {
    try {
      await prisma.watchSession.deleteMany({ where: { videoId } });
      await prisma.reward.deleteMany({ where: { userId: paidUserId } });
      await prisma.ledgerEntry.deleteMany({ where: { userId: { in: [paidUserId, creatorUserId] } } });
      await prisma.campaign.deleteMany({ where: { id: campaignId } });
      await prisma.video.deleteMany({ where: { id: videoId } });
      await prisma.membership.deleteMany({ where: { planId: { in: [planId, creatorPlanId] } } });
      await prisma.membershipPlan.deleteMany({ where: { id: planId } });
      await prisma.wallet.deleteMany({ where: { userId: { in: [paidUserId, freeUserId, creatorUserId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [paidUserId, freeUserId, creatorUserId] } } });
    } catch {}
  });
});
