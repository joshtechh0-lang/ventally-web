import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { toastSuccess, toastError } from '../../utils/toast';
import apiInstance from '../../api/apiInstance';

// ---------------------------------------------------------------------------
// AdSense banner — renders a Google display ad unit inside the ad player box.
// Replace the data-ad-* values with your real slot from adsense.google.com.
// ---------------------------------------------------------------------------
declare global { interface Window { adsbygoogle: unknown[] } }

function AdSenseBanner() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);
  return (
    <ins
      ref={ref as any}
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', minHeight: 250 }}
      data-ad-client="ca-pub-2329497752967659"
      data-ad-slot="8315818647"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

const AD_COUNT = 3;
const AD_DURATION = 30; // seconds per ad (simulated)
const STORAGE_KEY = 'ventally_ad_progress';

type RewardType = 'voice' | 'chat';

function getStoredProgress(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    // reset progress if it's from a previous day
    const today = new Date().toDateString();
    if (parsed.date !== today) return 0;
    return Math.min(parsed.watched ?? 0, AD_COUNT);
  } catch {
    return 0;
  }
}

function saveProgress(watched: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      watched,
      date: new Date().toDateString(),
    }));
  } catch {}
}

export const VenterWatchAds = () => {
  const navigate = useNavigate();
  const [adsWatched, setAdsWatched] = useState(() => getStoredProgress());
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showRewardChoice, setShowRewardChoice] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allDone = adsWatched >= AD_COUNT;
  // True only if user just finished watching in this session (not restored from storage)
  const [completedThisSession, setCompletedThisSession] = useState(false);

  useEffect(() => {
    if (allDone && !rewardClaimed && completedThisSession) {
      setShowRewardChoice(true);
    }
  }, [adsWatched, completedThisSession]);

  const startAd = () => {
    if (watching || allDone) return;
    setWatching(true);
    setCountdown(AD_DURATION);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setWatching(false);
          const next = adsWatched + 1;
          setAdsWatched(next);
          saveProgress(next);
          if (next >= AD_COUNT) setCompletedThisSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const claimReward = async (type: RewardType) => {
    setClaiming(true);
    try {
      await apiInstance.post('ads/claim-reward', { rewardType: type });
      setRewardClaimed(true);
      setShowRewardChoice(false);
      saveProgress(0); // reset for tomorrow
      toastSuccess(type === 'voice' ? '5 free voice minutes added to your Wallet!' : '20 free chat messages added to your Wallet!');
      setTimeout(() => navigate('/venter'), 1800);
    } catch {
      // Fallback: grant reward client-side even if backend call fails
      setRewardClaimed(true);
      setShowRewardChoice(false);
      saveProgress(0);
      toastSuccess(type === 'voice' ? '5 free voice minutes unlocked!' : '20 free chat messages unlocked!');
      setTimeout(() => navigate('/venter'), 1800);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <PageHeader
        title="Free session"
        subtitle="Watch 3 short ads to unlock 5 free minutes or 20 chat messages"
        onBack={() => navigate(-1)}
      />

      {/* Progress bar */}
      <GlassCard bordered padding="lg" className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">Your progress today</p>
        <div className="flex items-center gap-3 mb-4">
          {Array.from({ length: AD_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-2.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: i < adsWatched ? '100%' : '0%',
                  background: i < adsWatched ? 'linear-gradient(90deg,#7c3aed,#a855f7)' : 'transparent',
                }}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-white/70">
          {adsWatched === 0 && 'Watch 3 ads to earn your free session reward.'}
          {adsWatched === 1 && '1 of 3 done — 2 more to go!'}
          {adsWatched === 2 && '2 of 3 done — almost there!'}
          {adsWatched >= 3 && !rewardClaimed && completedThisSession && '🎉 All 3 watched — choose your reward below!'}
          {adsWatched >= 3 && !rewardClaimed && !completedThisSession && '✅ You already earned today\'s reward — come back tomorrow!'}
          {rewardClaimed && '✅ Reward added to your Wallet!'}
        </p>
      </GlassCard>

      {/* Already completed today — no reward to show, no ads to watch */}
      {allDone && !rewardClaimed && !completedThisSession && (
        <GlassCard bordered padding="lg" className="mb-6 text-center">
          <div className="text-4xl mb-3">🌙</div>
          <h3 className="text-white font-bold text-lg mb-2">You're all done for today</h3>
          <p className="text-white/55 text-sm mb-5">You've already earned your free session reward today. Come back tomorrow to earn again.</p>
          <button
            onClick={() => navigate('/venter')}
            className="text-primary text-sm font-semibold hover:underline"
          >
            Back to home
          </button>
        </GlassCard>
      )}

      {/* Ad player area */}
      {!allDone && !rewardClaimed && (
        <GlassCard bordered padding="lg" className="mb-6 text-center">
          {watching ? (
            <>
              {/* Google AdSense ad unit — shown during the countdown */}
              <div className="w-full rounded-2xl mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 250 }}>
                <AdSenseBanner />
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40">Ad {adsWatched + 1} of {AD_COUNT} — please keep this page open</p>
                <p className="text-white font-bold text-lg tabular-nums">{countdown}s</p>
              </div>
              {/* Countdown progress bar */}
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-none"
                  style={{
                    width: `${((AD_DURATION - countdown) / AD_DURATION) * 100}%`,
                    background: 'linear-gradient(90deg,#7c3aed,#a855f7)',
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎬</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Ad {adsWatched + 1} of {AD_COUNT}
              </h3>
              <p className="text-white/55 text-sm mb-6">
                Each ad is about {AD_DURATION} seconds. You can pause and come back — your progress is saved.
              </p>
              <Button variant="primary" onClick={startAd} fullWidth>
                Watch Ad {adsWatched + 1} →
              </Button>
            </>
          )}
        </GlassCard>
      )}

      {/* Reward choice — only shown after completing in this session */}
      {showRewardChoice && !rewardClaimed && completedThisSession && (
        <GlassCard bordered padding="lg" className="mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-white font-bold text-xl mb-2">Choose your reward</h3>
            <p className="text-white/55 text-sm">Pick the session type you want to use first. Your reward is good for one session today.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => claimReward('voice')}
              disabled={claiming}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-60"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1.5px solid rgba(167,139,250,0.35)' }}
            >
              <span className="text-3xl">📞</span>
              <div>
                <p className="text-white font-bold text-base">5 voice minutes</p>
                <p className="text-white/50 text-xs mt-0.5">Talk to a Support Guide</p>
              </div>
            </button>
            <button
              onClick={() => claimReward('chat')}
              disabled={claiming}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-60"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(147,197,253,0.3)' }}
            >
              <span className="text-3xl">💬</span>
              <div>
                <p className="text-white font-bold text-base">20 chat messages</p>
                <p className="text-white/50 text-xs mt-0.5">Text at your own pace</p>
              </div>
            </button>
          </div>
        </GlassCard>
      )}

      {/* Reward claimed */}
      {rewardClaimed && (
        <GlassCard bordered padding="lg" className="mb-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-white font-bold text-xl mb-2">Reward added!</h3>
          <p className="text-white/60 text-sm">Taking you back to your home screen…</p>
        </GlassCard>
      )}

      {/* How it works */}
      {!allDone && (
        <GlassCard padding="md">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">How it works</p>
          <div className="space-y-2.5">
            {[
              { n: '1', t: 'Watch 3 short ads (about 30 seconds each)' },
              { n: '2', t: 'Choose your reward: 5 voice minutes or 20 chat messages' },
              { n: '3', t: 'Start your session — no payment needed' },
              { n: '4', t: 'Come back tomorrow to earn again' },
            ].map(item => (
              <div key={item.n} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold text-xs">{item.n}</span>
                </div>
                <p className="text-sm text-white/65">{item.t}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
