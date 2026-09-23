import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Link2, Copy, Check, TrendingUp, Users, DollarSign, Share2 } from 'lucide-react';
import apiInstance from '../../api/apiInstance';
import { toastSuccess, toastError } from '../../utils/toast';

export const AffiliateScreen = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get affiliate code from user profile
    apiInstance.get('user/profile')
      .then((res: any) => {
        const affiliateCode = res.data?.user?.affiliate_code;
        if (affiliateCode) {
          setCode(affiliateCode);
          return apiInstance.get(`affiliates/stats/${affiliateCode}`);
        }
      })
      .then((res: any) => {
        if (res?.data?.stats) setStats(res.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const affiliateLink = code ? `https://ventally.app/signup?aff=${code}` : '';

  const handleCopy = () => {
    if (!affiliateLink) return;
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toastSuccess('Affiliate link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!affiliateLink) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join Ventally',
        text: `Sign up on Ventally using my link!`,
        url: affiliateLink,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(affiliateLink);
      toastSuccess('Affiliate link copied!');
    }
  };

  if (!loading && !code) {
    return (
      <div className="page-wrapper page-wrapper--wide animate-fade-in">
        <PageHeader title="Affiliate Program" onBack={() => navigate(-1)} />
        <GlassCard bordered padding="lg" className="text-center">
          <Link2 size={40} className="text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Become an Affiliate</h2>
          <p className="text-white/60 text-sm mb-6">
            Earn commissions by referring new users to Ventally. Contact us to join the affiliate program.
          </p>
          <Button variant="primary" onClick={() => window.open('mailto:support@ventally.app?subject=Affiliate Program', '_blank')}>
            Apply Now
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <PageHeader
        title="Affiliate Dashboard"
        subtitle="Track your referrals and earnings"
        onBack={() => navigate(-1)}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Clicks', value: stats?.total_clicks || 0, icon: <TrendingUp size={20} className="text-primary" /> },
          { label: 'Signups', value: stats?.total_conversions || 0, icon: <Users size={20} className="text-primary" /> },
          { label: 'Earned', value: `$${Number(stats?.total_earnings || 0).toFixed(2)}`, icon: <DollarSign size={20} className="text-primary" /> },
        ].map(item => (
          <GlassCard key={item.label} bordered padding="md" className="text-center">
            <div className="flex justify-center mb-2">{item.icon}</div>
            <p className="text-2xl font-bold text-white">{loading ? '—' : item.value}</p>
            <p className="text-xs text-white/50 mt-1">{item.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Affiliate Link */}
      <GlassCard bordered padding="lg" className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Your Affiliate Link</p>
        <div className="bg-white/10 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <p className="text-sm text-white/70 flex-1 truncate">{affiliateLink || '—'}</p>
          <button onClick={handleCopy} className="flex-shrink-0">
            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-primary" />}
          </button>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" fullWidth leftIcon={<Copy size={16} />} onClick={handleCopy}>
            Copy Link
          </Button>
          <Button variant="glass" fullWidth leftIcon={<Share2 size={16} />} onClick={handleShare}>
            Share
          </Button>
        </div>
      </GlassCard>

      {/* Commission Info */}
      <GlassCard bordered padding="lg">
        <p className="text-sm font-semibold text-white mb-4">Commission Details</p>
        <div className="space-y-3">
          <div className="flex justify-between">
            <p className="text-sm text-white/60">Commission per signup</p>
            <p className="text-sm font-semibold text-white">${Number(stats?.commission_value || 5).toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-white/60">Commission type</p>
            <p className="text-sm font-semibold text-white capitalize">{stats?.commission_type?.replace('_', ' ') || 'Per Signup'}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-white/60">Status</p>
            <p className="text-sm font-semibold text-green-400 capitalize">{stats?.status || 'Active'}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
