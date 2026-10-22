import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Bot,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  KeyRound,
  ArrowLeft,
  Sparkles,
  Zap,
  Github,
  Cloud,
  UploadCloud,
  Check,
  FileCode,
  Smartphone,
  Play,
  Send,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api.js';
import { UserGameState, AdminTelegramConfigResponse } from '../types/game.js';
import { sound } from '../utils/audio.js';

interface AdminTelegramSetupProps {
  user: UserGameState | null;
  onClose: () => void;
  initialTab?: 'webhook' | 'github';
}

export const AdminTelegramSetup: React.FC<AdminTelegramSetupProps> = ({ user, onClose, initialTab = 'webhook' }) => {
  const [adminSecret, setAdminSecret] = useState<string>('123456');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(!!user?.isAdmin);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tab: 'webhook' or 'github'
  const [activeTab, setActiveTab] = useState<'webhook' | 'github'>(initialTab);

  // Telegram Form states
  const [botToken, setBotToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [secretToken, setSecretToken] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);

  // 1-Click Automatic Bot Setup states
  const [autoTokenInput, setAutoTokenInput] = useState<string>('');
  const [isAutoSettingUp, setIsAutoSettingUp] = useState<boolean>(false);
  const [autoSetupResult, setAutoSetupResult] = useState<{
    botUsername: string;
    botFirstName?: string;
    appUrl: string;
    webhookUrl: string;
    telegramLink: string;
    description: string;
  } | null>(null);

  // GitHub Form states
  const [githubToken, setGithubToken] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('fox_github_pat') || '' : '';
  });
  const [showGithubToken, setShowGithubToken] = useState<boolean>(false);
  const [githubRepoName, setGithubRepoName] = useState<string>('fox-coinl');
  const [githubIsPrivate, setGithubIsPrivate] = useState<boolean>(false);
  const [githubCommitMsg, setGithubCommitMsg] = useState<string>('Fox Coin — Telegram Mini App & Cloudflare Pages Ready');
  const [isUploadingGithub, setIsUploadingGithub] = useState<boolean>(false);
  const [githubResult, setGithubResult] = useState<{
    repoUrl: string;
    fileCount: number;
    commitSha: string;
    repoFullName: string;
  } | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Status & loading states
  const [serverConfig, setServerConfig] = useState<AdminTelegramConfigResponse | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<'configure' | 'status' | 'delete' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Load server configuration if authorized
  const loadConfig = async (secret?: string) => {
    try {
      setIsLoadingConfig(true);
      const data = await api.getAdminTelegramConfig(secret || adminSecret);
      setServerConfig(data);
      if (data.suggestedWebhookUrl && !webhookUrl) {
        setWebhookUrl(data.webhookUrl || data.suggestedWebhookUrl);
      }
    } catch (err: any) {
      console.error('Failed to load bot config:', err);
      if (err.message?.includes('Forbidden')) {
        setIsAuthorized(false);
      }
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      setIsAuthorized(true);
      loadConfig();
    } else {
      const savedSecret = sessionStorage.getItem('fox_admin_secret') || '123456';
      if (savedSecret) {
        setAdminSecret(savedSecret);
        handleUnlockWithKey(savedSecret);
      }
    }
  }, [user]);

  const handleUnlockWithKey = async (secretToVerify?: string) => {
    const key = secretToVerify || adminSecret;
    if (!key.trim()) {
      setAuthError('Please enter the Admin Master Secret Key');
      return;
    }

    try {
      setIsCheckingAuth(true);
      setAuthError(null);
      await api.verifyAdminAuth(key);
      setIsAuthorized(true);
      sessionStorage.setItem('fox_admin_secret', key);
      sound.playCoin();
      loadConfig(key);
    } catch (err: any) {
      setIsAuthorized(false);
      setAuthError(err.message || 'Invalid administrator key or unauthorized credentials');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleGenerateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let res = '';
    for (let i = 0; i < 32; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecretToken(res);
    sound.playTap();
  };

  const handleAutoSetup = async (tokenOverride?: string) => {
    const token = (tokenOverride || autoTokenInput || botToken).trim();
    if (!token) {
      setNotification({
        type: 'error',
        message: 'Please enter or paste your Telegram Bot Token from @BotFather',
      });
      return;
    }

    try {
      setIsAutoSettingUp(true);
      setNotification(null);
      sound.playTap();

      const res = await api.autoSetupTelegramBot(token, adminSecret);
      sound.playLevelUp();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#38BDF8'],
      });

      setAutoSetupResult(res);
      setNotification({
        type: 'success',
        message: `🎉 Bot activated! Webhook, Mini App Menu Button, and Commands are live on @${res.botUsername}!`,
      });
      setAutoTokenInput('');
      setBotToken('');
      loadConfig();
    } catch (err: any) {
      sound.playError();
      setNotification({
        type: 'error',
        message: err.message || 'Auto-setup failed. Please check your bot token.',
      });
    } finally {
      setIsAutoSettingUp(false);
    }
  };

  const handleConfigureWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!webhookUrl || !webhookUrl.startsWith('https://')) {
      setNotification({ type: 'error', message: 'Webhook URL must use secure HTTPS protocol' });
      return;
    }

    try {
      setActionLoading('configure');
      sound.playTap();
      const res = await api.setAdminWebhook(
        {
          botToken: botToken.trim() || undefined,
          webhookUrl: webhookUrl.trim(),
          secretToken: secretToken.trim() || undefined,
          saveToken: true,
        },
        adminSecret
      );

      sound.playLevelUp();
      setNotification({
        type: 'success',
        message: `Success! ${res.description}. Bot: @${res.botUsername || 'configured'}`,
      });
      setBotToken('');
      loadConfig();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to register webhook with Telegram' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckStatus = async () => {
    setNotification(null);
    try {
      setActionLoading('status');
      sound.playTap();
      const res = await api.checkAdminWebhookStatus(botToken.trim() || undefined, adminSecret);
      sound.playCoin();
      setServerConfig((prev) => (prev ? { ...prev, webhookInfo: res.info } : prev));
      setNotification({
        type: 'success',
        message: `Webhook Status: ${res.info.url ? 'Connected to ' + res.info.url : 'No webhook currently registered'}`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to check status with Telegram' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteWebhook = async () => {
    setNotification(null);
    setShowDeleteConfirm(false);
    try {
      setActionLoading('delete');
      sound.playTap();
      const res = await api.deleteAdminWebhook(true, botToken.trim() || undefined, adminSecret);
      sound.playCoin();
      setNotification({ type: 'success', message: res.description || 'Webhook was deleted successfully' });
      loadConfig();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete webhook' });
    } finally {
      setActionLoading(null);
    }
  };

  // GitHub Automatic Upload Handler
  const handleUploadToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setGithubError(null);
    setGithubResult(null);

    if (!githubToken.trim()) {
      setGithubError('Please enter your GitHub Personal Access Token (PAT)');
      return;
    }
    if (!githubRepoName.trim()) {
      setGithubError('Please enter a repository name');
      return;
    }

    try {
      setIsUploadingGithub(true);
      sound.playTap();
      if (typeof window !== 'undefined') {
        localStorage.setItem('fox_github_pat', githubToken.trim());
      }

      const res = await api.uploadToGitHub(
        {
          token: githubToken.trim(),
          repoName: githubRepoName.trim(),
          isPrivate: githubIsPrivate,
          commitMessage: githubCommitMsg.trim() || undefined,
        },
        adminSecret
      );

      sound.playLevelUp();
      setGithubResult({
        repoUrl: res.repoUrl,
        fileCount: res.fileCount,
        commitSha: res.commitSha,
        repoFullName: res.repoFullName,
      });
    } catch (err: any) {
      setGithubError(err.message || 'Failed to upload project to GitHub');
    } finally {
      setIsUploadingGithub(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-gradient-to-b from-[#141b2d] via-[#0f1422] to-[#0b0e17] border border-amber-500/40 rounded-3xl p-5 shadow-2xl text-white relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-100">Fox Coin Admin Center</h3>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black rounded">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Telegram Webhooks & GitHub Cloudflare Deploy</p>
            </div>
          </div>

          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Lock barrier if not authorized */}
        {!isAuthorized ? (
          <div className="py-6 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-7 h-7" />
            </div>

            <h4 className="font-black text-base text-slate-100">Administrator Access Required</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
              Bot token, webhooks, and GitHub export are restricted to authorized administrators.
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="Enter ADMIN_SECRET (default: 123456)"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-center font-mono"
              />

              {authError && (
                <div className="p-2 text-xs text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-xl">
                  {authError}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleUnlockWithKey()}
                disabled={isCheckingAuth}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                {isCheckingAuth ? 'Verifying...' : 'Unlock Admin Setup'}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-3 space-y-4">
            {/* Top Tabs: Webhook Setup vs GitHub Upload */}
            <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('webhook')}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'webhook'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Telegram Webhook</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('github')}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'github'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>Upload to GitHub</span>
              </button>
            </div>

            {/* TAB 1: TELEGRAM WEBHOOK */}
            {activeTab === 'webhook' && (
              <div className="space-y-4">
                {/* Notification alert */}
                {notification && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      notification.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {notification.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span className="flex-1 leading-snug">{notification.message}</span>
                  </div>
                )}

                {/* Current Status Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Webhook Status
                    </span>
                    {serverConfig?.isConfigured ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        NOT REGISTERED
                      </span>
                    )}
                  </div>

                  {serverConfig?.botUsername && (
                    <div className="flex justify-between py-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Telegram Bot</span>
                      <a
                        href={`https://t.me/${serverConfig.botUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        @{serverConfig.botUsername}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {serverConfig?.webhookInfo?.url && (
                    <div className="flex flex-col py-1 border-t border-slate-800/80">
                      <span className="text-slate-400 text-[10px]">Registered Webhook URL</span>
                      <span className="text-emerald-400 font-mono text-[11px] break-all mt-0.5">
                        {serverConfig.webhookInfo.url}
                      </span>
                    </div>
                  )}

                  {serverConfig?.webhookInfo?.pendingUpdateCount !== undefined && (
                    <div className="flex justify-between py-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Pending Updates</span>
                      <span className="text-slate-200 font-bold">
                        {serverConfig.webhookInfo.pendingUpdateCount}
                      </span>
                    </div>
                  )}

                  {serverConfig?.webhookInfo?.lastErrorMessage && (
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                      <strong>Last Error:</strong> {serverConfig.webhookInfo.lastErrorMessage}
                    </div>
                  )}
                </div>

                {/* 1-CLICK AUTOMATIC BOT SETUP & MINI APP LAUNCH */}
                <div className="bg-gradient-to-br from-amber-500/20 via-slate-900 to-sky-950/40 border-2 border-amber-500/60 rounded-3xl p-4 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Zap className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                          <span>1-Click Automatic Bot Setup</span>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">AUTO</span>
                        </h4>
                        <span className="text-[10px] text-slate-400">Instant webhook + Mini App Menu Button</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 mb-3 leading-relaxed">
                    Paste your Telegram Bot Token from <strong className="text-sky-400">@BotFather</strong>. The app automatically registers the webhook, equips the bot with the <strong>"Play FOXCOIN 🦊"</strong> Mini App launch button, and starts the bot!
                  </p>

                  {/* Auto Token Input with Instant Paste */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Paste Bot Token (e.g. 123456789:AAH...)"
                        value={autoTokenInput}
                        onChange={(e) => setAutoTokenInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/90 rounded-2xl px-3.5 py-3 pr-20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const clip = await navigator.clipboard.readText();
                            if (clip && clip.trim()) {
                              setAutoTokenInput(clip.trim());
                              sound.playTap();
                            }
                          } catch {}
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold text-[11px] rounded-xl border border-slate-700 transition cursor-pointer"
                      >
                        Paste
                      </button>
                    </div>

                    {/* Primary 1-Click Launch Button */}
                    <button
                      type="button"
                      onClick={() => handleAutoSetup()}
                      disabled={isAutoSettingUp}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-amber-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300 disabled:opacity-50"
                    >
                      {isAutoSettingUp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Activating Bot & Mini App...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                          <span>Activate Bot & Launch Mini App</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Success Celebration Card with Direct Links */}
                  {autoSetupResult && (
                    <div className="mt-3.5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-400 font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Bot & Mini App are Live!</span>
                      </div>

                      <div className="text-[11px] text-slate-300 space-y-1 pt-1 border-t border-emerald-900/60">
                        <div>• <strong>Bot Handle:</strong> <span className="text-sky-300 font-bold">@{autoSetupResult.botUsername}</span></div>
                        <div>• <strong>Webhook:</strong> <span className="text-emerald-300">Active & Connected</span></div>
                        <div>• <strong>Menu Button:</strong> <span className="text-emerald-300">"Play FOXCOIN 🦊" Configured</span></div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <a
                          href={autoSetupResult.telegramLink}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/30 transition text-center cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Open Bot</span>
                        </a>
                        <a
                          href={autoSetupResult.appUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/30 transition text-center cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Launch App</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Manual Settings Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    or custom manual configuration
                  </span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                {/* Webhook Configuration Form */}
                <form onSubmit={handleConfigureWebhook} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-sky-400" />
                        <span>Telegram Bot Token</span>
                      </label>
                      {serverConfig?.hasToken && (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          ✓ Stored ({serverConfig.maskedToken})
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        placeholder={serverConfig?.hasToken ? 'Enter new token to replace existing' : 'e.g. 123456789:AAH...'}
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1 mb-1">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Production Webhook URL (HTTPS)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-domain.app/api/telegram/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Webhook Secret Token (Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateSecret}
                        className="text-[10px] text-amber-400 hover:underline font-bold"
                      >
                        Generate Random
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        placeholder="X-Telegram-Bot-Api-Secret-Token (1-256 chars)"
                        value={secretToken}
                        onChange={(e) => setSecretToken(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={actionLoading !== null}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>{actionLoading === 'configure' ? 'Registering with Telegram...' : 'Configure Webhook'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleCheckStatus}
                        disabled={actionLoading !== null}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'status' ? 'animate-spin text-amber-400' : ''}`} />
                        <span>Check Status</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={actionLoading !== null || !serverConfig?.isConfigured}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Webhook</span>
                      </button>
                    </div>
                  </div>
                </form>

                {showDeleteConfirm && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 space-y-2.5 text-xs animate-fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-rose-300">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Confirm Webhook Deletion</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Are you sure you want to delete the active Telegram webhook? Telegram will stop routing bot updates to this server.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDeleteWebhook}
                        disabled={actionLoading === 'delete'}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-lg transition"
                      >
                        {actionLoading === 'delete' ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GITHUB & CLOUDFLARE UPLOAD */}
            {activeTab === 'github' && (
              <div className="space-y-3.5">
                {/* Cloudflare banner */}
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs">
                  <div className="flex items-center gap-2 text-sky-400 font-bold mb-1">
                    <Cloud className="w-4 h-4" />
                    <span>Cloudflare Pages & GitHub Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Automatically create a GitHub repository and push all Fox Coin files, Cloudflare Pages functions (<code className="text-amber-400">functions/api</code>), and <code className="text-amber-400">wrangler.toml</code>.
                  </p>
                </div>

                {/* 1-Click ZIP Download Alternative */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-300 text-[11px] flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Option A: Direct Project Download</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                      Guaranteed 100%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    If you don't have a GitHub token or encounter any token permission error, download the clean project archive (.ZIP) and drag it into GitHub or Cloudflare Pages:
                  </p>
                  <a
                    href={api.getProjectZipDownloadUrl(adminSecret)}
                    download="foxcoin-project-cloudflare.zip"
                    className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md text-center cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>Download Project (.ZIP) Archive</span>
                  </a>
                </div>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Option B: 1-Click GitHub API Push
                  </span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                {/* Success Card */}
                {githubResult && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Uploaded Successfully to GitHub!</span>
                    </div>
                    <p className="text-[11px] text-slate-200">
                      Uploaded <strong>{githubResult.fileCount} project files</strong> directly to branch <strong>main</strong>.
                    </p>
                    <div className="pt-1 flex flex-col gap-1.5">
                      <a
                        href={githubResult.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition text-center"
                      >
                        <Github className="w-4 h-4" />
                        <span>Open GitHub Repository ({githubResult.repoFullName})</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href="https://dash.cloudflare.com/?to=/:account/pages/new"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition text-center"
                      >
                        <Cloud className="w-4 h-4 text-orange-400" />
                        <span>Deploy in 1-Click on Cloudflare Pages</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Error Card */}
                {githubError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs space-y-1.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <span className="font-bold">{githubError}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 pl-6 space-y-1">
                      <p>
                        💡 <strong>How to fix:</strong> GitHub requires a <strong>Classic Token</strong> with the <code className="text-amber-300 font-mono">repo</code> scope checked.
                      </p>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=FoxCoinMiniApp"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 underline font-bold inline-flex items-center gap-1"
                      >
                        <span>Click here to create a token with 'repo' scope pre-selected</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Upload Form */}
                <form onSubmit={handleUploadToGitHub} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>GitHub Personal Access Token (PAT)</span>
                      </label>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=FoxCoinMiniApp"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        <span>Create Token with 'repo' scope</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showGithubToken ? 'text' : 'password'}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGithubToken(!showGithubToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showGithubToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-amber-400/90 mt-1 block">
                      ⚠️ Must be a Classic token with <code className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">repo</code> checkbox enabled.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1 mb-1">
                      <Github className="w-3.5 h-3.5 text-slate-300" />
                      <span>Repository Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="fox-coin"
                      value={githubRepoName}
                      onChange={(e) => setGithubRepoName(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-300 font-medium">Repository Visibility</span>
                    <button
                      type="button"
                      onClick={() => setGithubIsPrivate(!githubIsPrivate)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        githubIsPrivate
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {githubIsPrivate ? 'Private' : 'Public'}
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1">
                      Commit Message
                    </label>
                    <input
                      type="text"
                      value={githubCommitMsg}
                      onChange={(e) => setGithubCommitMsg(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingGithub}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploadingGithub ? 'Uploading Project to GitHub...' : '🚀 Automatic Upload to GitHub'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
