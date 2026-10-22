import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Smartphone,
  Globe,
  Lock,
  Bot,
  LogOut,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { UserGameState } from '../../types/game.js';
import { sound } from '../../utils/audio.js';
import { TelegramService } from '../../utils/telegram.js';

interface SettingsModalProps {
  user: UserGameState;
  onClose: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onLinkAccount: (email: string, pass: string) => Promise<void>;
  onLogout: () => void;
  botUsername?: string;
  onOpenAdminSetup?: (tab?: 'webhook' | 'github') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onClose,
  isMuted,
  onToggleSound,
  onLinkAccount,
  onLogout,
  botUsername = 'FoxCoinOfficialBot',
  onOpenAdminSetup,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'telegram'>('general');
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkMsg, setLinkMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail || !linkPassword) return;

    try {
      setIsLinking(true);
      setLinkMsg(null);
      await onLinkAccount(linkEmail, linkPassword);
      setLinkMsg({ text: 'Account linked successfully! You can now log in anywhere.', isError: false });
    } catch (err: any) {
      setLinkMsg({ text: err.message || 'Failed to link account', isError: true });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm max-h-[90vh] flex flex-col bg-gradient-to-b from-[#151c2f] to-[#0b0e17] border border-slate-700 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-extrabold text-slate-100">Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 my-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'general' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'account' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('telegram')}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'telegram' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Bot Setup
          </button>
        </div>

        {/* Content area */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-3">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Sound FX</span>
                    <span className="text-[10px] text-slate-400">Taps, coins & level up chimes</span>
                  </div>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                    !isMuted
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {!isMuted ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Language Selector */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Language</span>
                    <span className="text-[10px] text-slate-400">Interface localization</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {['English', 'Español', 'Русский', '中文', 'Türkçe', "O'zbek"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`py-1 px-2 text-[11px] font-semibold rounded-lg border transition ${
                        language === lang
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-850 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telegram detection status */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Platform Environment</span>
                    <span className="text-[10px] text-slate-400">
                      {user.isTelegram ? 'Official Telegram WebApp Client' : 'Standalone Web Game Engine'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-3">
              {/* Account details */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Player ID</span>
                  <span className="font-mono text-slate-200">{user.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Type</span>
                  <span className="text-amber-300 font-bold">
                    {user.isTelegram ? 'Telegram Account' : user.isGuest ? 'Guest Session' : 'Email Account'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Total Coins Mined</span>
                  <span className="text-slate-200 font-bold">{Math.floor(user.totalEarned).toLocaleString()} FOX</span>
                </div>
              </div>

              {/* Link Account Form if guest */}
              {user.isGuest && (
                <form onSubmit={handleLink} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>Secure Your Guest Account</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Connect an email and password so your balance is preserved and accessible from any phone or computer.
                  </p>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="password"
                    placeholder="Choose password (min 6 characters)"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />

                  {linkMsg && (
                    <div className={`text-[11px] p-2 rounded-lg font-medium ${linkMsg.isError ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {linkMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLinking}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition active:scale-95 cursor-pointer"
                  >
                    {isLinking ? 'Linking...' : 'Save & Link Account'}
                  </button>
                </form>
              )}

              {/* Logout button */}
              <button
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/30 text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out / Switch Account</span>
              </button>
            </div>
          )}

          {activeTab === 'telegram' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                <div className="flex items-center gap-2 text-sky-400 font-bold mb-1">
                  <Bot className="w-4 h-4" />
                  <span>Telegram Bot Integration</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Fox Coin runs both in Telegram as a native Mini App and on web with one shared database, balance, and upgrades.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="font-bold text-amber-300 block">How to configure your Telegram Bot:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                  <li>
                    Open <strong className="text-sky-300">@BotFather</strong> in Telegram and send <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-400">/newbot</code>.
                  </li>
                  <li>
                    Name your bot: <strong className="text-white">Fox Coin</strong> and set a username like <strong className="text-white">FoxCoinOfficialBot</strong>.
                  </li>
                  <li>
                    Send <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-400">/newapp</code> to BotFather, choose your bot, and enter your deployed URL as the Web App URL.
                  </li>
                  <li>
                    Add your bot token to <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-400">.env</code> as <code className="text-white">TELEGRAM_BOT_TOKEN</code>.
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Launch URL</span>
                <code className="text-[10px] bg-slate-950 p-2 rounded-lg text-emerald-400 block break-all font-mono">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://foxcoin.game'}
                </code>
              </div>

              {/* Direct Webhook Admin Button */}
              {onOpenAdminSetup && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminSetup();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Configure Webhook Automatically (Admin)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
