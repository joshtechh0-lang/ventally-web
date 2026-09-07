import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../../components/ui/GlassCard';
import { useWallet } from '../../api/hooks/useWallet';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toastError } from '../../utils/toast';

export const VenterWallet = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { getWallet, getTransactions } = useWallet();

  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [balRes, txRes] = await Promise.allSettled([
          getWallet(),
          getTransactions(5, 0),
        ]);
        if (balRes.status === 'fulfilled') setBalance(balRes.value?.balance);
        if (txRes.status === 'fulfilled') setTransactions(txRes.value?.transactions ?? []);
      } catch {
        toastError(t('Common.errors.fetchingData'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.key]);

  const formatAmount = (amount: number) => amount?.toFixed(2) ?? '0.00';

  const getTransactionLabel = (tx: any) => {
    const type = tx.type?.toLowerCase() ?? '';
    if (type === 'session' || type === 'session_payment') {
      return t('VenterWallet.transactions.callSession', { duration: tx.durationMinutes ?? 0 });
    }
    if (type === 'deposit' || type === 'top_up') {
      return t('VenterWallet.transactions.fundsAdded');
    }
    return tx.type?.replace(/_/g, ' ') ?? t('Common.unknown');
  };

  const isCredit = (tx: any) => {
    return ['subscription_payment', 'credit_purchase', 'tip_received'].includes(tx.type);
  };

  const minutes = typeof balance === 'object' ? Math.floor(balance?.minutes ?? 0) : Math.floor(Number(balance ?? 0));
  const messages = typeof balance === 'object' ? Math.floor(balance?.messages ?? 0) : 0;

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <div className="w-full lg:max-w-3xl xl:max-w-4xl lg:mx-auto">
        <header className="mb-6 text-center lg:text-left lg:mb-8">
          <h1 className="text-lg font-medium text-white tracking-tight lg:text-2xl lg:font-bold">
            {t('Wallet.title')}
          </h1>
        </header>

        {/* Balance Card */}
        <GlassCard bordered padding="lg" className="mb-6 text-center shadow-2xl shadow-black/20 lg:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 mb-4">
            Your Balance
          </p>
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-white tabular-nums tracking-tight sm:text-5xl">
                {loading ? '-' : minutes}
              </p>
              <p className="text-xs text-white/60 mt-1">minutes</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-4xl font-bold text-white tabular-nums tracking-tight sm:text-5xl">
                {loading ? '-' : messages}
              </p>
              <p className="text-xs text-white/60 mt-1">messages</p>
            </div>
          </div>
          <div className="w-full max-w-sm mx-auto">
            <Button
              variant="glass"
              size="md"
              fullWidth
              onClick={() => navigate('/venter/wallet/add-funds')}
            >
              Top Up Minutes
            </Button>
          </div>
        </GlassCard>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Transactions */}
          <section className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-white">{t('Wallet.transactions')}</p>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                title={t('VenterWallet.noTransactions')}
                description={t('VenterWallet.noTransactionsDescription')}
              />
            ) : (
              <>
                <GlassCard padding="none" rounded="2xl" className="overflow-hidden">
                  {transactions.map((tx: any, i: number) => {
                    const credit = isCredit(tx);
                    return (
                      <div
                        key={tx.id ?? i}
                        className={`flex items-center gap-4 px-4 py-3.5 sm:px-5 ${i < transactions.length - 1 ? 'border-b border-white/5' : ''}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${credit ? 'bg-success/15' : 'bg-error/10'}`}>
                          {credit ? <ArrowDownLeft size={16} className="text-white" /> : <ArrowUpRight size={16} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{getTransactionLabel(tx)}</p>
                          <p className="text-xs text-white/80">
                            {new Date(tx.createdAt ?? tx.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </p>
                        </div>
                        <p className={`text-sm font-bold tabular-nums flex-shrink-0 ${credit ? 'text-success' : 'text-error'}`}>
                          {credit ? '+' : '-'}{formatAmount(Math.abs(tx.amountCurrency ?? tx.amount ?? 0))}
                        </p>
                      </div>
                    );
                  })}
                </GlassCard>
                {transactions.length >= 5 && (
                  <Button variant="glass" size="md" fullWidth className="mt-3" onClick={() => navigate('/venter/wallet/transactions')}>
                    {t('VenterWallet.viewAll')}
                  </Button>
                )}
              </>
            )}
          </section>

          {/* Billing Info */}
          <section className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-white">{t('SubscriptionDetails.detailTitle')}</p>
            </div>
            {loading ? (
              <div className="skeleton h-32 rounded-2xl" />
            ) : (
              <GlassCard bordered className="h-full" padding="lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">Voice Rate</p>
                    <p className="text-sm font-medium text-white text-right">$0.69/min</p>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">Chat Rate</p>
                    <p className="text-sm font-medium text-white text-right">$0.39/min</p>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">Billing</p>
                    <p className="text-sm font-medium text-white text-right">Pay as you go</p>
                  </div>
                </div>
              </GlassCard>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
