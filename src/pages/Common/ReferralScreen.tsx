import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Gift, Copy, Share2, Check, Users, Download } from 'lucide-react';
import apiInstance from '../../api/apiInstance';
import { toastSuccess, toastError } from '../../utils/toast';

const REFERRAL_BASE_URL = 'https://ventally.app/signup?ref=';

export const ReferralScreen = () => {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const getShareCaption = () =>
    `💜 I use Ventally to talk to a real person whenever I need support — anonymously.\n\nSign up with my code and we both get 5 free minutes:\n\n🔑 Code: ${referralCode}\n🔗 Link: ${referralLink}\n\nApp Store: https://apps.apple.com/app/ventally/id6737272195\nPlay Store: https://play.google.com/store/apps/details?id=com.ventally`;

  const handleShare = () => {
    if (!referralCode) return;
    const caption = getShareCaption();
    if (navigator.share) {
      navigator.share({
        title: 'Join Ventally — get 5 free minutes',
        text: caption,
        url: referralLink,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(caption);
      toastSuccess('Referral message copied!');
    }
  };

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toastSuccess('Referral link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <PageHeader
        title="Refer & Earn"
        subtitle="Share Ventally and earn free minutes"
        onBack={() => navigate(-1)}
      />

      {/* Shareable referral graphic card — screenshottable / shareable */}
      {!loading && referralCode && (
        <div ref={cardRef} className="mb-6 rounded-3xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, #1a0a3a 0%, #0f0620 50%, #100030 100%)',
          border: '1px solid rgba(167,139,250,0.25)',
          boxShadow: '0 0 60px rgba(139,92,246,0.15)',
        }}>
          {/* Decorative top bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)' }} />
          <div className="px-6 py-8 text-center">
            {/* Logo area */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18 }}>💜</span>
              </div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px' }}>
                ventally
              </span>
            </div>
            {/* Headline */}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              You're invited
            </p>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>
              Talk to someone who cares.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Anonymous peer support, available whenever you need it.
              Sign up with my code and we <strong style={{ color: 'white' }}>both get 5 free minutes</strong>.
            </p>
            {/* Code badge */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(124,58,237,0.2)',
              border: '1.5px solid rgba(167,139,250,0.4)',
              borderRadius: 16,
              padding: '12px 32px',
              marginBottom: 20,
            }}>
              <p style={{ color: 'rgba(167,139,250,0.7)', fontSize: 11, fontWeight: 600, letterSpacing: 2, marginBottom: 4 }}>
                REFERRAL CODE
              </p>
              <p style={{ color: 'white', fontSize: 28, fontWeight: 800, letterSpacing: 6 }}>
                {referralCode}
              </p>
            </div>
            {/* Link */}
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              ventally.app/signup?ref={referralCode}
            </p>
          </div>
        </div>
      )}

      {/* Hero (collapsed to compact CTA when card is showing) */}
      {!referralCode && !loading && (
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
      )}

      {/* Referral Code + Action buttons */}
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
        <div className="grid grid-cols-2 gap-3 mb-3">
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
            disabled={!referralCode || loading}
          >
            Share
          </Button>
        </div>
        {/* Copy referral link row */}
        <button
          onClick={handleCopyLink}
          disabled={!referralLink || loading}
          className="w-full flex items-center justify-between bg-white/5 hover:bg-white/8 transition-colors rounded-xl px-4 py-3 disabled:opacity-40"
        >
          <span className="text-xs text-white/50 truncate">{referralLink || 'ventally.app/signup?ref=...'}</span>
          {copiedLink
            ? <Check size={14} className="text-green-400 flex-shrink-0 ml-2" />
            : <Copy size={14} className="text-white/40 flex-shrink-0 ml-2" />}
        </button>
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
