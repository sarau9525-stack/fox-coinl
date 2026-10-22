import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, CheckCircle2, Sparkles, Send, Gift, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserGameState } from '../types/game.js';
import { api } from '../utils/api.js';
import { sound } from '../utils/audio.js';
import { TelegramService } from '../utils/telegram.js';
import { foxMascotImg, foxGoldCoinImg } from '../assets/assets.js';

interface MandatoryChannelGateProps {
  user: UserGameState;
  onVerified: (updatedUser: UserGameState) => void;
  channelHandle?: string;
}

export const MandatoryChannelGate: React.FC<MandatoryChannelGateProps> = ({
  user,
  onVerified,
  channelHandle = '@FoxCoinOfficial',
}) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasClickedJoin, setHasClickedJoin] = useState<boolean>(false);

  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const channelUrl = `https://t.me/${cleanHandle.replace('@', '')}`;

  const handleOpenChannel = () => {
    sound.playTap();
    TelegramService.triggerHaptic('medium');
    setHasClickedJoin(true);
    TelegramService.openLink(channelUrl);
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setErrorMsg(null);
      sound.playTap();
      TelegramService.triggerHaptic('medium');

      const res = await api.verifyChannelMembership();
      if (res && res.user) {
        sound.playSuccess();
        TelegramService.triggerNotificationHaptic('success');
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#F97316'],
        });

        const bonusText = res.bonus ? ` +${res.bonus.toLocaleString()} FOX Bonus awarded!` : '';
        setSuccessMsg(`Channel membership confirmed!${bonusText} Welcome aboard!`);

        // Save local verification flag as well
        localStorage.setItem(`fox_channel_verified_${user.id}`, 'true');

        setTimeout(() => {
          onVerified(res.user);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          `Please make sure you have joined ${cleanHandle} on Telegram before tapping Verify!`
      );
      sound.playError();
      TelegramService.triggerNotificationHaptic('error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#151c2f] via-[#101626] to-[#0b0e17] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Mascot badge */}
        <div className="w-20 h-20 mx-auto -mt-2 mb-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-0.5 shadow-xl shadow-orange-500/30">
          <div className="w-full h-full bg-[#111827] rounded-[14px] overflow-hidden flex items-center justify-center">
            <img src={foxMascotImg} alt="FOX" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider mb-2">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Mandatory Membership Gate</span>
          </div>

          <h3 className="text-xl font-black text-slate-100 leading-tight">
            Join Our Official Channel
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
            To activate your FOX mining rewards, access the referral bonus exchange, and withdraw USDT, you must join the official channel first!
          </p>
        </div>

        {/* Reward Bonus Pill */}
        <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/50 rounded-2xl p-3 mb-4 flex items-center justify-between shadow-md shadow-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Verification Bounty
              </span>
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>+2,000 FOX Welcome Gift</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-black text-amber-400">
            <img src={foxGoldCoinImg} alt="FOX" className="w-4 h-4" />
            <span>+2,000</span>
          </div>
        </div>

        {/* Action Steps */}
        <div className="space-y-2.5 mb-4">
          {/* Step 1: Join button */}
          <button
            onClick={handleOpenChannel}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition active:scale-95 flex items-center justify-between cursor-pointer border ${
              hasClickedJoin
                ? 'bg-sky-950/80 border-sky-500/60 text-sky-200'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white border-sky-400 shadow-lg shadow-sky-600/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>Step 1: Join {cleanHandle}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </button>

          {/* Step 2: Verify button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-amber-500/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Verifying Channel Membership...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Step 2: Verify & Unlock App</span>
              </>
            )}
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-[11px] font-bold flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="text-center pt-2">
          <span className="text-[10px] text-slate-500 font-semibold">
            Official Telegram Community • Guaranteed Safe & Instant
          </span>
        </div>
      </div>
    </div>
  );
};
