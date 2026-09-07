import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useEarnings } from '../../api/hooks/useEarnings';
import { DollarSign, ArrowUpRight, ChevronRight } from 'lucide-react';

export const ListenerWallet = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getEarningsSummary, getEarningsHistory } = useEarnings();
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sumRes, histRes] = await Promise.allSettled([
          getEarningsSummary(),
          getEarningsHistory(5, 0),
        ]);
        if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
        if (histRes.status === 'fulfilled') setHistory(histRes.value?.earnings ?? []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [getEarningsHistory, getEarningsSummary]);

  const handleWithdraw = () => {
    navigate('/listener/payout-method');
  };

  const formatMoney = (n: number | null | undefined) =>
    n != null && !Number.isNaN(Number(n)) ? Number(n).toFixed(2) : '0.00';

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <div className="w-full lg:max-w-3xl xl:max-w-4xl lg:mx-auto">
        <header className="mb-6 text-center lg:mb-8">
          <h1 className="text-lg font-semibold text-white tracking-tight lg:text-2xl lg:font-bold">
            {t('Listener.wallet.title', 'Wallet')}
          </h1>
        </header>

        {/* Lifetime earnings hero — matches native mainCard */}
        <GlassCard
          bordered
          padding="lg"
          className="mb-4 text-center shadow-2xl shadow-black/20"
        >
          <p className="text-4xl sm:text-5xl font-bold text-white tabular-nums tracking-tight mb-1">
            {loading ? '—' : formatMoney(summary?.lifetimeEarnings)}
          </p>
          <p className="text-sm text-white/60 mb-6">
            {t('Listener.wallet.totalEarnings', 'Lifetime total')}
          </p>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={handleWithdraw}
          >
            {t('Listener.wallet.withdraw', 'Withdraw')}
          </Button>
        </GlassCard>

        {/* Stats row — Available for Payout + Pending balance */}
        <div className="grid grid-cols-2 gap-3 mb-6 lg:mb-8">
          <GlassCard bordered padding="md" className="text-center">
            <p className="text-xl font-bold text-white tabular-nums mb-1">
              {loading ? '—' : formatMoney(summary?.availableBalance)}
            </p>
            <p className="text-xs text-white/70">{t('Listener.wallet.availableForPayout', 'Available for Payout')}</p>
          </GlassCard>
          <GlassCard bordered padding="md" className="text-center">
            <p className="text-xl font-bold text-white tabular-nums mb-1">
              {loading ? '—' : formatMoney(summary?.pendingBalance)}
            </p>
            <p className="text-xs text-white/70">{t('Listener.wallet.pendingEarnings', 'Pending balance')}</p>
          </GlassCard>
        </div>

        {/* Earning history */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/80">
              {t('ListenerWallet.earningHistory', 'Earning History')}
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/listener/sessions')}
                className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors"
              >
                {t('Common.viewAll', 'View All')} <ChevronRight size={12} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-[4.5rem] rounded-2xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <GlassCard bordered rounded="2xl" padding="md">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <DollarSign size={22} className="text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Your first session earnings will appear here</h3>
                <p className="text-sm text-white/60 mb-1">Most Listeners receive their first session within 48h of activation.</p>
                <p className="text-xs text-white/40">Make sure your Availability is turned ON to start receiving sessions</p>
              </div>
            </GlassCard>
          ) : (
            <GlassCard padding="none" rounded="2xl" className="overflow-hidden">
              {history.map((e: any, i: number) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-4 px-4 sm:px-5 py-3.5 ${
                    i < history.length - 1 ? 'border-b border-white/8' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {e.sessionType === 'call'
                        ? t('ListenerWallet.earningCall', 'Voice session')
                        : e.sessionType === 'chat'
                          ? t('ListenerWallet.earningChat', 'Chat session')
                          : t('ListenerWallet.sessionEarning', 'Session earning')}
                    </p>
                    <p className="text-xs text-white/80">
                      {e.createdAt
                        ? new Date(e.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                        : '—'}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-success tabular-nums flex-shrink-0">
                    +{formatMoney(e.netAmount)}
                  </p>
                </div>
              ))}
            </GlassCard>
          )}
        </section>
      </div>
    </div>
  );
};
