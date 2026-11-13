import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { StripeEmbeddedCheckout } from '../../components/ui/StripeEmbeddedCheckout';
import { usePayments } from '../../api/hooks/usePayments';
import { CreditCard, ArrowRight, ChevronRight } from 'lucide-react';
import type { RootState } from '../../store/store';
import { toastError } from '../../utils/toast';
import { cn } from '../../utils/cn';

// Pay-as-you-go top-up packs (one-time purchases)
const PAYG_PACKS = [
  {
    id: 'voice_top_up',
    label: '15 voice minutes',
    sublabel: '$0.69/min · ~15 minutes of support',
    price: 19.99,
  },
  {
    id: 'text_top_up',
    label: '50 chat messages',
    sublabel: '$0.39/min · text at your own pace',
    price: 14.99,
  },
  {
    id: 'support_boost',
    label: 'Voice + chat bundle',
    sublabel: '30 min + 50 messages · best value',
    price: 34.99,
    badge: 'Best value',
  },
];

export const VenterAddFunds = () => {
  const navigate = useNavigate();
  const { createCheckoutSession } = usePayments();

  const [selectedPack, setSelectedPack] = useState<typeof PAYG_PACKS[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handlePAYGCheckout = async () => {
    if (!selectedPack) { toastError('Please select a pack'); return; }
    setLoading(true);
    try {
      const res = await createCheckoutSession({ packType: selectedPack.id, embedded: true });
      if ((res as any)?.clientSecret) {
        setClientSecret((res as any).clientSecret);
      } else {
        toastError('Something went wrong. Please try again.');
      }
    } catch (e: any) {
      toastError(e?.error || e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutComplete = () => {
    setClientSecret(null);
    navigate('/venter/wallet/payment-success', { replace: true });
  };

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      {clientSecret && (
        <StripeEmbeddedCheckout
          clientSecret={clientSecret}
          onComplete={handleCheckoutComplete}
          onClose={() => setClientSecret(null)}
        />
      )}

      <PageHeader
        title="Start a session"
        subtitle="Three ways to get support — pick what works for you"
        onBack={() => navigate('/venter/wallet')}
      />

      {/* Option 1 — Free with ads */}
      <div
        className="mb-4 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-100"
        style={{ background: 'rgba(76,175,80,0.1)', border: '1.5px solid rgba(76,175,80,0.3)' }}
        onClick={() => navigate('/venter/watch-ads')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(76,175,80,0.2)' }}>
              <span className="text-2xl">▶</span>
            </div>
            <div>
              <p className="text-white font-bold text-base">Free with ads</p>
              <p className="text-white/60 text-sm mt-0.5">Watch 3 short ads — earn 5 voice minutes or 20 chat messages</p>
              <p className="text-green-400 text-xs font-semibold mt-1">No payment needed · resets daily</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/40 flex-shrink-0 ml-2" />
        </div>
      </div>

      {/* Option 2 — Pay as you go */}
      <div className="mb-4">
        <div className="mb-3">
          <p className="text-white font-bold text-base">Pay as you go</p>
          <p className="text-white/55 text-sm">Save a card and get billed only for the time you use.</p>
          <div className="flex gap-3 mt-2 text-xs text-white/50">
            <span>📞 $0.69/min voice</span>
            <span>·</span>
            <span>💬 $0.39/min chat</span>
          </div>
        </div>
        <Button
          variant="glass-bordered"
          size="md"
          className="w-full"
          leftIcon={<CreditCard size={16} />}
          onClick={() => navigate('/signup/payment/add')}
        >
          Save a payment method
        </Button>

        {/* One-time packs */}
        <p className="text-xs text-white/40 mt-4 mb-2 uppercase tracking-widest font-semibold">Or buy a pack upfront</p>
        <div className="space-y-2">
          {PAYG_PACKS.map(pack => {
            const isSelected = selectedPack?.id === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(pack)}
                className={cn(
                  'w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between',
                  isSelected ? 'bg-primary/10 border-primary/40' : 'glass border-white/10 hover:border-white/20'
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{pack.label}</p>
                    {pack.badge && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">{pack.badge}</span>
                    )}
                  </div>
                  <p className="text-white/50 text-xs mt-0.5">{pack.sublabel}</p>
                </div>
                <p className="text-primary font-bold text-base flex-shrink-0 ml-3">${pack.price.toFixed(2)}</p>
              </button>
            );
          })}
        </div>
        {selectedPack && (
          <Button
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading}
            rightIcon={<ArrowRight size={16} />}
            className="mt-3"
            onClick={handlePAYGCheckout}
          >
            Buy {selectedPack.label} — ${selectedPack.price.toFixed(2)}
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/35 text-xs font-medium">OR</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Option 3 — Membership */}
      <div
        className="p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-100"
        style={{ background: 'rgba(124,58,237,0.12)', border: '1.5px solid rgba(167,139,250,0.3)' }}
        onClick={() => navigate('/venter/wallet')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }}>
              <span className="text-2xl">👑</span>
            </div>
            <div>
              <p className="text-white font-bold text-base">Membership</p>
              <p className="text-white/60 text-sm mt-0.5">60 ad-free minutes every month. Unused minutes roll over.</p>
              <p className="text-primary text-xs font-semibold mt-1">From $20/mo · subscribe anytime</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/40 flex-shrink-0 ml-2" />
        </div>
      </div>
    </div>
  );
};
