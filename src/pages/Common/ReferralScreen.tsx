import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Gift, Copy, Share2, Check, Users } from 'lucide-react';
import apiInstance from '../../api/apiInstance';
import { toastSuccess, toastError } from '../../utils/toast';

const REFERRAL_BASE_URL = 'https://ventally.app/signup?ref=';

export const ReferralScreen = () => {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiInstance.get('referrals/my-stats')
      .then((res: any) => setReferralData(res.data?.data ?? null))
      .catch(() => toastError('Failed to load referral info'))
      .finally(() => setLoading(false));
  }, []);

  const referralCode: string = referralData?.referralCode ?? '';
  const referralLink = referralCode ? `${REFERRAL_BASE_URL}${referralCode}` : '';

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toastSuccess('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!referralCode) return;
    const shareText = `Give $5, get $5! 💜 Join Ventally using my referral code ${referralCode} and get $5 in credit. I'll get $5 too!\n\nDownload on the App Store: https://apps.apple.com/app/ventally/id6737272195\nGet it on Google Play: https://play.google.com/store/apps/details?id=com.ventally\nUse the web app: https://ventally.app`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Ventally',
        text: shareText,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toastSuccess('Referral message copied!');
    }
  };

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <PageHeader
        title="Refer & Earn"
        subtitle="Share Ventally and earn free minutes"
        onBack={() => navigate(-1)}
      />

      {/* Hero */}
      <GlassCard bordered padding="lg" className="mb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Gift size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Invite Friends, Earn Minutes</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Share your referral code with friends. When they sign up, you both get{' '}
          <strong className="text-white">5 free minutes</strong>!
        </p>
      </GlassCard>

      {/* Referral Code */}
      <GlassCard bordered padding="lg" className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Your Referral Code</p>
        {loading ? (
          <div className="skeleton h-12 rounded-xl w-full" />
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-white tracking-widest">
                {referralCode || '—'}
              </p>
            </div>
            <button
              onClick={handleCopy}
              disabled={!referralCode}
              className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors disabled:opacity-40"
            >
              {copied
                ? <Check size={20} className="text-green-400" />
                : <Copy size={20} className="text-primary" />}
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant="primary"
            fullWidth
            leftIcon={<Copy size={16} />}
            onClick={handleCopy}
            disabled={!referralCode || loading}
          >
            Copy Code
          </Button>
          <Button
            variant="glass-bordered"
            fullWidth
            leftIcon={<Share2 size={16} />}
            onClick={handleShare}
            disabled={!referralLink || loading}
          >
            Share
          </Button>
        </div>
      </GlassCard>

      {/* Stats */}
      <GlassCard bordered padding="lg" className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Users size={20} className="text-primary" />
          <p className="text-sm font-semibold text-white">Your Referral Stats</p>
        </div>
        {loading ? (
          <div className="skeleton h-16 rounded-xl w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{referralData?.totalReferred ?? 0}</p>
              <p className="text-xs text-white/50 mt-1">Total Referrals</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{referralData?.earnedRewards ?? 0}</p>
              <p className="text-xs text-white/50 mt-1">Minutes Earned</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* How it works */}
      <GlassCard bordered padding="lg">
        <p className="text-sm font-semibold text-white mb-4">How it works</p>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Share your unique referral code or link' },
            { step: '2', text: 'Friend signs up using your code' },
            { step: '3', text: 'You both get 5 free minutes instantly' },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">{item.step}</span>
              </div>
              <p className="text-sm text-white/70">{item.text}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
