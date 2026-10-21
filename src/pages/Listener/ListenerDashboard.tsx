import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toggle } from '../../components/ui/Toggle';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAvailability } from '../../api/hooks/useAvailability';
import { setAvailability } from '../../store/slices/listenerSlice';
import type { RootState } from '../../store/store';
import { Phone, MessageSquare, ChevronRight, Bell, Sparkles, Wallet } from 'lucide-react';
import { cn } from '../../utils/cn';
import { toastError } from '../../utils/toast';
import { getUnreadNotificationCount } from '../../api/notificationsApi';

const AVAILABILITY_KEY = 'listener_availability_preference';

function readStoredAvailabilityPreference(): boolean {
  try {
    const stored = localStorage.getItem(AVAILABILITY_KEY);
    if (stored === null) return true;
    return stored === 'true';
  } catch {
    return true;
  }
}

export const ListenerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const user = useSelector((state: RootState) => state.user.user as any);
  const requests = useSelector((state: RootState) => state.listener.requests);
  const isAvailable = useSelector((state: RootState) => (state.listener as any).isAvailable as boolean);
  const { goOnline, goOffline } = useAvailability();

  const [loadingToggle, setLoadingToggle] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bankConnected, setBankConnected] = useState(false);
  const [bankStatus, setBankStatus] = useState<'not_connected' | 'pending' | 'enabled'>('not_connected');

  const handleAvailabilityToggle = async () => {
    setLoadingToggle(true);
    try {
      if (isAvailable) {
        await goOffline();
        dispatch(setAvailability(false));
        localStorage.setItem(AVAILABILITY_KEY, 'false');
      } else {
        await goOnline();
        dispatch(setAvailability(true));
        localStorage.setItem(AVAILABILITY_KEY, 'true');
      }
    } catch (e: any) {
      toastError(e?.error || t('Common.somethingWentWrong'));
    } finally {
      setLoadingToggle(false);
    }
  };

  // Align Redux with localStorage before paint so the toggle does not flash off then on.
  useLayoutEffect(() => {
    dispatch(setAvailability(readStoredAvailabilityPreference()));
  }, [dispatch]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await getUnreadNotificationCount();
        const count = (res as any)?.data?.unreadCount ?? 0;
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };
    fetchUnreadCount();
  }, []);

  // Check if bank account is connected so the "Complete Profile" banner hides correctly
  useEffect(() => {
    import('../../api/apiInstance').then(({ default: apiInstance }) => {
      apiInstance.get('earnings/bank-account/status')
        .then((res: any) => {
          const s = res?.data?.status;
          if (s?.payoutEnabled) {
            setBankConnected(true);
            setBankStatus('enabled');
          } else if (s?.stripeAccountStatus && s.stripeAccountStatus !== 'not_connected') {
            // Bank connected but Stripe hasn't enabled payouts yet (pending review)
            setBankStatus('pending');
          }
        })
        .catch(() => {});
    });
  }, []);

  // Silently refresh presence whenever the user focuses this screen (mount + window focus + tab visible)
  const presenceRunningRef = useRef(false);
  const presenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refreshPresence = async () => {
      if (presenceRunningRef.current) return;
      presenceRunningRef.current = true;
      try {
        const call = store.getState().call;
        if (call.isChatActive || call.isActive || call.isConnecting) {
          // Do not call goOffline / goOnline during an active or connecting session.
          return;
        }

        const wantsOnline = readStoredAvailabilityPreference();

        // Server “reset” — do not dispatch false in between or the toggle visibly flashes off then on.
        await goOffline();
        if (wantsOnline) {
          await goOnline();
        }
        dispatch(setAvailability(wantsOnline));
      } catch { /* silent */ }
      finally {
        presenceRunningRef.current = false;
      }
    };

    const scheduleRefresh = () => {
      if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current);
      presenceTimerRef.current = setTimeout(refreshPresence, 150);
    };

    const onFocus = () => scheduleRefresh();
    const onVisible = () => { if (document.visibilityState === 'visible') scheduleRefresh(); };

    scheduleRefresh();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || t('ListenerHome.listener', 'Listener');
  const isPendingVerification = user?.verificationDocumentStatus === 'pending' || user?.status === 'pending';

  // Force offline if pending verification
  useEffect(() => {
    if (isPendingVerification && isAvailable) {
      import('../../api/apiInstance').then(({ default: apiInstance }) => {
        apiInstance.put('availability/toggle', { isOnline: false }).catch(() => {});
      });
    }
  }, [isPendingVerification]);

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <div className="w-full lg:max-w-3xl xl:max-w-4xl lg:mx-auto space-y-6 lg:space-y-8">
        {/* Header — desktop only; mobile uses layout top bar */}
        <div className="hidden lg:flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/80 mb-1">
              {t('ListenerHome.welcomeBack', 'Welcome back,')}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {firstName} 🎧
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/listener/notifications')}
            className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0 relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Verification pending banner */}
        {isPendingVerification && (
          <GlassCard bordered padding="md" rounded="2xl" className="border-yellow-400/30 bg-yellow-400/5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-sm font-semibold text-white">Your application is under review</p>
                <p className="text-xs text-white/60 mt-1">We'll notify you by email within 24–48 hours once approved. Check your inbox for updates.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-full h-1.5">
                <div className="bg-yellow-400 h-1.5 rounded-full w-3/4" />
              </div>
              <span className="text-xs text-white/40">Step 3 of 4</span>
            </div>
          </GlassCard>
        )}

        {/* Availability */}
        {!isPendingVerification && <GlassCard bordered>
          {!localStorage.getItem('availabilityTooltipDismissed') && (
            <div className="flex items-start gap-3 bg-primary/10 rounded-xl p-3 mb-4 border border-primary/20">
              <span className="text-primary text-lg">💡</span>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">Your Availability toggle controls whether Venters can be matched to you.</p>
                <p className="text-xs text-white/60 mt-1">Keep it ON when you're ready to listen.</p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('availabilityTooltipDismissed', 'true');
                  const el = document.getElementById('availability-tooltip');
                  if (el) el.style.display = 'none';
                }}
                className="text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-base font-semibold text-white">
                {t('ListenerHome.availability', 'Availability')}
              </p>
              <p className="text-sm text-white/80 mt-0.5">
                {isAvailable
                  ? t('ListenerHome.acceptingSessions', 'You are accepting new sessions')
                  : t('ListenerHome.offlineStatus', 'You are currently offline')}
              </p>
            </div>
            <Toggle
              checked={isAvailable}
              onChange={handleAvailabilityToggle}
              disabled={loadingToggle}
              color="accent"
            />
          </div>
          {isAvailable && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
              <span className="text-xs text-primary font-medium">
                {t('ListenerHome.onlineReady', 'Online and ready')}
              </span>
            </div>
          )}
        </GlassCard>}

        {/* Incoming requests */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/80">
              {t('ListenerHome.incomingRequests', 'Incoming Requests')}
            </h2>
            {requests.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/listener/requests')} // view all requests list
                className="text-xs text-white/80 hover:text-white transition-colors flex items-center gap-1"
              >
                {t('Common.viewAll', 'View All')} <ChevronRight size={12} />
              </button>
            )}
          </div>

          {requests.length === 0 && !isPendingVerification ? (
            <GlassCard bordered padding="md" rounded="2xl">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={22} className="text-primary" />
                </div>
                <h3 className="text-white font-semibold mb-2">You're approved! Here's how to get your first session:</h3>
                <div className="text-left space-y-2 mb-4">
                  <p className="text-sm text-white/70">① Make sure Availability is <span className="text-green-400 font-medium">ON</span> above</p>
                  <p className="text-sm text-white/70">② Complete your profile so venters can match with you</p>
                  <p className="text-sm text-white/70">③ Sessions will appear here when venters are matched with you</p>
                </div>
                <p className="text-xs text-white/40">Most Listeners receive their first session within 48h of activation</p>
              </div>
            </GlassCard>
          ) : (
            <GlassCard bordered padding="none" rounded="2xl" className="overflow-hidden">
              {requests.map((item: any, index: number) => (
                <div
                  key={item.id}
                  className={cn(
                    'settings-item cursor-pointer',
                    index === 0 && 'rounded-t-2xl',
                    index === requests.length - 1 && 'rounded-b-2xl border-b-0'
                  )}
                  onClick={() => navigate(`/listener/incoming?requestId=${item.requestId ?? item.id}&type=${item.requestType === 'call' ? 'call' : 'chat'}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl glass-accent flex items-center justify-center text-accent flex-shrink-0">
                      {item.type === 'call' ? <Phone size={16} /> : <MessageSquare size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {item.type === 'call'
                          ? t('ListenerHome.callSession', 'Call Session')
                          : t('ListenerHome.chatSession', 'Chat Session')}
                      </p>
                      <p className="text-xs text-white/80 mt-0.5 truncate">{item.title}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white flex-shrink-0" />
                </div>
              ))}
            </GlassCard>
          )}
        </section>

        {/* Profile completion / payout status indicator */}
        {bankStatus !== 'enabled' && (
          <GlassCard bordered padding="md" rounded="2xl" className={bankStatus === 'pending' ? "border-blue-400/30 bg-blue-400/5" : "border-yellow-500/30 bg-yellow-500/5"}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{bankStatus === 'pending' ? '🕐' : '⚡'}</span>
              <div className="flex-1">
                {bankStatus === 'pending' ? (
                  <>
                    <p className="text-sm font-semibold text-white">Payout setup in review</p>
                    <p className="text-xs text-white/60 mt-0.5">Your bank is connected — Stripe is reviewing your account. This usually takes 1–2 business days.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-white">Complete your profile to start earning</p>
                    <p className="text-xs text-white/60 mt-0.5">Add payout details to receive session payments</p>
                  </>
                )}
              </div>
              {bankStatus !== 'pending' && (
                <button
                  onClick={() => navigate('/listener/payout-method')}
                  className="text-xs text-primary font-medium hover:underline flex-shrink-0"
                >
                  Set up →
                </button>
              )}
            </div>
          </GlassCard>
        )}

        {/* Quick access — wallet + history (no earnings summary on this screen) */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-3">
            {t('ListenerHome.quickAccess', 'Quick Access')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard
              hover
              onClick={() => navigate('/listener/wallet')}
              padding="md"
              rounded="2xl"
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-accent">
                <Wallet size={18} />
              </div>
              <p className="text-sm font-medium text-gray-300">
                {t('Navigation.tabs.wallet', 'Balance')}
              </p>
            </GlassCard>
            <GlassCard
              hover
              onClick={() => navigate('/listener/sessions')}
              padding="md"
              rounded="2xl"
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-accent">
                <MessageSquare size={18} />
              </div>
              <p className="text-sm font-medium text-gray-300">
                {t('ListenerHome.sessionHistory', 'Session History')}
              </p>
            </GlassCard>
          </div>
        </section>
      </div>
    </div>
  );
};
