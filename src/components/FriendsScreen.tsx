import React, { useState } from 'react';
import { Users, Copy, Check, Send, Gift, Sparkles, DollarSign, Award, ArrowRight } from 'lucide-react';
import { UserGameState } from '../types/game.js';
import { TelegramService } from '../utils/telegram.js';
import { sound } from '../utils/audio.js';
import { foxGoldCoinImg } from '../assets/assets.js';
import { api } from '../utils/api.js';

interface FriendsScreenProps {
  user: UserGameState;
  botUsername?: string;
  onTradeTab?: () => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({
  user,
  botUsername = 'FOXCOINBot',
  onTradeTab,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // Milestone calculations: 10 friends = 10,000 FOX ($10 USD)
  const currentCount = user.referralCount || 0;
  const milestonesAchieved = Math.floor(currentCount / 10);
  const claimedCount = user.claimedMilestones || 0;
  const unclaimedMilestones = Math.max(0, milestonesAchieved - claimedCount);
  const friendsProgress = currentCount % 10;
  const progressPercent = Math.min(100, (friendsProgress / 10) * 100);

  // Generate deep link and web link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://foxcoin.pages.dev';
  const cleanBot = botUsername.replace('@', '');
  const tgDeepLink = `https://t.me/${cleanBot}?start=ref_${user.referralCode}`;
  const webLink = `${origin}?ref=${user.referralCode}`;

  const shareText = `🦊 Join FOXCOIN with me! Tap to earn FOX, trade for real USDT on the exchange, and get a +5,000 FOX starter gift! 💰🔥`;

  const handleCopyLink = () => {
    const linkToCopy = user.isTelegram ? tgDeepLink : webLink;
    navigator.clipboard.writeText(linkToCopy);
    setCopied(true);
    sound.playCoin();
    TelegramService.triggerHaptic('medium');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    sound.playCoin();
    TelegramService.triggerHaptic('medium');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(tgDeepLink)}&text=${encodeURIComponent(shareText)}`;
    TelegramService.openLink(shareUrl);
  };

  const handleClaimMilestone = async () => {
    if (unclaimedMilestones <= 0 || isClaiming) return;
    try {
      setIsClaiming(true);
      sound.playSuccess();
      TelegramService.triggerHaptic('heavy');
      await api.claimMilestone();
      setClaimSuccess(
        `Congratulations! Claimed ${(unclaimedMilestones * 10000).toLocaleString()} FOXCOIN ($${unclaimedMilestones * 10} USD)!`
      );
      setTimeout(() => setClaimSuccess(null), 4000);
    } catch (err: any) {
      console.error('Milestone claim error:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-24 pt-2 text-white">
      {/* 10 Friends = 10,000 FOXCOIN ($10 USD) MEGA BANNER */}
      <div className="relative w-full bg-gradient-to-br from-amber-500/25 via-emerald-950/40 to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 mb-5 shadow-2xl overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Special Cash Bounty</span>
            </span>
            <span className="text-[11px] font-bold text-amber-300">
              10 Friends = $10 USD
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-700">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400">10,000 FOX = $10</span>
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-100 leading-tight">
          Earn <span className="text-emerald-400">10,000 FOXCOIN</span> for every{' '}
          <span className="text-amber-400">10 Friends Invited</span>!
        </h3>
        <p className="text-xs text-slate-300 mt-1 font-medium">
          Worth <strong className="text-emerald-400 font-extrabold">$10.00 USD cash value</strong>, withdrawable directly in the Trade section to your USDT wallet.
        </p>

        {/* Progress Bar towards next 10 friends */}
        <div className="mt-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Progress to Next $10 Milestone:</span>
            </span>
            <span className="font-black text-amber-400">
              {friendsProgress} / 10 Friends
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/40"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>
              {10 - friendsProgress === 0
                ? 'Milestone Achieved! Ready to Claim.'
                : `Only ${10 - friendsProgress} more friends to next $10 reward`}
            </span>
            <span className="font-extrabold text-slate-200">
              {currentCount} Total Referrals
            </span>
          </div>
        </div>

        {/* Claim button if unlocked */}
        {unclaimedMilestones > 0 && (
          <div className="mt-3">
            <button
              onClick={handleClaimMilestone}
              disabled={isClaiming}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-300 animate-pulse"
            >
              <Award className="w-5 h-5 text-slate-950" />
              <span>
                {isClaiming
                  ? 'Claiming Bounty...'
                  : `Claim ${(unclaimedMilestones * 10000).toLocaleString()} FOXCOIN ($${unclaimedMilestones * 10} USD)`}
              </span>
            </button>
          </div>
        )}

        {claimSuccess && (
          <div className="mt-2 p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs text-center font-bold">
            {claimSuccess}
          </div>
        )}

        {/* Quick link to Trade screen */}
        {onTradeTab && (
          <button
            onClick={onTradeTab}
            className="w-full mt-3 py-2 px-3 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-xl text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <span>Convert Referral Earnings to USD on Exchange</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        )}
      </div>

      {/* Hero Stats Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 mb-5 shadow-xl text-center">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Friends Invited
            </span>
            <div className="text-xl font-black text-slate-100 mt-0.5">
              {currentCount}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Referral Bounty
            </span>
            <div className="text-xl font-black text-amber-300 mt-0.5 flex items-center justify-center gap-1">
              <img src={foxGoldCoinImg} alt="FOX" className="w-4 h-4" />
              <span>{(user.referralEarnings || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bonus reward tiers */}
      <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2.5 px-1">
        Referral Reward Milestones
      </h4>
      <div className="space-y-2.5 mb-5">
        {/* 10 Friends special tier */}
        <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/50 rounded-2xl p-3.5 flex items-center justify-between shadow-md shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>10-Friend Milestone Pack</span>
                <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                  $10 USD Value
                </span>
              </div>
              <div className="text-[11px] text-slate-400">For every 10 invited friends</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm font-black text-emerald-400">
              <img src={foxGoldCoinImg} alt="FOX" className="w-4 h-4" />
              <span>+10,000</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 font-bold">Equal to $10 USD</span>
          </div>
        </div>

        {/* Regular friend */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100">Standard Invite Bonus</div>
              <div className="text-[11px] text-slate-400">For both you and your friend</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-black text-amber-400">
            <img src={foxGoldCoinImg} alt="FOX" className="w-4 h-4" />
            <span>+5,000</span>
          </div>
        </div>

        {/* Telegram Premium Friend */}
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="font-bold text-sm text-purple-200 flex items-center gap-1.5">
                <span>Telegram Premium Friend</span>
                <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 px-1 rounded">
                  ★ VIP
                </span>
              </div>
              <div className="text-[11px] text-slate-400">5x Special Premium Reward</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-black text-amber-400">
            <img src={foxGoldCoinImg} alt="FOX" className="w-4 h-4" />
            <span>+25,000</span>
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div className="space-y-2 mt-4">
        {/* Main Share Button */}
        <button
          onClick={handleShareTelegram}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Share Referral Link on Telegram</span>
        </button>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="w-full py-3 px-4 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-slate-200 font-bold text-xs rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-400" />
              <span>Copy Exclusive Invite Link ({user.referralCode})</span>
            </>
          )}
        </button>
      </div>

      {/* Referral Code preview */}
      <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl text-center">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
          Your Exclusive Referral Code
        </span>
        <span className="text-sm font-black text-amber-400 tracking-wider">
          {user.referralCode}
        </span>
      </div>
    </div>
  );
};
