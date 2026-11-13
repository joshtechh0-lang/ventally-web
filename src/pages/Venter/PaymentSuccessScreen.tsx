import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../api/hooks/useWallet';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { CheckCircle, MessageSquare, Phone, Wallet } from 'lucide-react';

export const PaymentSuccessScreen = () => {
  const navigate = useNavigate();
  const { getWallet } = useWallet();
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWallet()
      .then(res => setBalance(res?.balance))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const minutes = typeof balance === 'object' ? Math.floor(balance?.minutes ?? 0) : Math.floor(Number(balance ?? 0));
  const messages = typeof balance === 'object' ? Math.floor(balance?.messages ?? 0) : 0;

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-sm">
        {/* Success Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Top Up Successful!</h1>
          <p className="text-white/60 text-sm text-center">Your balance has been updated.</p>
        </div>

        {/* Updated Balance */}
        <GlassCard bordered padding="lg" className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">Your Wallet</p>
          {loading ? (
            <p className="text-white">Loading...</p>
          ) : (
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{minutes}</p>
                <p className="text-xs text-white/60 mt-1">minutes</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{messages}</p>
                <p className="text-xs text-white/60 mt-1">messages</p>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            leftIcon={<Phone size={18} />}
            onClick={() => navigate('/venter/home?session=voice')}
          >
            Start a Voice Session
          </Button>
          <Button
            variant="glass"
            fullWidth
            leftIcon={<MessageSquare size={18} />}
            onClick={() => navigate('/venter/home?session=text')}
          >
            Start a Text Session
          </Button>
          <Button
            variant="glass"
            fullWidth
            leftIcon={<Wallet size={18} />}
            onClick={() => navigate('/venter/wallet')}
          >
            View Wallet
          </Button>
        </div>
      </div>
    </div>
  );
};
