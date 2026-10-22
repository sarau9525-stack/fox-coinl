import { UserGameState, LeaderboardEntry, UpgradeDefinition, TaskDefinition, DailyRewardDay, TradeOrder } from '../types/game.js';

const TOKEN_KEY = 'foxcoin_auth_token';

export interface GameConfig {
  upgrades: UpgradeDefinition[];
  levels: Array<{ level: number; name: string; minCoins: number; badge: string }>;
  tasks: TaskDefinition[];
  dailyRewards: DailyRewardDay[];
  constants: {
    STARTING_BALANCE: number;
    STARTING_ENERGY: number;
    BASE_MAX_ENERGY: number;
    BASE_TAP_POWER: number;
    BASE_ENERGY_REGEN_PER_SEC: number;
    ENERGY_COST_PER_TAP: number;
    MAX_OFFLINE_HOURS: number;
    MAX_TAPS_PER_SECOND: number;
    REFERRAL_INVITER_BONUS: number;
    REFERRAL_INVITEE_BONUS: number;
    TURBO_MULTIPLIER: number;
    TURBO_DURATION_MS: number;
  };
  telegramBotUsername: string;
}

class ApiService {
  private token: string | null = null;
  private pendingTapCount: number = 0;
  private tapBatchTimer: NodeJS.Timeout | null = null;
  private isFlushingTaps: boolean = false;
  private onStateUpdated?: (state: UserGameState) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public registerStateListener(cb: (state: UserGameState) => void) {
    this.onStateUpdated = cb;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error occurred');
    }

    return data as T;
  }

  public async getConfig(): Promise<GameConfig> {
    return this.request<GameConfig>('/api/game/config');
  }

  public async authTelegram(initData: string, refCode?: string): Promise<{ token: string; user: UserGameState }> {
    const res = await this.request<{ token: string; user: UserGameState }>('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData, refCode }),
    });
    this.setToken(res.token);
    return res;
  }

  public async authGuest(username?: string, refCode?: string): Promise<{ token: string; user: UserGameState }> {
    const res = await this.request<{ token: string; user: UserGameState }>('/api/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ username, refCode }),
    });
    this.setToken(res.token);
    return res;
  }

  public async authRegister(email: string, pass: string, username?: string, refCode?: string): Promise<{ token: string; user: UserGameState }> {
    const res = await this.request<{ token: string; user: UserGameState }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, username, refCode }),
    });
    this.setToken(res.token);
    return res;
  }

  public async authLogin(email: string, pass: string): Promise<{ token: string; user: UserGameState }> {
    const res = await this.request<{ token: string; user: UserGameState }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: UserGameState }> {
    return this.request<{ user: UserGameState }>('/api/auth/me');
  }

  public async linkAccount(email: string, pass: string): Promise<{ success: boolean; user: UserGameState }> {
    return this.request<{ success: boolean; user: UserGameState }>('/api/auth/link', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
  }

  // Queue and batch taps to provide instant responsive client experience while remaining 100% server-authoritative
  public queueTap(count: number = 1) {
    this.pendingTapCount += count;

    if (this.tapBatchTimer) {
      clearTimeout(this.tapBatchTimer);
    }

    // Flush batch after short idle or limit
    if (this.pendingTapCount >= 20) {
      this.flushTaps();
    } else {
      this.tapBatchTimer = setTimeout(() => {
        this.flushTaps();
      }, 400);
    }
  }

  public async flushTaps(): Promise<UserGameState | null> {
    if (this.pendingTapCount <= 0 || this.isFlushingTaps) return null;

    const countToSend = this.pendingTapCount;
    this.pendingTapCount = 0;
    this.isFlushingTaps = true;

    try {
      const res = await this.request<{ user: UserGameState }>('/api/game/tap', {
        method: 'POST',
        body: JSON.stringify({ tapCount: countToSend }),
      });

      if (this.onStateUpdated && res.user) {
        this.onStateUpdated(res.user);
      }
      return res.user;
    } catch (err) {
      console.error('Failed to flush taps to server:', err);
      // Re-fetch current authoritative state
      try {
        const me = await this.getMe();
        if (this.onStateUpdated) this.onStateUpdated(me.user);
      } catch {}
      return null;
    } finally {
      this.isFlushingTaps = false;
      // If new taps arrived while request was in-flight, flush them
      if (this.pendingTapCount > 0) {
        this.flushTaps();
      }
    }
  }

  public async purchaseUpgrade(upgradeId: string): Promise<UserGameState> {
    // Flush any pending taps first so server has correct balance
    if (this.pendingTapCount > 0) {
      await this.flushTaps();
    }

    const res = await this.request<{ user: UserGameState }>('/api/game/upgrade', {
      method: 'POST',
      body: JSON.stringify({ upgradeId }),
    });

    if (this.onStateUpdated && res.user) {
      this.onStateUpdated(res.user);
    }
    return res.user;
  }

  public async claimPassive(): Promise<{ user: UserGameState; claimedAmount: number }> {
    const res = await this.request<{ user: UserGameState; claimedAmount: number }>('/api/game/claim-passive', {
      method: 'POST',
    });

    if (this.onStateUpdated && res.user) {
      this.onStateUpdated(res.user);
    }
    return res;
  }

  public async claimDaily(): Promise<{ user: UserGameState; rewardAmount: number }> {
    const res = await this.request<{ user: UserGameState; rewardAmount: number }>('/api/game/claim-daily', {
      method: 'POST',
    });

    if (this.onStateUpdated && res.user) {
      this.onStateUpdated(res.user);
    }
    return res;
  }

  public async claimTask(taskId: string): Promise<{ user: UserGameState; reward: number }> {
    const res = await this.request<{ user: UserGameState; reward: number }>('/api/game/claim-task', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    });

    if (this.onStateUpdated && res.user) {
      this.onStateUpdated(res.user);
    }
    return res;
  }

  public async useBooster(type: 'full_energy' | 'turbo'): Promise<UserGameState> {
    const res = await this.request<{ user: UserGameState }>('/api/game/boost', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });

    if (this.onStateUpdated && res.user) {
      this.onStateUpdated(res.user);
    }
    return res.user;
  }

  public async getLeaderboard(limit = 50): Promise<{ list: LeaderboardEntry[]; playerEntry?: LeaderboardEntry }> {
    return this.request<{ list: LeaderboardEntry[]; playerEntry?: LeaderboardEntry }>(`/api/game/leaderboard?limit=${limit}`);
  }

  // --- Referral 10-Friend Milestone Claim ---
  public async claimMilestone(): Promise<{ user: UserGameState; claimedCount: number; bonus: number }> {
    const res = await this.request<{ user: UserGameState; claimedCount: number; bonus: number }>('/api/friends/claim-milestone', {
      method: 'POST',
    });

    if (this.onStateUpdated && res.user) {
      this.onStateUpdated(res.user);
    }
    return res;
  }

  // --- Mandatory Telegram Channel Membership Verification ---
  public async verifyChannelMembership(): Promise<{ success: boolean; user: UserGameState; bonus?: number }> {
    const res = await this.request<{ success: boolean; user: UserGameState; bonus?: number }>('/api/telegram/verify-channel', {
      method: 'POST',
    });

    if (this.onStateUpdated && res.user) {
      this.onStateUpdated(res.user);
    }
    return res;
  }

  // --- Exchange / Trade APIs ---
  public async createTrade(params: {
    foxAmount: number;
    usdAmount: number;
    walletAddress: string;
    network: string;
  }): Promise<{ success: boolean; trade: TradeOrder; user: UserGameState }> {
    // Flush any pending taps first so server has correct balance
    if (this.pendingTapCount > 0) {
      await this.flushTaps();
    }

    const res = await this.request<{ success: boolean; trade: TradeOrder; user: UserGameState }>('/api/trade/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (this.onStateUpdated && res.user) {
      this.onStateUpdated(res.user);
    }
    return res;
  }

  public async getTrades(): Promise<{ trades: TradeOrder[] }> {
    return this.request<{ trades: TradeOrder[] }>('/api/trade/list');
  }

  // --- Admin Telegram Bot Webhook Management ---

  public async verifyAdminAuth(adminSecret?: string): Promise<{ isAdmin: boolean }> {
    const headers: Record<string, string> = {};
    if (adminSecret) headers['x-admin-secret'] = adminSecret;
    return this.request<{ isAdmin: boolean }>('/api/admin/auth/verify', { headers });
  }

  public async getAdminTelegramConfig(adminSecret?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (adminSecret) headers['x-admin-secret'] = adminSecret;
    return this.request('/api/admin/telegram/config', { headers });
  }

  public async checkAdminWebhookStatus(botToken?: string, adminSecret?: string): Promise<{ success: boolean; info: any }> {
    const headers: Record<string, string> = {};
    if (adminSecret) headers['x-admin-secret'] = adminSecret;
    return this.request('/api/admin/telegram/status', {
      method: 'POST',
      headers,
      body: JSON.stringify({ botToken }),
    });
  }

  public async autoSetupTelegramBot(
    botToken: string,
    adminSecret?: string
  ): Promise<{
    success: boolean;
    description: string;
    botUsername: string;
    botFirstName?: string;
    appUrl: string;
    webhookUrl: string;
    telegramLink: string;
  }> {
    const headers: Record<string, string> = {};
    if (adminSecret) headers['x-admin-secret'] = adminSecret;
    return this.request('/api/admin/telegram/auto-setup', {
      method: 'POST',
      headers,
      body: JSON.stringify({ botToken }),
    });
  }

  public async setAdminWebhook(
    params: { botToken?: string; webhookUrl: string; secretToken?: string; saveToken?: boolean },
    adminSecret?: string
  ): Promise<{ success: boolean; description: string; botUsername?: string; webhookUrl: string }> {
    const headers: Record<string, string> = {};
    if (adminSecret) headers['x-admin-secret'] = adminSecret;
    return this.request('/api/admin/telegram/set-webhook', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  }

  public async deleteAdminWebhook(
    confirm: boolean,
    botToken?: string,
    adminSecret?: string
  ): Promise<{ success: boolean; description: string }> {
    const headers: Record<string, string> = {};
    if (adminSecret) headers['x-admin-secret'] = adminSecret;
    return this.request('/api/admin/telegram/delete-webhook', {
      method: 'POST',
      headers,
      body: JSON.stringify({ confirm, botToken }),
    });
  }

  public async uploadToGitHub(
    params: { token: string; repoName: string; isPrivate?: boolean; commitMessage?: string },
    adminSecret?: string
  ): Promise<{ success: boolean; repoUrl: string; repoFullName: string; commitSha: string; fileCount: number }> {
    const headers: Record<string, string> = {};
    if (adminSecret) headers['x-admin-secret'] = adminSecret;
    return this.request('/api/admin/github/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  }

  public getProjectZipDownloadUrl(adminSecret?: string): string {
    const secret = adminSecret || '123456';
    return `/api/admin/project/download-zip?secret=${encodeURIComponent(secret)}`;
  }
}

export const api = new ApiService();
